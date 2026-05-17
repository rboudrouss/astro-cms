import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { validateProject } from '../src/main/project-validator'
import { validateProject as validateProjectReport } from '../src/main/modules/project-validator'
import type { ValidationReport } from '../src/shared/validation'

const VALID_CONFIG = `
import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";

export default defineProject({
  theme: myTheme,
  pagesDir: "src/pages",
  contentDir: "src/content",
  assetsDir: "src/assets",
});
`

const VALID_THEME = `
import { defineTheme } from "@astro-cms/theme";

export default defineTheme({
  name: "my-theme",
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
  variables: {
    mainColor: { type: "color", default: "#000" },
  },
});
`

const CONFIG_WITHOUT_THEME_IMPORT = `
import { defineProject } from "@astro-cms/runtime";

export default defineProject({
  pagesDir: "src/pages",
});
`

const THEME_WITHOUT_NAME = `
import { defineTheme } from "@astro-cms/theme";

export default defineTheme({
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
});
`

let fixturesDir: string

function createFixture(name: string, setup: (dir: string) => void): string {
  const dir = join(fixturesDir, name)
  mkdirSync(dir, { recursive: true })
  setup(dir)
  return dir
}

describe('validateProject', () => {
  let validProject: string
  let missingConfig: string
  let missingTheme: string
  let themeNoName: string
  let noThemeImport: string

  beforeAll(() => {
    fixturesDir = mkdtempSync(join(tmpdir(), 'astro-cms-test-'))

    validProject = createFixture('valid-project', (dir) => {
      writeFileSync(join(dir, 'astro-cms.config.ts'), VALID_CONFIG)
      const themeDir = join(dir, 'src', 'themes', 'my-theme')
      mkdirSync(themeDir, { recursive: true })
      mkdirSync(join(themeDir, 'layouts'), { recursive: true })
      mkdirSync(join(themeDir, 'blocks'), { recursive: true })
      writeFileSync(join(themeDir, 'astro-cms.theme.ts'), VALID_THEME)
      mkdirSync(join(dir, 'src', 'pages'), { recursive: true })
      mkdirSync(join(dir, 'src', 'content'), { recursive: true })
    })

    missingConfig = createFixture('missing-config', (dir) => {
      mkdirSync(join(dir, 'src', 'pages'), { recursive: true })
    })

    missingTheme = createFixture('missing-theme', (dir) => {
      writeFileSync(join(dir, 'astro-cms.config.ts'), VALID_CONFIG)
      mkdirSync(join(dir, 'src', 'themes'), { recursive: true })
    })

    themeNoName = createFixture('theme-no-name', (dir) => {
      writeFileSync(join(dir, 'astro-cms.config.ts'), VALID_CONFIG)
      const themeDir = join(dir, 'src', 'themes', 'my-theme')
      mkdirSync(themeDir, { recursive: true })
      writeFileSync(join(themeDir, 'astro-cms.theme.ts'), THEME_WITHOUT_NAME)
    })

    noThemeImport = createFixture('no-theme-import', (dir) => {
      writeFileSync(join(dir, 'astro-cms.config.ts'), CONFIG_WITHOUT_THEME_IMPORT)
    })
  })

  afterAll(() => {
    rmSync(fixturesDir, { recursive: true, force: true })
  })

  it('returns valid result for a conforming project', async () => {
    const result = await validateProject(validProject)
    expect(result).toEqual({
      valid: true,
      project: {
        name: 'valid-project',
        path: validProject,
        themeName: 'my-theme'
      }
    })
  })

  it('returns CONFIG_MISSING when astro-cms.config.ts is absent', async () => {
    const result = await validateProject(missingConfig)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('CONFIG_MISSING')
    }
  })

  it('returns THEME_NOT_DECLARED when config has no theme import', async () => {
    const result = await validateProject(noThemeImport)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === 'THEME_NOT_DECLARED')).toBe(true)
    }
  })

  it('returns THEME_NOT_FOUND when theme file does not exist', async () => {
    const result = await validateProject(missingTheme)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === 'THEME_NOT_FOUND')).toBe(true)
    }
  })

  it('returns THEME_NAME_MISSING when theme has no name field', async () => {
    const result = await validateProject(themeNoName)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.some((e) => e.code === 'THEME_NAME_MISSING')).toBe(true)
    }
  })
})

function findIssue(report: ValidationReport, code: string) {
  return report.issues.find((i) => i.code === code)
}

describe('Project Validator (report-based)', () => {
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
      const report = await validateProjectReport(tmp)
      expect(report.valid).toBe(true)
      expect(report.projectPath).toBe(tmp)
      expect(report.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('non-existent path', () => {
    it('returns error for path that does not exist', async () => {
      const report = await validateProjectReport('/tmp/does-not-exist-at-all-xyz')
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'PATH_NOT_FOUND')).toBeDefined()
      expect(findIssue(report, 'PATH_NOT_FOUND')!.severity).toBe('error')
    })
  })

  describe('path is a file, not a directory', () => {
    it('returns error when path is a file', async () => {
      const filePath = join(tmp, 'not-a-dir.txt')
      await writeFile(filePath, 'hello')
      const report = await validateProjectReport(filePath)
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
      const report = await validateProjectReport(tmp)
      expect(report.valid).toBe(false)
      expect(findIssue(report, 'CONFIG_MISSING')).toBeDefined()
      expect(findIssue(report, 'CONFIG_MISSING')!.severity).toBe('error')
    })
  })

  describe('missing package.json', () => {
    it('returns error when package.json is missing', async () => {
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      const report = await validateProjectReport(tmp)
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
      const report = await validateProjectReport(tmp)
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
      const report = await validateProjectReport(tmp)
      expect(findIssue(report, 'ASTRO_NOT_DEPENDENCY')).toBeUndefined()
    })
  })

  describe('invalid package.json', () => {
    it('returns error when package.json is not valid JSON', async () => {
      await writeFile(join(tmp, 'astro-cms.config.ts'), 'export default {}')
      await writeFile(join(tmp, 'package.json'), 'not json at all')
      const report = await validateProjectReport(tmp)
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
      const report = await validateProjectReport(tmp)
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
      const report = await validateProjectReport(tmp)
      const issue = findIssue(report, 'PAGES_DIR_MISSING')
      expect(issue).toBeDefined()
      expect(issue!.severity).toBe('warning')
    })

    it('warns when src/content/ is missing', async () => {
      const report = await validateProjectReport(tmp)
      const issue = findIssue(report, 'CONTENT_DIR_MISSING')
      expect(issue).toBeDefined()
      expect(issue!.severity).toBe('warning')
    })

    it('warns when src/themes/ is missing', async () => {
      const report = await validateProjectReport(tmp)
      const issue = findIssue(report, 'THEMES_DIR_MISSING')
      expect(issue).toBeDefined()
      expect(issue!.severity).toBe('warning')
    })

    it('remains valid with only warnings', async () => {
      const report = await validateProjectReport(tmp)
      expect(report.valid).toBe(true)
    })
  })

  describe('collects all issues in one pass', () => {
    it('returns multiple errors for an empty directory', async () => {
      const report = await validateProjectReport(tmp)
      expect(report.valid).toBe(false)
      expect(report.issues.length).toBeGreaterThanOrEqual(2)
      expect(findIssue(report, 'CONFIG_MISSING')).toBeDefined()
      expect(findIssue(report, 'PACKAGE_JSON_MISSING')).toBeDefined()
    })
  })
})
