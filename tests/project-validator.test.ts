import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { validateProject } from '../src/main/project-validator'

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
