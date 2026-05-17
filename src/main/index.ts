import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IpcChannels } from '../shared/ipc'
import type { OpenProjectResult } from '../shared/types'
import { validateProject } from './project-validator'
import { RecentProjectsStore } from './recent-projects'

let recentProjectsStore: RecentProjectsStore

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
  ipcMain.handle(IpcChannels.OPEN_PROJECT, async (): Promise<OpenProjectResult> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return { status: 'cancelled' }

    const dirPath = result.filePaths[0]
    const validation = await validateProject(dirPath)

    if (!validation.valid) {
      return { status: 'invalid', errors: validation.errors }
    }

    await recentProjectsStore.add({
      path: validation.project.path,
      name: validation.project.name
    })

    return { status: 'valid', project: validation.project }
  })

  ipcMain.handle(IpcChannels.CLONE_PROJECT, async () => {
    return null
  })

  ipcMain.handle(IpcChannels.NEW_PROJECT, async () => {
    return null
  })

  ipcMain.handle(IpcChannels.GET_RECENT_PROJECTS, async () => {
    return recentProjectsStore.load()
  })
}

app.whenReady().then(() => {
  recentProjectsStore = new RecentProjectsStore(
    join(app.getPath('userData'), 'recent-projects.json')
  )
  registerIpcHandlers()
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
