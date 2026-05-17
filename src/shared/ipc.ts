import type { OpenProjectResult, NewProjectOptions, NewProjectResult, TemplateInfo, DepsCheckResult, DepsInstallResult } from './types'
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
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_ERROR: 'update:error',
  UPDATE_INSTALL_AND_RESTART: 'update:install-and-restart',
  DEPS_CHECK_NEEDED: 'deps:check-needed',
  DEPS_INSTALL: 'deps:install',
  DEPS_INSTALL_OUTPUT: 'deps:install-output'
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
  [IpcChannels.UPDATE_INSTALL_AND_RESTART]: { args: []; return: void }
  [IpcChannels.DEPS_CHECK_NEEDED]: { args: [path: string]; return: DepsCheckResult }
  [IpcChannels.DEPS_INSTALL]: { args: [path: string]; return: DepsInstallResult }
}
