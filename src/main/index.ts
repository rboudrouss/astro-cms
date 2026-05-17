import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IpcChannels } from '../shared/ipc'
import { setupAutoUpdater, installAndRestart } from './updater'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.OPEN_PROJECT, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0] ?? null
  })

  ipcMain.handle(IpcChannels.CLONE_PROJECT, async () => {
    return null
  })

  ipcMain.handle(IpcChannels.NEW_PROJECT, async () => {
    return null
  })

  ipcMain.handle(IpcChannels.GET_RECENT_PROJECTS, async () => {
    return []
  })

  ipcMain.handle(IpcChannels.UPDATE_INSTALL_AND_RESTART, () => {
    installAndRestart()
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  setupAutoUpdater()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
