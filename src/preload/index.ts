import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject, type UpdateInfo } from '../shared/ipc'
import type { OpenProjectResult, NewProjectOptions, NewProjectResult, TemplateInfo, DepsCheckResult, DepsInstallResult, ThemeManifest } from '../shared/types'
import type { ValidationReport } from '../shared/validation'

const api = {
  openProject: (): Promise<OpenProjectResult> =>
    ipcRenderer.invoke(IpcChannels.OPEN_PROJECT),
  cloneProject: (url: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.CLONE_PROJECT, url),
  getTemplates: (): Promise<TemplateInfo[]> =>
    ipcRenderer.invoke(IpcChannels.GET_TEMPLATES),
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.SELECT_DIRECTORY),
  newProject: (options: NewProjectOptions): Promise<NewProjectResult> =>
    ipcRenderer.invoke(IpcChannels.NEW_PROJECT, options),
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
  checkDepsNeeded: (path: string): Promise<DepsCheckResult> =>
    ipcRenderer.invoke(IpcChannels.DEPS_CHECK_NEEDED, path),
  installDeps: (path: string): Promise<DepsInstallResult> =>
    ipcRenderer.invoke(IpcChannels.DEPS_INSTALL, path),
  onDepsInstallOutput: (callback: (data: { line: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { line: string }): void =>
      callback(data)
    ipcRenderer.on(IpcChannels.DEPS_INSTALL_OUTPUT, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.DEPS_INSTALL_OUTPUT, handler)
    }
  },
  getThemeManifest: (projectPath: string): Promise<ThemeManifest | null> =>
    ipcRenderer.invoke(IpcChannels.GET_THEME_MANIFEST, projectPath),
  onThemeManifestUpdated: (callback: (manifest: ThemeManifest) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, manifest: ThemeManifest): void =>
      callback(manifest)
    ipcRenderer.on(IpcChannels.THEME_MANIFEST_UPDATED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.THEME_MANIFEST_UPDATED, handler)
    }
  },
  readPageContent: (filePath: string): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.READ_PAGE_CONTENT, filePath),
  writePageContent: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.WRITE_PAGE_CONTENT, filePath, content)
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
