import { describe, it, expect, expectTypeOf } from 'vitest'
import { IpcChannels, type IpcHandlerMap, type RecentProject } from '../src/shared/ipc'

describe('IPC channel definitions', () => {
  it('defines all required channels', () => {
    expect(IpcChannels.OPEN_PROJECT).toBe('project:open')
    expect(IpcChannels.CLONE_PROJECT).toBe('project:clone')
    expect(IpcChannels.NEW_PROJECT).toBe('project:new')
    expect(IpcChannels.GET_RECENT_PROJECTS).toBe('project:get-recent')
  })

  it('has correct type shape for RecentProject', () => {
    const project: RecentProject = {
      path: '/tmp/test',
      name: 'test',
      lastOpened: '2026-01-01'
    }
    expect(project.path).toBe('/tmp/test')
    expect(project.name).toBe('test')
    expect(project.lastOpened).toBe('2026-01-01')
  })

  it('has handler map types defined for all channels', () => {
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.OPEN_PROJECT]>().toMatchTypeOf<{
      args: []
      return: string | null
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.GET_RECENT_PROJECTS]>().toMatchTypeOf<{
      args: []
      return: RecentProject[]
    }>()
  })
})
