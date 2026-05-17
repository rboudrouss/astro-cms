import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitWorkflow } from '../src/main/git-workflow'
import type { GitOps } from '../src/main/git-ops'
import type { GitConfig, GitWorkflowStatus } from '../src/shared/git-types'
import { DEFAULT_GIT_CONFIG } from '../src/shared/git-types'

function createMockGitOps(overrides: Partial<GitOps> = {}): GitOps {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    branchLocal: vi.fn().mockResolvedValue(['main']),
    currentBranch: vi.fn().mockResolvedValue('main'),
    checkout: vi.fn().mockResolvedValue(undefined),
    checkoutNewBranch: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue('abc1234'),
    status: vi.fn().mockResolvedValue({ isClean: true, files: [] }),
    push: vi.fn().mockResolvedValue(undefined),
    fetch: vi.fn().mockResolvedValue(undefined),
    revParse: vi.fn().mockImplementation(async (ref: string) => {
      if (ref === 'HEAD') return 'abc1234'
      if (ref === 'origin/astro-cms-work') return 'abc1234'
      return 'abc1234'
    }),
    log: vi.fn().mockResolvedValue([
      { hash: 'abc1234', date: '2026-05-17', message: 'test commit' }
    ]),
    ...overrides
  }
}

const TEST_CONFIG: GitConfig = { ...DEFAULT_GIT_CONFIG }

