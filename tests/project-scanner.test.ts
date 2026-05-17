import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { scanProjectTree } from '../src/main/project-scanner'

const fixtureDir = join(__dirname, '__fixtures__', 'test-project')

function createFixture(): void {
  const pagesDir = join(fixtureDir, 'src', 'pages')
  const blogDir = join(fixtureDir, 'src', 'content', 'blog')
  const eventsDir = join(fixtureDir, 'src', 'content', 'events')

  mkdirSync(pagesDir, { recursive: true })
  mkdirSync(blogDir, { recursive: true })
  mkdirSync(eventsDir, { recursive: true })

  writeFileSync(join(pagesDir, 'index.mdx'), '---\ntitle: Home\n---\n# Home')
  writeFileSync(join(pagesDir, 'about.mdx'), '---\ntitle: About\n---\n# About')
  writeFileSync(join(pagesDir, 'contact.md'), '---\ntitle: Contact\n---\n# Contact')
  writeFileSync(join(pagesDir, 'style.css'), 'body {}')

  writeFileSync(join(blogDir, 'first-post.mdx'), '---\ntitle: First\n---')
  writeFileSync(join(blogDir, 'second-post.md'), '---\ntitle: Second\n---')

  writeFileSync(join(eventsDir, 'launch.mdx'), '---\ntitle: Launch\n---')
}

describe('scanProjectTree', () => {
  beforeAll(() => {
    createFixture()
  })

  afterAll(() => {
    rmSync(join(__dirname, '__fixtures__'), { recursive: true, force: true })
  })

  it('finds all .md and .mdx pages in src/pages/', async () => {
    const tree = await scanProjectTree(fixtureDir)

    expect(tree.pages).toHaveLength(3)
    const names = tree.pages.map((p) => p.name).sort()
    expect(names).toEqual(['about', 'contact', 'index'])
  })

  it('excludes non-md files from pages', async () => {
    const tree = await scanProjectTree(fixtureDir)
    const names = tree.pages.map((p) => p.name)
    expect(names).not.toContain('style')
  })

  it('finds collections from src/content/ subdirectories', async () => {
    const tree = await scanProjectTree(fixtureDir)

    expect(tree.collections).toHaveLength(2)
    const names = tree.collections.map((c) => c.name).sort()
    expect(names).toEqual(['blog', 'events'])
  })

  it('finds entries within each collection', async () => {
    const tree = await scanProjectTree(fixtureDir)

    const blog = tree.collections.find((c) => c.name === 'blog')!
    expect(blog.entries).toHaveLength(2)
    expect(blog.entries.map((e) => e.name).sort()).toEqual(['first-post', 'second-post'])

    const events = tree.collections.find((c) => c.name === 'events')!
    expect(events.entries).toHaveLength(1)
    expect(events.entries[0].name).toBe('launch')
  })

  it('sets correct types on nodes', async () => {
    const tree = await scanProjectTree(fixtureDir)

    for (const page of tree.pages) {
      expect(page.type).toBe('page')
    }
    for (const col of tree.collections) {
      expect(col.type).toBe('collection')
      for (const entry of col.entries) {
        expect(entry.type).toBe('entry')
      }
    }
  })

  it('sets correct fullPath on nodes', async () => {
    const tree = await scanProjectTree(fixtureDir)

    const indexPage = tree.pages.find((p) => p.name === 'index')!
    expect(indexPage.fullPath).toBe(join(fixtureDir, 'src', 'pages', 'index.mdx'))

    const blog = tree.collections.find((c) => c.name === 'blog')!
    const firstPost = blog.entries.find((e) => e.name === 'first-post')!
    expect(firstPost.fullPath).toBe(join(fixtureDir, 'src', 'content', 'blog', 'first-post.mdx'))
  })

  it('sets correct relativePath on nodes', async () => {
    const tree = await scanProjectTree(fixtureDir)

    const aboutPage = tree.pages.find((p) => p.name === 'about')!
    expect(aboutPage.relativePath).toBe('about.mdx')

    const blog = tree.collections.find((c) => c.name === 'blog')!
    const secondPost = blog.entries.find((e) => e.name === 'second-post')!
    expect(secondPost.relativePath).toBe('second-post.md')
  })

  it('returns empty pages when src/pages/ does not exist', async () => {
    const emptyDir = join(__dirname, '__fixtures__', 'empty-project')
    mkdirSync(emptyDir, { recursive: true })

    const tree = await scanProjectTree(emptyDir)
    expect(tree.pages).toEqual([])
    expect(tree.collections).toEqual([])
  })

  it('sorts pages alphabetically by name', async () => {
    const tree = await scanProjectTree(fixtureDir)
    const names = tree.pages.map((p) => p.name)
    expect(names).toEqual([...names].sort())
  })

  it('sorts collections alphabetically by name', async () => {
    const tree = await scanProjectTree(fixtureDir)
    const names = tree.collections.map((c) => c.name)
    expect(names).toEqual([...names].sort())
  })
})
