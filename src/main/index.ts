import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IpcChannels } from '../shared/ipc'
import type { OpenProjectResult, NewProjectOptions, NewProjectResult } from '../shared/types'
import { validateProject as validateProjectOpen } from './project-validator'
import { validateProject as validateProjectReport } from './modules/project-validator'
import { RecentProjectsStore } from './recent-projects'
import { setupAutoUpdater, installAndRestart } from './updater'
import { getTemplates } from './templates'
import { generateProject } from './project-generator'
import { needsInstall, detectPackageManager, installDependencies } from './dependency-installer'
import { ThemeHotReloader } from './theme-hot-reloader'
import { readPageContent, writePageContent } from './page-file'
import { updateBlockProps, extractBlockProps } from './mdx-block-updater'
import { scanProjectTree } from './project-scanner'
import { ProjectWatcher } from './project-watcher'
import { AstroDevServer } from './astro-dev-server'
import { loadCollectionSchema } from './collection-schema-parser'
import { createEntry, deleteEntry, updateEntryFrontmatter } from './entry-manager'

let recentProjectsStore: RecentProjectsStore
let activeReloader: ThemeHotReloader | null = null
let activeWatcher: ProjectWatcher | null = null
let activeDevServer: AstroDevServer | null = null

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

  ipcMain.handle(IpcChannels.GET_TEMPLATES, () => {
    return getTemplates()
  })

  ipcMain.handle(IpcChannels.SELECT_DIRECTORY, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle(
    IpcChannels.NEW_PROJECT,
    async (_event, options: NewProjectOptions): Promise<NewProjectResult> => {
      const result = await generateProject(options)
      if (result.status === 'success') {
        await recentProjectsStore.add({
          path: result.project.path,
          name: result.project.name
        })
      }
      return result
    }
  )

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

  ipcMain.handle(IpcChannels.DEPS_CHECK_NEEDED, async (_event, path: string) => {
    const needed = await needsInstall(path)
    if (!needed) return { needed: false }
    const pm = await detectPackageManager(path)
    return { needed: true, packageManager: pm }
  })

  ipcMain.handle(IpcChannels.DEPS_INSTALL, async (event, path: string) => {
    const pm = await detectPackageManager(path)
    return installDependencies(path, pm, event.sender)
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

  ipcMain.handle(IpcChannels.READ_PAGE_CONTENT, async (_event, filePath: string) => {
    return readPageContent(filePath)
  })

  ipcMain.handle(
    IpcChannels.WRITE_PAGE_CONTENT,
    async (_event, filePath: string, content: string) => {
      await writePageContent(filePath, content)
    }
  )

  ipcMain.handle(
    IpcChannels.UPDATE_BLOCK_PROPS,
    async (_event, filePath: string, blockName: string, props: Record<string, unknown>) => {
      const source = await readPageContent(filePath)
      const updated = await updateBlockProps(source, blockName, props)
      await writePageContent(filePath, updated)
      return updated
    }
  )

  ipcMain.handle(
    IpcChannels.GET_BLOCK_PROPS,
    async (_event, filePath: string, blockName: string) => {
      const source = await readPageContent(filePath)
      return extractBlockProps(source, blockName)
    }
  )

  ipcMain.handle(IpcChannels.SCAN_PROJECT, async (_event, path: string) => {
    return scanProjectTree(path)
  })

  ipcMain.handle(IpcChannels.WATCH_PROJECT, async (_event, projectPath: string) => {
    if (activeWatcher) {
      activeWatcher.stop()
    }
    activeWatcher = new ProjectWatcher(projectPath, async () => {
      const tree = await scanProjectTree(projectPath)
      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        win.webContents.send(IpcChannels.PROJECT_TREE_CHANGED, tree)
      }
    })
    activeWatcher.start()
  })

  ipcMain.handle(IpcChannels.UNWATCH_PROJECT, () => {
    if (activeWatcher) {
      activeWatcher.stop()
      activeWatcher = null
    }
  })

  ipcMain.handle(IpcChannels.DEV_SERVER_START, (_event, projectPath: string) => {
    if (activeDevServer) activeDevServer.stop()
    const broadcast = (channel: string, data: unknown): void => {
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel, data)
      }
    }
    activeDevServer = new AstroDevServer(projectPath, {
      sendStatus: (status) => broadcast(IpcChannels.DEV_SERVER_STATUS_CHANGED, status),
      sendOutput: (line) => broadcast(IpcChannels.DEV_SERVER_OUTPUT, { line })
    })
    activeDevServer.start()
  })

  ipcMain.handle(IpcChannels.DEV_SERVER_STOP, () => {
    if (activeDevServer) {
      activeDevServer.stop()
      activeDevServer = null
    }
  })

  ipcMain.handle(IpcChannels.DEV_SERVER_RESTART, () => {
    if (activeDevServer) {
      activeDevServer.restart()
    }
  })

  ipcMain.handle(
    IpcChannels.GET_COLLECTION_SCHEMA,
    async (_event, projectPath: string, collectionName: string) => {
      return loadCollectionSchema(projectPath, collectionName)
    }
  )

  ipcMain.handle(
    IpcChannels.CREATE_ENTRY,
    async (_event, projectPath: string, collectionName: string, slug: string, frontmatter: Record<string, unknown>) => {
      return createEntry(projectPath, collectionName, slug, frontmatter)
    }
  )

  ipcMain.handle(IpcChannels.DELETE_ENTRY, async (_event, filePath: string) => {
    await deleteEntry(filePath)
  })

  ipcMain.handle(
    IpcChannels.UPDATE_ENTRY_FRONTMATTER,
    async (_event, filePath: string, frontmatter: Record<string, unknown>) => {
      await updateEntryFrontmatter(filePath, frontmatter)
    }
  )
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
  if (activeDevServer) {
    activeDevServer.stop()
    activeDevServer = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
