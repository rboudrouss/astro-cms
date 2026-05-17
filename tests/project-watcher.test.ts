import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { ProjectWatcher } from '../src/main/project-watcher'

describe('ProjectWatcher', () => {
  let watcher: ProjectWatcher
  let fixtureDir: string

  beforeEach(() => {
    fixtureDir = join(tmpdir(), `watcher-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    const pagesDir = join(fixtureDir, 'src', 'pages')
    const blogDir = join(fixtureDir, 'src', 'content', 'blog')
    mkdirSync(pagesDir, { recursive: true })
    mkdirSync(blogDir, { recursive: true })
    writeFileSync(join(pagesDir, 'index.mdx'), '---\ntitle: Home\n---')
    writeFileSync(join(blogDir, 'first.mdx'), '---\ntitle: First\n---')
  })

  afterEach(() => {
    watcher?.stop()
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('calls onChange when a new file is added to src/pages/', async () => {
    const onChange = vi.fn()
    watcher = new ProjectWatcher(fixtureDir, onChange)
    watcher.start()

    await new Promise((r) => setTimeout(r, 200))

    writeFileSync(join(fixtureDir, 'src', 'pages', 'new-page.mdx'), '---\ntitle: New\n---')

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 })
  })

  it('calls onChange when a file is removed from src/content/', async () => {
    const onChange = vi.fn()
    watcher = new ProjectWatcher(fixtureDir, onChange)
    watcher.start()

    await new Promise((r) => setTimeout(r, 200))

    unlinkSync(join(fixtureDir, 'src', 'content', 'blog', 'first.mdx'))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 })
  })

  it('does not call onChange after stop()', async () => {
    const onChange = vi.fn()
    watcher = new ProjectWatcher(fixtureDir, onChange)
    watcher.start()

    await new Promise((r) => setTimeout(r, 200))
    watcher.stop()
    await new Promise((r) => setTimeout(r, 100))

    writeFileSync(join(fixtureDir, 'src', 'pages', 'after-stop.mdx'), '---\n---')

    await new Promise((r) => setTimeout(r, 500))
    expect(onChange).not.toHaveBeenCalled()
  })
})
