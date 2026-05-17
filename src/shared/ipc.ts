import type { OpenProjectResult } from './types'
import type { ValidationReport } from './validation'

export const IpcChannels = {
  OPEN_PROJECT: 'project:open',
  CLONE_PROJECT: 'project:clone',
  NEW_PROJECT: 'project:new',
  GET_RECENT_PROJECTS: 'project:get-recent',
  GET_LOCALE: 'app:get-locale',
  VALIDATE_PROJECT: 'project:validate',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_ERROR: 'update:error',
  UPDATE_INSTALL_AND_RESTART: 'update:install-and-restart',
  READ_PAGE_CONTENT: 'page:read-content',
  WRITE_PAGE_CONTENT: 'page:write-content'
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
  [IpcChannels.NEW_PROJECT]: { args: []; return: string | null }
  [IpcChannels.GET_RECENT_PROJECTS]: { args: []; return: RecentProject[] }
  [IpcChannels.GET_LOCALE]: { args: []; return: string }
  [IpcChannels.VALIDATE_PROJECT]: { args: [path: string]; return: ValidationReport }
  [IpcChannels.UPDATE_INSTALL_AND_RESTART]: { args: []; return: void }
  [IpcChannels.READ_PAGE_CONTENT]: { args: [filePath: string]; return: string }
  [IpcChannels.WRITE_PAGE_CONTENT]: { args: [filePath: string, content: string]; return: void }
}
