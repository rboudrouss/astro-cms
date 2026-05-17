import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IpcChannels } from '../src/shared/ipc'

const mockSend = vi.fn()
const mockAutoUpdater = {
  autoDownload: false,
  autoInstallOnAppQuit: false,
  on: vi.fn(),
  checkForUpdates: vi.fn(),
  quitAndInstall: vi.fn()
}

vi.mock('electron-updater', () => ({
  autoUpdater: mockAutoUpdater
}))

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => [{ webContents: { send: mockSend } }])
  },
  ipcMain: { handle: vi.fn() },
  app: { on: vi.fn(), whenReady: vi.fn(() => Promise.resolve()) },
  dialog: { showOpenDialog: vi.fn() }
}))

const { setupAutoUpdater, installAndRestart } = await import('../src/main/updater')

describe('Auto-updater', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAutoUpdater.autoDownload = false
    mockAutoUpdater.autoInstallOnAppQuit = false
  })

  it('enables background download and install on quit', () => {
    setupAutoUpdater()
    expect(mockAutoUpdater.autoDownload).toBe(true)
    expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true)
  })

  it('checks for updates on setup', () => {
    setupAutoUpdater()
    expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled()
  })

  it('registers listeners for update-available, update-downloaded, and error', () => {
    setupAutoUpdater()
    const events = mockAutoUpdater.on.mock.calls.map((c) => c[0])
    expect(events).toContain('update-available')
    expect(events).toContain('update-downloaded')
    expect(events).toContain('error')
  })

  it('sends UPDATE_AVAILABLE to renderer when update is available', () => {
    setupAutoUpdater()
    const handler = mockAutoUpdater.on.mock.calls.find((c) => c[0] === 'update-available')![1]
    handler({ version: '1.2.0', releaseDate: '2026-05-17' })
    expect(mockSend).toHaveBeenCalledWith(IpcChannels.UPDATE_AVAILABLE, {
      version: '1.2.0',
      releaseDate: '2026-05-17'
    })
  })

  it('sends UPDATE_DOWNLOADED to renderer when download completes', () => {
    setupAutoUpdater()
    const handler = mockAutoUpdater.on.mock.calls.find((c) => c[0] === 'update-downloaded')![1]
    handler({ version: '1.2.0', releaseDate: '2026-05-17' })
    expect(mockSend).toHaveBeenCalledWith(IpcChannels.UPDATE_DOWNLOADED, {
      version: '1.2.0',
      releaseDate: '2026-05-17'
    })
  })

  it('sends UPDATE_ERROR to renderer on error', () => {
    setupAutoUpdater()
    const handler = mockAutoUpdater.on.mock.calls.find((c) => c[0] === 'error')![1]
    handler(new Error('Network error'))
    expect(mockSend).toHaveBeenCalledWith(IpcChannels.UPDATE_ERROR, {
      message: 'Network error'
    })
  })

  it('calls quitAndInstall when installAndRestart is invoked', () => {
    installAndRestart()
    expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalled()
  })
})
