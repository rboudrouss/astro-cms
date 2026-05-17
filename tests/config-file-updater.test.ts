import { describe, it, expect } from 'vitest'
import {
  readVariableOverrides,
  writeVariableOverrides
} from '../src/main/config-file-updater'

describe('readVariableOverrides', () => {
  it('reads overrides from config with variableOverrides', () => {
    const config = `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";

export default defineProject({
  theme: myTheme,
  variableOverrides: { mainColor: "#e865ad", fontSize: 20 },
});`
    const result = readVariableOverrides(config)
    expect(result).toEqual({ mainColor: '#e865ad', fontSize: 20 })
  })

  it('returns empty object when no variableOverrides key', () => {
    const config = `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";

export default defineProject({
  theme: myTheme,
});`
    const result = readVariableOverrides(config)
    expect(result).toEqual({})
  })

  it('returns empty object for empty variableOverrides', () => {
    const config = `export default defineProject({
  theme: myTheme,
  variableOverrides: {},
});`
    const result = readVariableOverrides(config)
    expect(result).toEqual({})
  })

  it('handles multiline variableOverrides', () => {
    const config = `export default defineProject({
  theme: myTheme,
  variableOverrides: {
    mainColor: "#f00",
    secondaryColor: "#0f0",
  },
});`
    const result = readVariableOverrides(config)
    expect(result).toEqual({ mainColor: '#f00', secondaryColor: '#0f0' })
  })
})

describe('writeVariableOverrides', () => {
  it('updates existing variableOverrides', () => {
    const config = `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";

export default defineProject({
  theme: myTheme,
  variableOverrides: { mainColor: "#000" },
});`
    const result = writeVariableOverrides(config, { mainColor: '#f00', fontSize: 20 })
    expect(result).toContain('variableOverrides')
    const readBack = readVariableOverrides(result)
    expect(readBack).toEqual({ mainColor: '#f00', fontSize: 20 })
  })

  it('adds variableOverrides when not present', () => {
    const config = `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";

export default defineProject({
  theme: myTheme,
});`
    const result = writeVariableOverrides(config, { mainColor: '#f00' })
    expect(result).toContain('variableOverrides')
    const readBack = readVariableOverrides(result)
    expect(readBack).toEqual({ mainColor: '#f00' })
  })

  it('removes variableOverrides when empty object', () => {
    const config = `export default defineProject({
  theme: myTheme,
  variableOverrides: { mainColor: "#000" },
});`
    const result = writeVariableOverrides(config, {})
    expect(result).not.toContain('variableOverrides')
  })

  it('preserves other config keys', () => {
    const config = `export default defineProject({
  theme: myTheme,
  variableOverrides: { mainColor: "#000" },
  pagesDir: "src/pages",
});`
    const result = writeVariableOverrides(config, { mainColor: '#f00' })
    expect(result).toContain('pagesDir')
    expect(result).toContain('"src/pages"')
  })

  it('round-trips through read and write', () => {
    const overrides = { mainColor: '#e865ad', fontSize: 20, fontFamily: 'Inter' }
    const config = `export default defineProject({
  theme: myTheme,
  variableOverrides: { old: "value" },
});`
    const written = writeVariableOverrides(config, overrides)
    const readBack = readVariableOverrides(written)
    expect(readBack).toEqual(overrides)
  })
})
