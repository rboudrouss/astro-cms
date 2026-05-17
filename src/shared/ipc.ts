export const IpcChannels = {
  OPEN_PROJECT: 'project:open',
  CLONE_PROJECT: 'project:clone',
  NEW_PROJECT: 'project:new',
  GET_RECENT_PROJECTS: 'project:get-recent'
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
}
