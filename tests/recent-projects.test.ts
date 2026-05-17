import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { RecentProjectsStore } from '../src/main/recent-projects'

describe('RecentProjectsStore', () => {
  let storeDir: string
  let store: RecentProjectsStore

  beforeEach(() => {
    storeDir = mkdtempSync(join(tmpdir(), 'astro-cms-recent-'))
    store = new RecentProjectsStore(join(storeDir, 'recent-projects.json'))
  })

  it('returns empty array when no file exists', async () => {
    const projects = await store.load()
    expect(projects).toEqual([])
  })

  it('persists a project and retrieves it', async () => {
    await store.add({ path: '/tmp/my-project', name: 'my-project' })
    const projects = await store.load()
    expect(projects).toHaveLength(1)
    expect(projects[0].path).toBe('/tmp/my-project')
    expect(projects[0].name).toBe('my-project')
    expect(projects[0].lastOpened).toBeTruthy()
  })

  it('places most recently opened project first', async () => {
    await store.add({ path: '/tmp/first', name: 'first' })
    await store.add({ path: '/tmp/second', name: 'second' })
    const projects = await store.load()
    expect(projects).toHaveLength(2)
    expect(projects[0].name).toBe('second')
    expect(projects[1].name).toBe('first')
  })

  it('updates lastOpened when re-opening an existing project', async () => {
    await store.add({ path: '/tmp/proj', name: 'proj' })
    const first = await store.load()
    await new Promise((r) => setTimeout(r, 10))
    await store.add({ path: '/tmp/proj', name: 'proj' })
    const second = await store.load()
    expect(second).toHaveLength(1)
    expect(second[0].lastOpened).not.toBe(first[0].lastOpened)
  })

  it('limits to 10 recent projects', async () => {
    for (let i = 0; i < 12; i++) {
      await store.add({ path: `/tmp/proj-${i}`, name: `proj-${i}` })
    }
    const projects = await store.load()
    expect(projects).toHaveLength(10)
    expect(projects[0].name).toBe('proj-11')
  })
})
