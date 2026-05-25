import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels, type RecentProject, type UpdateInfo } from '../shared/ipc'
import type { OpenProjectResult, NewProjectOptions, NewProjectResult, TemplateInfo, DepsCheckResult, DepsInstallResult, ThemeManifest, ProjectTree, DevServerStatus, BlockInstance } from '../shared/types'
import type { GitWorkflowStatus } from '../shared/git-types'
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
    ipcRenderer.invoke(IpcChannels.WRITE_PAGE_CONTENT, filePath, content),
  updateBlockProps: (
    filePath: string,
    blockName: string,
    props: Record<string, unknown>
  ): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.UPDATE_BLOCK_PROPS, filePath, blockName, props),
  getBlockProps: (filePath: string, blockName: string): Promise<Record<string, unknown> | null> =>
    ipcRenderer.invoke(IpcChannels.GET_BLOCK_PROPS, filePath, blockName),
  getPageBlocks: (filePath: string): Promise<BlockInstance[]> =>
    ipcRenderer.invoke(IpcChannels.GET_PAGE_BLOCKS, filePath),
  insertBlock: (
    filePath: string,
    blockName: string,
    props: Record<string, unknown>,
    position: number
  ): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.INSERT_BLOCK, filePath, blockName, props, position),
  deleteBlock: (filePath: string, blockIndex: number): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.DELETE_BLOCK, filePath, blockIndex),
  reorderBlocks: (filePath: string, fromIndex: number, toIndex: number): Promise<string> =>
    ipcRenderer.invoke(IpcChannels.REORDER_BLOCKS, filePath, fromIndex, toIndex),
  startDevServer: (projectPath: string): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.DEV_SERVER_START, projectPath),
  stopDevServer: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.DEV_SERVER_STOP),
  restartDevServer: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.DEV_SERVER_RESTART),
  onDevServerStatusChanged: (callback: (status: DevServerStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: DevServerStatus): void =>
      callback(status)
    ipcRenderer.on(IpcChannels.DEV_SERVER_STATUS_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.DEV_SERVER_STATUS_CHANGED, handler)
    }
  },
  onDevServerOutput: (callback: (data: { line: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { line: string }): void =>
      callback(data)
    ipcRenderer.on(IpcChannels.DEV_SERVER_OUTPUT, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.DEV_SERVER_OUTPUT, handler)
    }
  },
  getVariableOverrides: (projectPath: string): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke(IpcChannels.GET_VARIABLE_OVERRIDES, projectPath),
  setVariableOverrides: (
    projectPath: string,
    overrides: Record<string, unknown>
  ): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_VARIABLE_OVERRIDES, projectPath, overrides),
  getPageVariableOverrides: (filePath: string): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke(IpcChannels.GET_PAGE_VARIABLE_OVERRIDES, filePath),
  setPageVariableOverrides: (
    filePath: string,
    overrides: Record<string, unknown>
  ): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_PAGE_VARIABLE_OVERRIDES, filePath, overrides),
  initGitWorkflow: (projectPath: string): Promise<GitWorkflowStatus> =>
    ipcRenderer.invoke(IpcChannels.GIT_INIT_WORKFLOW, projectPath),
  gitAutoSave: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.GIT_AUTO_SAVE),
  gitSave: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.GIT_SAVE),
  gitGetStatus: (): Promise<GitWorkflowStatus | null> =>
    ipcRenderer.invoke(IpcChannels.GIT_GET_STATUS),
  onGitStatusChanged: (callback: (status: GitWorkflowStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: GitWorkflowStatus): void =>
      callback(status)
    ipcRenderer.on(IpcChannels.GIT_STATUS_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.GIT_STATUS_CHANGED, handler)
    }
  }
}

export type ElectronApi = typeof api

contextBridge.exposeInMainWorld('api', api)
