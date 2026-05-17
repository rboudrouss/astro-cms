import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IpcChannels } from '../shared/ipc'
import type { OpenProjectResult } from '../shared/types'
import { validateProject as validateProjectOpen } from './project-validator'
import { validateProject as validateProjectReport } from './modules/project-validator'
import { RecentProjectsStore } from './recent-projects'
import { setupAutoUpdater, installAndRestart } from './updater'
import { ThemeHotReloader } from './theme-hot-reloader'

let recentProjectsStore: RecentProjectsStore
let activeReloader: ThemeHotReloader | null = null

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
    const validation = await validateProjectOpen(dirPath)

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

  ipcMain.handle(IpcChannels.GET_LOCALE, () => {
    return app.getLocale()
  })

  ipcMain.handle(IpcChannels.UPDATE_INSTALL_AND_RESTART, () => {
    installAndRestart()
  })

  ipcMain.handle(IpcChannels.VALIDATE_PROJECT, async (_event, path: string) => {
    return validateProjectReport(path)
  })

  ipcMain.handle(IpcChannels.GET_THEME_MANIFEST, async (_event, projectPath: string) => {
    try {
      if (activeReloader) await activeReloader.stop()
      activeReloader = new ThemeHotReloader(projectPath, (updatedManifest) => {
        const windows = BrowserWindow.getAllWindows()
        for (const win of windows) {
          win.webContents.send(IpcChannels.THEME_MANIFEST_UPDATED, updatedManifest)
        }
      })
      return await activeReloader.start()
    } catch {
      return null
    }
  })
}

app.whenReady().then(() => {
  recentProjectsStore = new RecentProjectsStore(
    join(app.getPath('userData'), 'recent-projects.json')
  )
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
