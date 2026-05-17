import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { EventEmitter } from 'events'
import {
  detectPackageManager,
  needsInstall,
  installDependencies
} from '../src/main/dependency-installer'

describe('dependency-installer', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'deps-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('needsInstall', () => {
    it('returns true when node_modules is absent', async () => {
      expect(await needsInstall(tempDir)).toBe(true)
    })

    it('returns false when node_modules exists', async () => {
      await mkdir(join(tempDir, 'node_modules'))
      expect(await needsInstall(tempDir)).toBe(false)
    })
  })

  describe('detectPackageManager', () => {
    it('returns pnpm when pnpm-lock.yaml exists', async () => {
      await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
      expect(await detectPackageManager(tempDir)).toBe('pnpm')
    })

    it('returns npm when package-lock.json exists', async () => {
      await writeFile(join(tempDir, 'package-lock.json'), '')
      expect(await detectPackageManager(tempDir)).toBe('npm')
    })

    it('returns yarn when yarn.lock exists', async () => {
      await writeFile(join(tempDir, 'yarn.lock'), '')
      expect(await detectPackageManager(tempDir)).toBe('yarn')
    })

    it('returns npm as default when no lockfile is present', async () => {
      expect(await detectPackageManager(tempDir)).toBe('npm')
    })

    it('prefers pnpm over npm when both lockfiles exist', async () => {
      await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
      await writeFile(join(tempDir, 'package-lock.json'), '')
      expect(await detectPackageManager(tempDir)).toBe('pnpm')
    })
  })

  describe('installDependencies', () => {
    function createMockProcess() {
      const proc = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter
        stderr: EventEmitter
      }
      proc.stdout = new EventEmitter()
      proc.stderr = new EventEmitter()
      return proc
    }

    function createMockSender() {
      return {
        send: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false)
      } as unknown as Electron.WebContents
    }

    it('resolves with success when process exits with code 0', async () => {
      const proc = createMockProcess()
      const mockSpawn = vi.fn().mockReturnValue(proc)
      const sender = createMockSender()

      const promise = installDependencies(tempDir, 'pnpm', sender, mockSpawn as never)
      proc.emit('close', 0)

      const result = await promise
      expect(result).toEqual({ success: true, packageManager: 'pnpm' })
      expect(mockSpawn).toHaveBeenCalledWith('pnpm', ['install'], expect.objectContaining({ cwd: tempDir }))
    })

    it('resolves with failure when process exits with non-zero code', async () => {
      const proc = createMockProcess()
      const mockSpawn = vi.fn().mockReturnValue(proc)
      const sender = createMockSender()

      const promise = installDependencies(tempDir, 'npm', sender, mockSpawn as never)
      proc.emit('close', 1)

      const result = await promise
      expect(result).toEqual({
        success: false,
        error: 'npm install exited with code 1',
        packageManager: 'npm'
      })
    })

    it('streams stdout to sender via IPC', async () => {
      const proc = createMockProcess()
      const mockSpawn = vi.fn().mockReturnValue(proc)
      const sender = createMockSender()

      const promise = installDependencies(tempDir, 'pnpm', sender, mockSpawn as never)
      proc.stdout.emit('data', Buffer.from('Installing packages...'))
      proc.emit('close', 0)

      await promise
      expect(sender.send).toHaveBeenCalledWith(
        'deps:install-output',
        { line: 'Installing packages...' }
      )
    })

    it('streams stderr to sender via IPC', async () => {
      const proc = createMockProcess()
      const mockSpawn = vi.fn().mockReturnValue(proc)
      const sender = createMockSender()

      const promise = installDependencies(tempDir, 'yarn', sender, mockSpawn as never)
      proc.stderr.emit('data', Buffer.from('warning something'))
      proc.emit('close', 0)

      await promise
      expect(sender.send).toHaveBeenCalledWith(
        'deps:install-output',
        { line: 'warning something' }
      )
    })

    it('resolves with failure on spawn error', async () => {
      const proc = createMockProcess()
      const mockSpawn = vi.fn().mockReturnValue(proc)
      const sender = createMockSender()

      const promise = installDependencies(tempDir, 'pnpm', sender, mockSpawn as never)
      proc.emit('error', new Error('spawn ENOENT'))

      const result = await promise
      expect(result).toEqual({
        success: false,
        error: 'spawn ENOENT',
        packageManager: 'pnpm'
      })
    })
  })
})
