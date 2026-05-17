import type { OpenProjectResult, NewProjectOptions, NewProjectResult, TemplateInfo, DepsCheckResult, DepsInstallResult, ThemeManifest, ProjectTree } from './types'
import type { ValidationReport } from './validation'

export const IpcChannels = {
  OPEN_PROJECT: 'project:open',
  CLONE_PROJECT: 'project:clone',
  NEW_PROJECT: 'project:new',
  GET_TEMPLATES: 'project:get-templates',
  SELECT_DIRECTORY: 'dialog:select-directory',
  GET_RECENT_PROJECTS: 'project:get-recent',
  GET_LOCALE: 'app:get-locale',
  VALIDATE_PROJECT: 'project:validate',
  SCAN_PROJECT: 'project:scan',
  WATCH_PROJECT: 'project:watch',
  UNWATCH_PROJECT: 'project:unwatch',
  PROJECT_TREE_CHANGED: 'project:tree-changed',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_ERROR: 'update:error',
  UPDATE_INSTALL_AND_RESTART: 'update:install-and-restart',
  DEPS_CHECK_NEEDED: 'deps:check-needed',
  DEPS_INSTALL: 'deps:install',
  DEPS_INSTALL_OUTPUT: 'deps:install-output',
  GET_THEME_MANIFEST: 'theme:get-manifest',
  THEME_MANIFEST_UPDATED: 'theme:manifest-updated',
  READ_PAGE_CONTENT: 'page:read-content',
  WRITE_PAGE_CONTENT: 'page:write-content',
  UPDATE_BLOCK_PROPS: 'page:update-block-props',
  GET_BLOCK_PROPS: 'page:get-block-props',
  DEV_SERVER_START: 'dev-server:start',
  DEV_SERVER_STOP: 'dev-server:stop',
  DEV_SERVER_RESTART: 'dev-server:restart',
  DEV_SERVER_STATUS_CHANGED: 'dev-server:status-changed',
  DEV_SERVER_OUTPUT: 'dev-server:output'
} as const

export type RecentProject = {
  path: string
  name: string
  lastOpened: string
}

export type UpdateInfo = {
  version: string
  releaseDate: string
}

export type UpdateError = {
  message: string
}

export type IpcHandlerMap = {
  [IpcChannels.OPEN_PROJECT]: { args: []; return: OpenProjectResult }
  [IpcChannels.CLONE_PROJECT]: { args: [url: string]; return: string | null }
  [IpcChannels.NEW_PROJECT]: { args: [options: NewProjectOptions]; return: NewProjectResult }
  [IpcChannels.GET_TEMPLATES]: { args: []; return: TemplateInfo[] }
  [IpcChannels.SELECT_DIRECTORY]: { args: []; return: string | null }
  [IpcChannels.GET_RECENT_PROJECTS]: { args: []; return: RecentProject[] }
  [IpcChannels.GET_LOCALE]: { args: []; return: string }
  [IpcChannels.VALIDATE_PROJECT]: { args: [path: string]; return: ValidationReport }
  [IpcChannels.SCAN_PROJECT]: { args: [path: string]; return: ProjectTree }
  [IpcChannels.WATCH_PROJECT]: { args: [path: string]; return: void }
  [IpcChannels.UNWATCH_PROJECT]: { args: []; return: void }
  [IpcChannels.UPDATE_INSTALL_AND_RESTART]: { args: []; return: void }
  [IpcChannels.DEPS_CHECK_NEEDED]: { args: [path: string]; return: DepsCheckResult }
  [IpcChannels.DEPS_INSTALL]: { args: [path: string]; return: DepsInstallResult }
  [IpcChannels.GET_THEME_MANIFEST]: {
    args: [projectPath: string]
    return: ThemeManifest | null
  }
  [IpcChannels.READ_PAGE_CONTENT]: { args: [filePath: string]; return: string }
  [IpcChannels.WRITE_PAGE_CONTENT]: { args: [filePath: string, content: string]; return: void }
  [IpcChannels.UPDATE_BLOCK_PROPS]: {
    args: [filePath: string, blockName: string, props: Record<string, unknown>]
    return: string
  }
  [IpcChannels.GET_BLOCK_PROPS]: {
    args: [filePath: string, blockName: string]
    return: Record<string, unknown> | null
  }
  [IpcChannels.DEV_SERVER_START]: { args: [projectPath: string]; return: void }
  [IpcChannels.DEV_SERVER_STOP]: { args: []; return: void }
  [IpcChannels.DEV_SERVER_RESTART]: { args: []; return: void }
}
