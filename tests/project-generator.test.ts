import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, access, readdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { generateProject } from '../src/main/project-generator'
import { getTemplates } from '../src/main/templates'
import { validateProject } from '../src/main/project-validator'

describe('getTemplates', () => {
  it('returns at least 2 templates', () => {
    const templates = getTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(2)
  })

  it('includes a vitrine-asso template', () => {
    const templates = getTemplates()
    expect(templates.some((t) => t.id === 'vitrine-asso')).toBe(true)
  })

  it('includes a blog template', () => {
    const templates = getTemplates()
    expect(templates.some((t) => t.id === 'blog')).toBe(true)
  })

  it('each template has required fields', () => {
    const templates = getTemplates()
    for (const t of templates) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.themeName).toBeTruthy()
    }
  })
})

describe('generateProject', () => {
  let parentDir: string

  beforeEach(async () => {
    parentDir = await mkdtemp(join(tmpdir(), 'astro-cms-gen-'))
  })

  afterEach(async () => {
    await rm(parentDir, { recursive: true, force: true })
  })

  it('creates the project directory', async () => {
    const result = await generateProject({
      templateId: 'blog',
      projectName: 'mon-blog',
      parentDir,
      initGit: false
    })

    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.project.name).toBe('mon-blog')
      expect(result.project.path).toBe(join(parentDir, 'mon-blog'))
    }
  })

  it('generates astro-cms.config.ts', async () => {
    await generateProject({
      templateId: 'blog',
      projectName: 'test-blog',
      parentDir,
      initGit: false
    })

    const configPath = join(parentDir, 'test-blog', 'astro-cms.config.ts')
    await expect(access(configPath)).resolves.toBeUndefined()
    const content = await readFile(configPath, 'utf-8')
    expect(content).toContain('defineProject')
    expect(content).toContain('astro-cms.theme')
  })

  it('generates package.json with astro dependency', async () => {
    await generateProject({
      templateId: 'blog',
      projectName: 'test-blog',
      parentDir,
      initGit: false
    })

    const pkgPath = join(parentDir, 'test-blog', 'package.json')
    const raw = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(raw)
    expect(pkg.name).toBe('test-blog')
    expect(pkg.dependencies.astro).toBeTruthy()
  })

  it('generates theme manifest with correct name', async () => {
    const templates = getTemplates()
    const blogTemplate = templates.find((t) => t.id === 'blog')!

    await generateProject({
      templateId: 'blog',
      projectName: 'test-blog',
      parentDir,
      initGit: false
    })

    const themePath = join(
      parentDir,
      'test-blog',
      'src',
      'themes',
      blogTemplate.themeName,
      'astro-cms.theme.ts'
    )
    const content = await readFile(themePath, 'utf-8')
    expect(content).toContain('defineTheme')
    expect(content).toContain(`name: "${blogTemplate.themeName}"`)
  })

  it('creates src/pages with an example page', async () => {
    await generateProject({
      templateId: 'blog',
      projectName: 'test-blog',
      parentDir,
      initGit: false
    })

    const pagesDir = join(parentDir, 'test-blog', 'src', 'pages')
    const files = await readdir(pagesDir)
    expect(files.length).toBeGreaterThan(0)
  })

  it('creates src/themes/<template>/layouts and blocks dirs', async () => {
    const templates = getTemplates()
    const blogTemplate = templates.find((t) => t.id === 'blog')!

    await generateProject({
      templateId: 'blog',
      projectName: 'test-blog',
      parentDir,
      initGit: false
    })

    const themeDir = join(parentDir, 'test-blog', 'src', 'themes', blogTemplate.themeName)
    const entries = await readdir(themeDir)
    expect(entries).toContain('layouts')
    expect(entries).toContain('blocks')
  })

  it('generated project passes validation', async () => {
    const result = await generateProject({
      templateId: 'blog',
      projectName: 'test-blog',
      parentDir,
      initGit: false
    })

    if (result.status !== 'success') throw new Error('Generation failed')

    const validation = await validateProject(result.project.path)
    expect(validation.valid).toBe(true)
  })

  it('generates from vitrine-asso template', async () => {
    const result = await generateProject({
      templateId: 'vitrine-asso',
      projectName: 'site-asso',
      parentDir,
      initGit: false
    })

    expect(result.status).toBe('success')
    if (result.status !== 'success') return

    const validation = await validateProject(result.project.path)
    expect(validation.valid).toBe(true)
  })

  it('returns error for unknown template', async () => {
    const result = await generateProject({
      templateId: 'nonexistent',
      projectName: 'test',
      parentDir,
      initGit: false
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.message).toContain('nonexistent')
    }
  })

  it('returns error if project directory already exists', async () => {
    const { mkdir } = await import('fs/promises')
    await mkdir(join(parentDir, 'existing'), { recursive: true })

    const result = await generateProject({
      templateId: 'blog',
      projectName: 'existing',
      parentDir,
      initGit: false
    })

    expect(result.status).toBe('error')
  })

  it('initializes a git repo when initGit is true', async () => {
    const result = await generateProject({
      templateId: 'blog',
      projectName: 'git-project',
      parentDir,
      initGit: true
    })

    expect(result.status).toBe('success')
    if (result.status !== 'success') return

    const gitDir = join(parentDir, 'git-project', '.git')
    await expect(access(gitDir)).resolves.toBeUndefined()
  })

  it('does not create .git when initGit is false', async () => {
    await generateProject({
      templateId: 'blog',
      projectName: 'no-git',
      parentDir,
      initGit: false
    })

    const gitDir = join(parentDir, 'no-git', '.git')
    await expect(access(gitDir)).rejects.toThrow()
  })
})
