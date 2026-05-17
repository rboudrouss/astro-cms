import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject } from '../shared/ipc'

const api = {
  openProject: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.OPEN_PROJECT),
  cloneProject: (url: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.CLONE_PROJECT, url),
  newProject: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.NEW_PROJECT),
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke(IpcChannels.GET_RECENT_PROJECTS),
  getLocale: (): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.GET_LOCALE)
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
