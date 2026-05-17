import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  createPage,
  renamePage,
  deletePage,
  findInternalLinks,
  listPageDirectories
} from '../src/main/page-manager'

const fixtureDir = join(__dirname, '__fixtures__', 'page-manager-test')

function setupFixture(): void {
  rmSync(fixtureDir, { recursive: true, force: true })

  const pagesDir = join(fixtureDir, 'src', 'pages')
  const subDir = join(pagesDir, 'about')
  const themePath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts')

  mkdirSync(pagesDir, { recursive: true })
  mkdirSync(subDir, { recursive: true })
  mkdirSync(themePath, { recursive: true })

  writeFileSync(join(themePath, 'Default.astro'), '<html><slot /></html>')
  writeFileSync(join(themePath, 'Blog.astro'), '<html><slot /></html>')

  writeFileSync(
    join(pagesDir, 'index.mdx'),
    '---\nlayout: ../../themes/my-theme/layouts/Default.astro\ntitle: Home\n---\n\n# Home\n\n[About](/about)\n[Team](/about/team)\n'
  )
  writeFileSync(
    join(pagesDir, 'contact.mdx'),
    '---\nlayout: ../../themes/my-theme/layouts/Default.astro\ntitle: Contact\n---\n\n# Contact\n\nSee our [about page](/about).\n'
  )
  writeFileSync(
    join(subDir, 'team.mdx'),
    '---\nlayout: ../../../themes/my-theme/layouts/Default.astro\ntitle: Team\n---\n\n# Team\n'
  )
}

describe('page-manager', () => {
  beforeAll(() => {
    setupFixture()
  })

  afterAll(() => {
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  describe('createPage', () => {
    it('creates a .mdx file with correct frontmatter', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: '',
        slug: 'new-page',
        layoutPath
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      const content = readFileSync(result.filePath, 'utf-8')
      expect(content).toContain('layout:')
      expect(content).toContain('title: ""')
      expect(result.filePath).toBe(join(fixtureDir, 'src', 'pages', 'new-page.mdx'))
    })

    it('creates a page in a subdirectory', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Blog.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: 'about',
        slug: 'history',
        layoutPath
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.filePath).toBe(join(fixtureDir, 'src', 'pages', 'about', 'history.mdx'))
      const content = readFileSync(result.filePath, 'utf-8')
      expect(content).toContain('layout:')
      expect(content).toContain('Blog.astro')
    })

    it('creates missing subdirectories', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: 'deep/nested',
        slug: 'page',
        layoutPath
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(existsSync(result.filePath)).toBe(true)
    })

    it('fails when file already exists', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: '',
        slug: 'index',
        layoutPath
      })

      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBeTruthy()
    })

    it('fails when slug is empty', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: '',
        slug: '',
        layoutPath
      })

      expect(result.success).toBe(false)
    })

    it('fails when slug contains invalid characters', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: '',
        slug: 'bad page name!',
        layoutPath
      })

      expect(result.success).toBe(false)
    })

    it('computes correct relative layout path from root pages', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: '',
        slug: 'layout-test',
        layoutPath
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      const content = readFileSync(result.filePath, 'utf-8')
      expect(content).toContain('../themes/my-theme/layouts/Default.astro')
    })

    it('computes correct relative layout path from subdirectory', async () => {
      const layoutPath = join(fixtureDir, 'src', 'themes', 'my-theme', 'layouts', 'Default.astro')
      const result = await createPage({
        projectPath: fixtureDir,
        directory: 'about',
        slug: 'layout-sub-test',
        layoutPath
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      const content = readFileSync(result.filePath, 'utf-8')
      expect(content).toContain('../../themes/my-theme/layouts/Default.astro')
    })
  })

  describe('renamePage', () => {
    it('renames a page file and returns the new path', async () => {
      const oldPath = join(fixtureDir, 'src', 'pages', 'new-page.mdx')
      const newPath = await renamePage(oldPath, 'renamed-page')

      expect(newPath).toBe(join(fixtureDir, 'src', 'pages', 'renamed-page.mdx'))
      expect(existsSync(newPath)).toBe(true)
      expect(existsSync(oldPath)).toBe(false)
    })

    it('preserves file content on rename', async () => {
      const filePath = join(fixtureDir, 'src', 'pages', 'renamed-page.mdx')
      const contentBefore = readFileSync(filePath, 'utf-8')

      const newPath = await renamePage(filePath, 'preserved-page')
      const contentAfter = readFileSync(newPath, 'utf-8')

      expect(contentAfter).toBe(contentBefore)
    })

    it('throws when target already exists', async () => {
      const filePath = join(fixtureDir, 'src', 'pages', 'contact.mdx')
      await expect(renamePage(filePath, 'index')).rejects.toThrow()
    })

    it('throws when slug is invalid', async () => {
      const filePath = join(fixtureDir, 'src', 'pages', 'contact.mdx')
      await expect(renamePage(filePath, 'bad name!')).rejects.toThrow()
    })
  })

  describe('deletePage', () => {
    it('deletes the page file', async () => {
      const filePath = join(fixtureDir, 'src', 'pages', 'preserved-page.mdx')
      expect(existsSync(filePath)).toBe(true)

      await deletePage(filePath)
      expect(existsSync(filePath)).toBe(false)
    })

    it('throws when file does not exist', async () => {
      await expect(
        deletePage(join(fixtureDir, 'src', 'pages', 'nonexistent.mdx'))
      ).rejects.toThrow()
    })
  })

  describe('findInternalLinks', () => {
    it('finds pages linking to a given slug', async () => {
      const links = await findInternalLinks(fixtureDir, 'about')

      expect(links.length).toBeGreaterThan(0)
      const filePaths = links.map((l) => l.filePath)
      expect(filePaths).toContain(join(fixtureDir, 'src', 'pages', 'index.mdx'))
      expect(filePaths).toContain(join(fixtureDir, 'src', 'pages', 'contact.mdx'))
    })

    it('returns line numbers for each reference', async () => {
      const links = await findInternalLinks(fixtureDir, 'about')

      for (const link of links) {
        expect(link.line).toBeGreaterThan(0)
        expect(link.content).toBeTruthy()
      }
    })

    it('returns empty array when no links found', async () => {
      const links = await findInternalLinks(fixtureDir, 'nonexistent-slug')
      expect(links).toEqual([])
    })

    it('matches links with the slug as a path prefix', async () => {
      const links = await findInternalLinks(fixtureDir, 'about/team')
      const filePaths = links.map((l) => l.filePath)
      expect(filePaths).toContain(join(fixtureDir, 'src', 'pages', 'index.mdx'))
    })
  })

  describe('listPageDirectories', () => {
    it('lists subdirectories under src/pages/', async () => {
      const dirs = await listPageDirectories(fixtureDir)

      expect(dirs).toContain('')
      expect(dirs).toContain('about')
    })

    it('includes the root directory as empty string', async () => {
      const dirs = await listPageDirectories(fixtureDir)
      expect(dirs[0]).toBe('')
    })

    it('includes deeply nested directories', async () => {
      const dirs = await listPageDirectories(fixtureDir)
      expect(dirs).toContain('deep/nested')
    })
  })
})
