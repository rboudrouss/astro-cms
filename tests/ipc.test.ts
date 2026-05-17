import { describe, it, expect, expectTypeOf } from 'vitest'
import {
  IpcChannels,
  type IpcHandlerMap,
  type RecentProject,
  type UpdateInfo,
  type UpdateError
} from '../src/shared/ipc'

describe('IPC channel definitions', () => {
  it('defines all required channels', () => {
    expect(IpcChannels.OPEN_PROJECT).toBe('project:open')
    expect(IpcChannels.CLONE_PROJECT).toBe('project:clone')
    expect(IpcChannels.NEW_PROJECT).toBe('project:new')
    expect(IpcChannels.GET_RECENT_PROJECTS).toBe('project:get-recent')
  })

  it('defines update channels', () => {
    expect(IpcChannels.UPDATE_AVAILABLE).toBe('update:available')
    expect(IpcChannels.UPDATE_DOWNLOADED).toBe('update:downloaded')
    expect(IpcChannels.UPDATE_ERROR).toBe('update:error')
    expect(IpcChannels.UPDATE_INSTALL_AND_RESTART).toBe('update:install-and-restart')
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

  it('has correct type shape for UpdateInfo', () => {
    const info: UpdateInfo = {
      version: '1.0.0',
      releaseDate: '2026-05-17'
    }
    expect(info.version).toBe('1.0.0')
    expect(info.releaseDate).toBe('2026-05-17')
  })

  it('has correct type shape for UpdateError', () => {
    const err: UpdateError = { message: 'Network failure' }
    expect(err.message).toBe('Network failure')
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
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.UPDATE_INSTALL_AND_RESTART]>().toMatchTypeOf<{
      args: []
      return: void
    }>()
  })
})
