import { describe, it, expect, expectTypeOf } from 'vitest'
import {
  IpcChannels,
  type IpcHandlerMap,
  type RecentProject,
  type UpdateInfo,
  type UpdateError
} from '../src/shared/ipc'
import type { OpenProjectResult, DepsCheckResult, DepsInstallResult } from '../src/shared/types'
import type { ValidationReport } from '../src/shared/validation'

describe('IPC channel definitions', () => {
  it('defines all required channels', () => {
    expect(IpcChannels.OPEN_PROJECT).toBe('project:open')
    expect(IpcChannels.CLONE_PROJECT).toBe('project:clone')
    expect(IpcChannels.NEW_PROJECT).toBe('project:new')
    expect(IpcChannels.GET_RECENT_PROJECTS).toBe('project:get-recent')
    expect(IpcChannels.VALIDATE_PROJECT).toBe('project:validate')
  })

  it('defines update channels', () => {
    expect(IpcChannels.UPDATE_AVAILABLE).toBe('update:available')
    expect(IpcChannels.UPDATE_DOWNLOADED).toBe('update:downloaded')
    expect(IpcChannels.UPDATE_ERROR).toBe('update:error')
    expect(IpcChannels.UPDATE_INSTALL_AND_RESTART).toBe('update:install-and-restart')
  })

  it('defines dependency install channels', () => {
    expect(IpcChannels.DEPS_CHECK_NEEDED).toBe('deps:check-needed')
    expect(IpcChannels.DEPS_INSTALL).toBe('deps:install')
    expect(IpcChannels.DEPS_INSTALL_OUTPUT).toBe('deps:install-output')
  })

  it('defines dev server channels', () => {
    expect(IpcChannels.DEV_SERVER_START).toBe('dev-server:start')
    expect(IpcChannels.DEV_SERVER_STOP).toBe('dev-server:stop')
    expect(IpcChannels.DEV_SERVER_RESTART).toBe('dev-server:restart')
    expect(IpcChannels.DEV_SERVER_STATUS_CHANGED).toBe('dev-server:status-changed')
    expect(IpcChannels.DEV_SERVER_OUTPUT).toBe('dev-server:output')
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
      return: OpenProjectResult
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.GET_RECENT_PROJECTS]>().toMatchTypeOf<{
      args: []
      return: RecentProject[]
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.UPDATE_INSTALL_AND_RESTART]>().toMatchTypeOf<{
      args: []
      return: void
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.VALIDATE_PROJECT]>().toMatchTypeOf<{
      args: [path: string]
      return: ValidationReport
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.DEPS_CHECK_NEEDED]>().toMatchTypeOf<{
      args: [path: string]
      return: DepsCheckResult
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.DEPS_INSTALL]>().toMatchTypeOf<{
      args: [path: string]
      return: DepsInstallResult
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.DEV_SERVER_START]>().toMatchTypeOf<{
      args: [projectPath: string]
      return: void
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.DEV_SERVER_STOP]>().toMatchTypeOf<{
      args: []
      return: void
    }>()
    expectTypeOf<IpcHandlerMap[typeof IpcChannels.DEV_SERVER_RESTART]>().toMatchTypeOf<{
      args: []
      return: void
    }>()
  })
})
