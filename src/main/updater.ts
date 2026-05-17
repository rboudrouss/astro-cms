import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { IpcChannels } from '../shared/ipc'

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload)
  }
}

export function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    broadcast(IpcChannels.UPDATE_AVAILABLE, {
      version: info.version,
      releaseDate: info.releaseDate
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    broadcast(IpcChannels.UPDATE_DOWNLOADED, {
      version: info.version,
      releaseDate: info.releaseDate
    })
  })

  autoUpdater.on('error', (err) => {
    broadcast(IpcChannels.UPDATE_ERROR, {
      message: err.message
    })
  })

  autoUpdater.checkForUpdates()
}

export function installAndRestart(): void {
  autoUpdater.quitAndInstall()
}
