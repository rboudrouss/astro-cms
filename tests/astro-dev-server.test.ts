import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'events'
import { AstroDevServer, type DevServerBroadcaster } from '../src/main/astro-dev-server'
import type { DevServerStatus } from '../src/shared/types'

function createMockProcess() {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    kill: ReturnType<typeof vi.fn>
    pid: number
  }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  proc.pid = 1234
  return proc
}

function createMockBroadcaster(): DevServerBroadcaster {
  return {
    sendStatus: vi.fn(),
    sendOutput: vi.fn()
  }
}

describe('AstroDevServer', () => {
  it('starts in stopped state', () => {
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster)
    expect(server.status).toEqual({ state: 'stopped' })
  })

  it('transitions to starting when start() is called', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()

    expect(server.status.state).toBe('starting')
    expect(broadcaster.sendStatus).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'starting' })
    )
  })

  it('spawns pnpm exec astro dev with correct args', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()

    expect(mockSpawn).toHaveBeenCalledWith(
      'pnpm',
      ['exec', 'astro', 'dev'],
      expect.objectContaining({ cwd: '/project' })
    )
  })

  it('detects port from Astro stdout and transitions to running', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()

    proc.stdout.emit('data', Buffer.from('  🚀  astro  v5.7.13 started\n'))
    proc.stdout.emit(
      'data',
      Buffer.from('  ┃ Local    http://localhost:4321/\n')
    )

    expect(server.status).toEqual({
      state: 'running',
      url: 'http://localhost:4321/',
      port: 4321
    })
    expect(broadcaster.sendStatus).toHaveBeenCalledWith({
      state: 'running',
      url: 'http://localhost:4321/',
      port: 4321
    })
  })

  it('detects custom port', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()

    proc.stdout.emit(
      'data',
      Buffer.from('  ┃ Local    http://localhost:3000/\n')
    )

    expect(server.status).toEqual({
      state: 'running',
      url: 'http://localhost:3000/',
      port: 3000
    })
  })

  it('broadcasts stdout output', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()

    proc.stdout.emit('data', Buffer.from('some output\n'))

    expect(broadcaster.sendOutput).toHaveBeenCalledWith('some output\n')
  })

  it('broadcasts stderr output', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()

    proc.stderr.emit('data', Buffer.from('warning something\n'))

    expect(broadcaster.sendOutput).toHaveBeenCalledWith('warning something\n')
  })

  it('transitions to error when process exits with non-zero code', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    proc.emit('close', 1)

    expect(server.status).toEqual({
      state: 'error',
      error: 'Dev server exited with code 1'
    })
    expect(broadcaster.sendStatus).toHaveBeenCalledWith({
      state: 'error',
      error: 'Dev server exited with code 1'
    })
  })

  it('transitions to stopped when process exits with code 0', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    proc.emit('close', 0)

    expect(server.status.state).toBe('stopped')
  })

  it('transitions to error on spawn error', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    proc.emit('error', new Error('spawn ENOENT'))

    expect(server.status).toEqual({
      state: 'error',
      error: 'spawn ENOENT'
    })
  })

  it('kills the child process on stop()', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    server.stop()

    expect(proc.kill).toHaveBeenCalled()
  })

  it('transitions to stopped on stop()', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    server.stop()

    expect(server.status.state).toBe('stopped')
    expect(broadcaster.sendStatus).toHaveBeenCalledWith({ state: 'stopped' })
  })

  it('stop() is safe to call when already stopped', () => {
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster)
    server.stop()
    expect(server.status.state).toBe('stopped')
  })

  it('restart() stops then starts the server', () => {
    const proc1 = createMockProcess()
    const proc2 = createMockProcess()
    let callCount = 0
    const mockSpawn = vi.fn().mockImplementation(() => {
      callCount++
      return callCount === 1 ? proc1 : proc2
    })
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    server.restart()

    expect(proc1.kill).toHaveBeenCalled()
    expect(mockSpawn).toHaveBeenCalledTimes(2)
    expect(server.status.state).toBe('starting')
  })

  it('does not transition after stop if process closes later', () => {
    const proc = createMockProcess()
    const mockSpawn = vi.fn().mockReturnValue(proc)
    const broadcaster = createMockBroadcaster()
    const server = new AstroDevServer('/project', broadcaster, mockSpawn as never)

    server.start()
    server.stop()

    const statusAfterStop = { ...server.status }
    proc.emit('close', 1)

    expect(server.status).toEqual(statusAfterStop)
  })
})
