import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject } from '../shared/ipc'
import type { OpenProjectResult } from '../shared/types'

const api = {
  openProject: (): Promise<OpenProjectResult> =>
    ipcRenderer.invoke(IpcChannels.OPEN_PROJECT),
  cloneProject: (url: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.CLONE_PROJECT, url),
  newProject: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.NEW_PROJECT),
  getRecentProjects: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke(IpcChannels.GET_RECENT_PROJECTS)
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
