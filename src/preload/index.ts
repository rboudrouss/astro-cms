import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject } from '../shared/ipc'
import type { ValidationReport } from '../shared/validation'

const api = {
  openProject: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.OPEN_PROJECT),
  cloneProject: (url: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.CLONE_PROJECT, url),
  newProject: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.NEW_PROJECT),
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke(IpcChannels.GET_RECENT_PROJECTS),
  validateProject: (path: string): Promise<ValidationReport> =>
    ipcRenderer.invoke(IpcChannels.VALIDATE_PROJECT, path)
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
