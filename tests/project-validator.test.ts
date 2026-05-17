import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { validateProject } from '../src/main/modules/project-validator'
import type { ValidationReport } from '../src/shared/validation'

function findIssue(report: ValidationReport, code: string) {
  return report.issues.find((i) => i.code === code)
}

describe('Project Validator', () => {
  let tmp: string

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'astro-cms-test-'))
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  describe('valid project', () => {
    beforeEach(async () => {
      await mkdir(join(tmp, 'src', 'pages'), { recursive: true })
      await mkdir(join(tmp, 'src', 'content'), { recursive: true })
      await mkdir(join(tmp, 'src', 'themes', 'default'), { recursive: true })
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(
        join(tmp, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: { astro: '^4.0.0' }
        })
      )
    })

    it('returns valid: true with no errors', async () => {
      const report = await validateProject(tmp)
      expect(report.valid).toBe(true)
      expect(report.projectPath).toBe(tmp)
      expect(report.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('non-existent path', () => {
    it('returns error for path that does not exist', async () => {
      const report = await validateProject('/tmp/does-not-exist-at-all-xyz')
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'PATH_NOT_FOUND')).toBeDefined()
      expect(findIssue(report, 'PATH_NOT_FOUND')!.severity).toBe('error')
    })
  })

  describe('path is a file, not a directory', () => {
    it('returns error when path is a file', async () => {
      const filePath = join(tmp, 'not-a-dir.txt')
      await writeFile(filePath, 'hello')
      const report = await validateProject(filePath)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'PATH_NOT_DIRECTORY')).toBeDefined()
    })
  })

  describe('missing config file', () => {
    it('returns error when astro-cms.config.ts is missing', async () => {
      await writeFile(
        join(tmp, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { astro: '^4.0.0' } })
      )
      const report = await validateProject(tmp)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'CONFIG_MISSING')).toBeDefined()
      expect(findIssue(report, 'CONFIG_MISSING')!.severity).toBe('error')
    })
  })

  describe('missing package.json', () => {
    it('returns error when package.json is missing', async () => {
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      const report = await validateProject(tmp)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'PACKAGE_JSON_MISSING')).toBeDefined()
    })
  })

  describe('astro not in dependencies', () => {
    it('returns error when astro is not a dependency', async () => {
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(
        join(tmp, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { react: '^19.0.0' } })
      )
      const report = await validateProject(tmp)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'ASTRO_NOT_DEPENDENCY')).toBeDefined()
    })

    it('accepts astro in devDependencies', async () => {
      await mkdir(join(tmp, 'src', 'pages'), { recursive: true })
      await mkdir(join(tmp, 'src', 'content'), { recursive: true })
      await mkdir(join(tmp, 'src', 'themes'), { recursive: true })
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(
        join(tmp, 'package.json'),
        JSON.stringify({ name: 'test', devDependencies: { astro: '^4.0.0' } })
      )
      const report = await validateProject(tmp)
      expect(findIssue(report, 'ASTRO_NOT_DEPENDENCY')).toBeUndefined()
    })
  })

  describe('invalid package.json', () => {
    it('returns error when package.json is not valid JSON', async () => {
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(join(tmp, 'package.json'), 'not json at all')
      const report = await validateProject(tmp)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'PACKAGE_JSON_INVALID')).toBeDefined()
    })
  })

  describe('missing src directory', () => {
    it('returns error when src/ does not exist', async () => {
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(
        join(tmp, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { astro: '^4.0.0' } })
      )
      const report = await validateProject(tmp)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'SRC_DIR_MISSING')).toBeDefined()
    })
  })

  describe('missing optional directories', () => {
    beforeEach(async () => {
      await mkdir(join(tmp, 'src'), { recursive: true })
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(
        join(tmp, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { astro: '^4.0.0' } })
      )
    })

    it('warns when src/pages/ is missing', async () => {
      const report = await validateProject(tmp)
      const issue = findIssue(report, 'PAGES_DIR_MISSING')
      expect(issue).toBeDefined()
      expect(issue!.severity).toBe('warning')
    })

    it('warns when src/content/ is missing', async () => {
      const report = await validateProject(tmp)
      const issue = findIssue(report, 'CONTENT_DIR_MISSING')
      expect(issue).toBeDefined()
      expect(issue!.severity).toBe('warning')
    })

    it('warns when src/themes/ is missing', async () => {
      const report = await validateProject(tmp)
      const issue = findIssue(report, 'THEMES_DIR_MISSING')
      expect(issue).toBeDefined()
      expect(issue!.severity).toBe('warning')
    })

    it('remains valid with only warnings', async () => {
      const report = await validateProject(tmp)
      expect(report.valid).toBe(true)
    })
  })

  describe('collects all issues in one pass', () => {
    it('returns multiple errors for an empty directory', async () => {
      const report = await validateProject(tmp)
      expect(report.valid).toBe(false)
      expect(report.issues.length).toBeGreaterThanOrEqual(2)
      expect(findIssue(report, 'CONFIG_MISSING')).toBeDefined()
      expect(findIssue(report, 'PACKAGE_JSON_MISSING')).toBeDefined()
    })
  })
})
