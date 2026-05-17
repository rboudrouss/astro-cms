import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject, type UpdateInfo } from '../shared/ipc'
import type { OpenProjectResult, ProjectTree } from '../shared/types'
import type { ValidationReport } from '../shared/validation'

const api = {
  openProject: (): Promise<OpenProjectResult> =>
    ipcRenderer.invoke(IpcChannels.OPEN_PROJECT),
  cloneProject: (url: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.CLONE_PROJECT, url),
  newProject: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.NEW_PROJECT),
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke(IpcChannels.GET_RECENT_PROJECTS),
  getLocale: (): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.GET_LOCALE),
  validateProject: (path: string): Promise<ValidationReport> =>
    ipcRenderer.invoke(IpcChannels.VALIDATE_PROJECT, path),
  scanProject: (path: string): Promise<ProjectTree> =>
    ipcRenderer.invoke(IpcChannels.SCAN_PROJECT, path),
  watchProject: (path: string): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.WATCH_PROJECT, path),
  unwatchProject: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.UNWATCH_PROJECT),
  onProjectTreeChanged: (callback: (tree: ProjectTree) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tree: ProjectTree): void => callback(tree)
    ipcRenderer.on(IpcChannels.PROJECT_TREE_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.PROJECT_TREE_CHANGED, handler)
    }
  },
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo): void => callback(info)
    ipcRenderer.on(IpcChannels.UPDATE_DOWNLOADED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.UPDATE_DOWNLOADED, handler)
    }
  },
  installAndRestart: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.UPDATE_INSTALL_AND_RESTART)
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
