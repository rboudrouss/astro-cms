import type { GitOps } from './git-ops'
import type { GitConfig, GitWorkflowStatus, DivergenceInfo } from '../shared/git-types'

const AUTO_SAVE_MESSAGE = 'astro-cms: auto-save'

export class GitWorkflow {
  private _status: GitWorkflowStatus = {
    state: 'idle',
    currentBranch: null,
    lastCommitHash: null,
    lastCommitTime: null,
    divergence: null,
    error: null
  }

  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private readonly config: GitConfig
  private readonly ops: GitOps
  private readonly onStatusChanged: (status: GitWorkflowStatus) => void
  private readonly debounceMs: number

  constructor(
    projectPath: string,
    config: GitConfig,
    ops: GitOps,
    onStatusChanged: (status: GitWorkflowStatus) => void,
    debounceMs = 500
  ) {
    this.config = config
    this.ops = ops
    this.onStatusChanged = onStatusChanged
    this.debounceMs = debounceMs
  }

  get status(): GitWorkflowStatus {
    return this._status
  }

  async init(): Promise<void> {
    try {
      const branches = await this.ops.branchLocal()
      const current = await this.ops.currentBranch()

      if (current !== this.config.workingBranch) {
        if (branches.includes(this.config.workingBranch)) {
          await this.ops.checkout(this.config.workingBranch)
        } else {
          await this.ops.checkoutNewBranch(this.config.workingBranch)
        }
      }

      const branch = await this.ops.currentBranch()
      const divergence = await this.checkDivergence()
      const lastLog = await this.ops.log(1)
      const lastEntry = lastLog[0] ?? null

      this.setStatus({
        state: 'idle',
        currentBranch: branch,
        lastCommitHash: lastEntry?.hash ?? null,
        lastCommitTime: lastEntry?.date ?? null,
        divergence,
        error: null
      })
    } catch (err) {
      this.setStatus({
        ...this._status,
        state: 'error',
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  async autoSave(): Promise<void> {
    if (this._status.state !== 'idle') {
      throw new Error('already in progress')
    }

    const st = await this.ops.status()
    if (st.isClean) return

    this.setStatus({ ...this._status, state: 'committing' })
    try {
      await this.ops.add('.')
      const hash = await this.ops.commit(AUTO_SAVE_MESSAGE)
      this.setStatus({
        ...this._status,
        state: 'idle',
        lastCommitHash: hash,
        lastCommitTime: new Date().toISOString(),
        error: null
      })
    } catch (err) {
      this.setStatus({
        ...this._status,
        state: 'error',
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  async save(): Promise<void> {
    if (this._status.state !== 'idle') {
      throw new Error('already in progress')
    }

    const st = await this.ops.status()
    if (!st.isClean) {
      await this.ops.add('.')
      await this.ops.commit(AUTO_SAVE_MESSAGE)
    }

    this.setStatus({ ...this._status, state: 'pushing' })
    try {
      await this.ops.push(this.config.remote, this.config.workingBranch)
      this.setStatus({
        ...this._status,
        state: 'idle',
        error: null
      })
    } catch (err) {
      this.setStatus({
        ...this._status,
        state: 'error',
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  onFileChanged(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      this.autoSave().catch(() => {})
    }, this.debounceMs)
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  private async checkDivergence(): Promise<DivergenceInfo> {
    try {
      await this.ops.fetch(this.config.remote)
    } catch {
      return { diverged: false, ahead: 0, behind: 0 }
    }

    try {
      const remoteRef = `${this.config.remote}/${this.config.workingBranch}`
      const localHash = await this.ops.revParse('HEAD')
      const remoteHash = await this.ops.revParse(remoteRef)

      if (localHash === remoteHash) {
        return { diverged: false, ahead: 0, behind: 0 }
      }

      const aheadLog = await this.ops.log(100, `${remoteRef}..HEAD`)
      const behindLog = await this.ops.log(100, `HEAD..${remoteRef}`)

      const ahead = aheadLog.length
      const behind = behindLog.length

      return { diverged: behind > 0, ahead, behind }
    } catch {
      return { diverged: false, ahead: 0, behind: 0 }
    }
  }

  private setStatus(status: GitWorkflowStatus): void {
    this._status = status
    this.onStatusChanged(status)
  }
}
