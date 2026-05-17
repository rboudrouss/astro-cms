import { spawn as nodeSpawn, type ChildProcess } from 'child_process'
import type { DevServerStatus } from '../shared/types'

type SpawnFn = (cmd: string, args: string[], opts: object) => ChildProcess

export type DevServerBroadcaster = {
  sendStatus: (status: DevServerStatus) => void
  sendOutput: (line: string) => void
}

export class AstroDevServer {
  private _status: DevServerStatus = { state: 'stopped' }
  private child: ChildProcess | null = null
  private projectPath: string
  private broadcaster: DevServerBroadcaster
  private spawnFn: SpawnFn
  private stopped = false

  constructor(
    projectPath: string,
    broadcaster: DevServerBroadcaster,
    spawnFn: SpawnFn = nodeSpawn
  ) {
    this.projectPath = projectPath
    this.broadcaster = broadcaster
    this.spawnFn = spawnFn
  }

  get status(): DevServerStatus {
    return this._status
  }

  start(): void {
    this.stopped = false
    this.setStatus({ state: 'starting' })

    const child = this.spawnFn('pnpm', ['exec', 'astro', 'dev'], {
      cwd: this.projectPath,
      shell: true
    })
    this.child = child

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      this.broadcaster.sendOutput(text)
      this.parsePort(text)
    })

    child.stderr?.on('data', (data: Buffer) => {
      this.broadcaster.sendOutput(data.toString())
    })

    child.on('error', (err) => {
      if (this.stopped) return
      this.setStatus({ state: 'error', error: err.message })
    })

    child.on('close', (code) => {
      if (this.stopped) return
      if (code === 0) {
        this.setStatus({ state: 'stopped' })
      } else {
        this.setStatus({ state: 'error', error: `Dev server exited with code ${code}` })
      }
      this.child = null
    })
  }

  stop(): void {
    this.stopped = true
    if (this.child) {
      this.child.kill()
      this.child = null
    }
    this.setStatus({ state: 'stopped' })
  }

  restart(): void {
    this.stop()
    this.start()
  }

  private setStatus(status: DevServerStatus): void {
    this._status = status
    this.broadcaster.sendStatus(status)
  }

  private parsePort(text: string): void {
    const match = text.match(/http:\/\/localhost:(\d+)\/?/)
    if (match) {
      const port = parseInt(match[1], 10)
      const url = match[0]
      this.setStatus({ state: 'running', url, port })
    }
  }
}
