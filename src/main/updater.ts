import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { IpcChannels } from '../shared/ipc'

export function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IpcChannels.UPDATE_AVAILABLE, {
        version: info.version,
        releaseDate: info.releaseDate
      })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IpcChannels.UPDATE_DOWNLOADED, {
        version: info.version,
        releaseDate: info.releaseDate
      })
    }
  })

  autoUpdater.on('error', (err) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IpcChannels.UPDATE_ERROR, {
        message: err.message
      })
    }
  })

  autoUpdater.checkForUpdates()
}

export function installAndRestart(): void {
  autoUpdater.quitAndInstall()
}
