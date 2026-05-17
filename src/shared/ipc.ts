import type { ValidationReport } from './validation'

export const IpcChannels = {
  OPEN_PROJECT: 'project:open',
  CLONE_PROJECT: 'project:clone',
  NEW_PROJECT: 'project:new',
  GET_RECENT_PROJECTS: 'project:get-recent',
  VALIDATE_PROJECT: 'project:validate'
} as const

export type RecentProject = {
  path: string
  name: string
  lastOpened: string
}

export type IpcHandlerMap = {
  [IpcChannels.OPEN_PROJECT]: { args: []; return: string | null }
  [IpcChannels.CLONE_PROJECT]: { args: [url: string]; return: string | null }
  [IpcChannels.NEW_PROJECT]: { args: []; return: string | null }
  [IpcChannels.GET_RECENT_PROJECTS]: { args: []; return: RecentProject[] }
  [IpcChannels.VALIDATE_PROJECT]: { args: [path: string]; return: ValidationReport }
}