describe('GitWorkflow', () => {
  let ops: GitOps
  let onStatusChanged: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ops = createMockGitOps()
    onStatusChanged = vi.fn()
  })

  describe('initial state', () => {
    it('starts in idle state', () => {
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      expect(wf.status.state).toBe('idle')
    })

    it('has null fields before init', () => {
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      expect(wf.status.currentBranch).toBeNull()
      expect(wf.status.lastCommitHash).toBeNull()
      expect(wf.status.divergence).toBeNull()
    })
  })

  describe('init', () => {
    it('creates working branch if it does not exist', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main']),
        currentBranch: vi.fn()
          .mockResolvedValueOnce('main')
          .mockResolvedValue('astro-cms-work')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(ops.checkoutNewBranch).toHaveBeenCalledWith('astro-cms-work')
      expect(wf.status.currentBranch).toBe('astro-cms-work')
    })

    it('checks out existing working branch without creating it', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main', 'astro-cms-work']),
        currentBranch: vi.fn()
          .mockResolvedValueOnce('main')
          .mockResolvedValue('astro-cms-work')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(ops.checkout).toHaveBeenCalledWith('astro-cms-work')
      expect(ops.checkoutNewBranch).not.toHaveBeenCalled()
    })

    it('stays on working branch if already on it', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main', 'astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(ops.checkout).not.toHaveBeenCalled()
      expect(ops.checkoutNewBranch).not.toHaveBeenCalled()
    })

    it('broadcasts status after init', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main', 'astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(onStatusChanged).toHaveBeenCalled()
      const lastStatus: GitWorkflowStatus = onStatusChanged.mock.calls.at(-1)[0]
      expect(lastStatus.state).toBe('idle')
      expect(lastStatus.currentBranch).toBe('astro-cms-work')
    })

    it('sets error state if init fails', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockRejectedValue(new Error('not a git repo'))
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(wf.status.state).toBe('error')
      expect(wf.status.error).toBe('not a git repo')
    })
  })

  describe('divergence detection', () => {
    it('detects no divergence when local matches remote', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main', 'astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        revParse: vi.fn().mockResolvedValue('same-hash'),
        log: vi.fn().mockResolvedValue([])
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(wf.status.divergence).toEqual({ diverged: false, ahead: 0, behind: 0 })
    })

    it('detects divergence when remote is ahead', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main', 'astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        revParse: vi.fn().mockImplementation(async (ref: string) => {
          if (ref === 'HEAD') return 'local-hash'
          if (ref === 'origin/astro-cms-work') return 'remote-hash'
          return ref
        }),
        log: vi.fn().mockImplementation(async (_max: number, ref?: string) => {
          if (ref === 'origin/astro-cms-work..HEAD') return []
          if (ref === 'HEAD..origin/astro-cms-work') return [
            { hash: '1', date: '', message: '' },
            { hash: '2', date: '', message: '' }
          ]
          return []
        })
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(wf.status.divergence).toEqual({ diverged: true, ahead: 0, behind: 2 })
    })

    it('reports no divergence when remote branch does not exist', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['main', 'astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        fetch: vi.fn().mockResolvedValue(undefined),
        revParse: vi.fn().mockImplementation(async (ref: string) => {
          if (ref === 'origin/astro-cms-work') throw new Error('unknown revision')
          return 'abc1234'
        })
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      expect(wf.status.divergence).toEqual({ diverged: false, ahead: 0, behind: 0 })
    })
  })

  describe('autoSave', () => {
    it('stages all changes and creates a commit', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['src/pages/index.mdx'] }),
        commit: vi.fn().mockResolvedValue('def5678')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()
      onStatusChanged.mockClear()

      await wf.autoSave()

      expect(ops.add).toHaveBeenCalledWith('.')
      expect(ops.commit).toHaveBeenCalledWith(expect.stringContaining('astro-cms'))
      expect(wf.status.lastCommitHash).toBe('def5678')
    })

    it('skips commit when working tree is clean', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: true, files: [] })
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()
      onStatusChanged.mockClear()

      await wf.autoSave()

      expect(ops.commit).not.toHaveBeenCalled()
    })

    it('transitions to committing and back to idle', async () => {
      const states: string[] = []
      onStatusChanged = vi.fn((s: GitWorkflowStatus) => states.push(s.state))

      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['f.mdx'] }),
        commit: vi.fn().mockResolvedValue('hash')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()
      states.length = 0

      await wf.autoSave()

      expect(states).toContain('committing')
      expect(states.at(-1)).toBe('idle')
    })

    it('sets error state if commit fails', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['f.mdx'] }),
        commit: vi.fn().mockRejectedValue(new Error('commit failed'))
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      await wf.autoSave()

      expect(wf.status.state).toBe('error')
      expect(wf.status.error).toBe('commit failed')
    })

    it('rejects autoSave when not in idle state', async () => {
      let commitResolve: (v: string) => void
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['f.mdx'] }),
        commit: vi.fn().mockImplementation(() => new Promise<string>((r) => { commitResolve = r }))
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      const first = wf.autoSave()
      // Flush microtasks so autoSave reaches the committing state
      await new Promise((r) => setTimeout(r, 10))
      expect(wf.status.state).toBe('committing')
      await expect(wf.autoSave()).rejects.toThrow('already in progress')
      commitResolve!('hash')
      await first
    })
  })

  describe('save (push to remote)', () => {
    it('pushes working branch to remote', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: true, files: [] })
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      await wf.save()

      expect(ops.push).toHaveBeenCalledWith('origin', 'astro-cms-work')
    })

    it('auto-commits dirty changes before pushing', async () => {
      const callOrder: string[] = []
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['f.mdx'] }),
        add: vi.fn().mockImplementation(async () => { callOrder.push('add') }),
        commit: vi.fn().mockImplementation(async () => { callOrder.push('commit'); return 'h' }),
        push: vi.fn().mockImplementation(async () => { callOrder.push('push') })
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      await wf.save()

      expect(callOrder).toEqual(['add', 'commit', 'push'])
    })

    it('transitions through pushing state', async () => {
      const states: string[] = []
      onStatusChanged = vi.fn((s: GitWorkflowStatus) => states.push(s.state))

      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: true, files: [] })
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()
      states.length = 0

      await wf.save()

      expect(states).toContain('pushing')
      expect(states.at(-1)).toBe('idle')
    })

    it('sets error state if push fails', async () => {
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: true, files: [] }),
        push: vi.fn().mockRejectedValue(new Error('push rejected'))
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged)
      await wf.init()

      await wf.save()

      expect(wf.status.state).toBe('error')
      expect(wf.status.error).toBe('push rejected')
    })
  })

  describe('debounced file change', () => {
    it('debounces multiple file changes into a single auto-save', async () => {
      vi.useFakeTimers()
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['a.mdx'] }),
        commit: vi.fn().mockResolvedValue('hash')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged, 500)
      await wf.init()

      wf.onFileChanged()
      wf.onFileChanged()
      wf.onFileChanged()

      expect(ops.commit).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(500)

      expect(ops.commit).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })

    it('resets debounce timer on each call', async () => {
      vi.useFakeTimers()
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work'),
        status: vi.fn().mockResolvedValue({ isClean: false, files: ['a.mdx'] }),
        commit: vi.fn().mockResolvedValue('hash')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged, 500)
      await wf.init()

      wf.onFileChanged()
      await vi.advanceTimersByTimeAsync(300)
      wf.onFileChanged()
      await vi.advanceTimersByTimeAsync(300)

      expect(ops.commit).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(200)

      expect(ops.commit).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
  })

  describe('custom config', () => {
    it('uses custom branch names', async () => {
      const customConfig: GitConfig = {
        workingBranch: 'cms-draft',
        productionBranch: 'production',
        remote: 'upstream'
      }
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['production']),
        currentBranch: vi.fn()
          .mockResolvedValueOnce('production')
          .mockResolvedValue('cms-draft')
      })
      const wf = new GitWorkflow('/project', customConfig, ops, onStatusChanged)
      await wf.init()

      expect(ops.checkoutNewBranch).toHaveBeenCalledWith('cms-draft')
      expect(wf.status.currentBranch).toBe('cms-draft')
    })
  })

  describe('dispose', () => {
    it('clears pending debounce timer', () => {
      vi.useFakeTimers()
      ops = createMockGitOps({
        branchLocal: vi.fn().mockResolvedValue(['astro-cms-work']),
        currentBranch: vi.fn().mockResolvedValue('astro-cms-work')
      })
      const wf = new GitWorkflow('/project', TEST_CONFIG, ops, onStatusChanged, 500)

      wf.onFileChanged()
      wf.dispose()

      vi.advanceTimersByTime(1000)
      expect(ops.status).not.toHaveBeenCalled()
      vi.useRealTimers()
    })
  })
})
