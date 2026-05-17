import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, mkdir, writeFile, access } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { createEntry, deleteEntry, updateEntryFrontmatter } from '../src/main/entry-manager'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'entry-mgr-'))
  await mkdir(join(tmpDir, 'src', 'content', 'blog'), { recursive: true })
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe('createEntry', () => {
  it('creates an .mdx file with frontmatter', async () => {
    const result = await createEntry(tmpDir, 'blog', 'hello-world', { title: 'Hello World', draft: false })
    expect(result.status).toBe('success')
    if (result.status !== 'success') return

    expect(result.entry.name).toBe('hello-world')
    expect(result.entry.type).toBe('entry')

    const content = await readFile(result.entry.fullPath, 'utf-8')
    expect(content).toContain('title: Hello World')
    expect(content).toContain('draft: false')
    expect(content).toMatch(/^---\n/)
  })

  it('returns error if file already exists', async () => {
    await writeFile(join(tmpDir, 'src', 'content', 'blog', 'existing.mdx'), '---\ntitle: x\n---\n')
    const result = await createEntry(tmpDir, 'blog', 'existing', { title: 'Dup' })
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.message).toContain('already exists')
    }
  })

  it('creates collection directory if missing', async () => {
    const result = await createEntry(tmpDir, 'events', 'meetup', { name: 'Meetup' })
    expect(result.status).toBe('success')
    if (result.status !== 'success') return
    const content = await readFile(result.entry.fullPath, 'utf-8')
    expect(content).toContain('name: Meetup')
  })

  it('handles date values in frontmatter', async () => {
    const result = await createEntry(tmpDir, 'blog', 'dated', { pubDate: '2026-05-17' })
    expect(result.status).toBe('success')
    if (result.status !== 'success') return
    const content = await readFile(result.entry.fullPath, 'utf-8')
    expect(content).toContain('pubDate')
  })

  it('sets entry relativePath correctly', async () => {
    const result = await createEntry(tmpDir, 'blog', 'my-post', { title: 'My Post' })
    expect(result.status).toBe('success')
    if (result.status !== 'success') return
    expect(result.entry.relativePath).toBe('my-post.mdx')
  })
})

describe('deleteEntry', () => {
  it('deletes an existing entry file', async () => {
    const filePath = join(tmpDir, 'src', 'content', 'blog', 'to-delete.mdx')
    await writeFile(filePath, '---\ntitle: Delete me\n---\n')

    await deleteEntry(filePath)

    await expect(access(filePath)).rejects.toThrow()
  })

  it('throws if file does not exist', async () => {
    const filePath = join(tmpDir, 'src', 'content', 'blog', 'nonexistent.mdx')
    await expect(deleteEntry(filePath)).rejects.toThrow()
  })
})

describe('updateEntryFrontmatter', () => {
  it('updates frontmatter while preserving body', async () => {
    const filePath = join(tmpDir, 'src', 'content', 'blog', 'post.mdx')
    await writeFile(filePath, '---\ntitle: Old\ndraft: true\n---\n\n# Hello Body\n')

    await updateEntryFrontmatter(filePath, { title: 'New Title', draft: false })

    const content = await readFile(filePath, 'utf-8')
    expect(content).toContain('title: New Title')
    expect(content).toContain('draft: false')
    expect(content).toContain('# Hello Body')
  })

  it('works with empty body', async () => {
    const filePath = join(tmpDir, 'src', 'content', 'blog', 'empty.mdx')
    await writeFile(filePath, '---\ntitle: Only FM\n---\n')

    await updateEntryFrontmatter(filePath, { title: 'Updated' })

    const content = await readFile(filePath, 'utf-8')
    expect(content).toContain('title: Updated')
  })
})
