import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject, type UpdateInfo } from '../shared/ipc'
import type { OpenProjectResult, ThemeManifest } from '../shared/types'
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
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo): void => callback(info)
    ipcRenderer.on(IpcChannels.UPDATE_DOWNLOADED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.UPDATE_DOWNLOADED, handler)
    }
  },
  installAndRestart: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.UPDATE_INSTALL_AND_RESTART),
  getThemeManifest: (projectPath: string): Promise<ThemeManifest | null> =>
    ipcRenderer.invoke(IpcChannels.GET_THEME_MANIFEST, projectPath),
  onThemeManifestUpdated: (callback: (manifest: ThemeManifest) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, manifest: ThemeManifest): void =>
      callback(manifest)
    ipcRenderer.on(IpcChannels.THEME_MANIFEST_UPDATED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.THEME_MANIFEST_UPDATED, handler)
    }
  }
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
