import { describe, it, expect } from 'vitest'
import { generateCssVariables } from '../src/shared/css-variable-injection'
import type { ResolvedVariable } from '../src/shared/variable-resolver'

describe('generateCssVariables', () => {
  it('generates CSS custom properties from resolved variables', () => {
    const resolved: Record<string, ResolvedVariable> = {
      mainColor: { value: '#ff0000', source: 'project' },
      fontSize: { value: 16, source: 'theme' }
    }
    const css = generateCssVariables(resolved)
    expect(css).toContain(':root')
    expect(css).toContain('--main-color: #ff0000')
    expect(css).toContain('--font-size: 16')
  })

  it('returns empty string for empty variables', () => {
    expect(generateCssVariables({})).toBe('')
  })

  it('converts camelCase names to kebab-case CSS properties', () => {
    const resolved: Record<string, ResolvedVariable> = {
      backgroundColor: { value: '#000', source: 'theme' }
    }
    const css = generateCssVariables(resolved)
    expect(css).toContain('--background-color: #000')
  })

  it('handles string, number, and color values', () => {
    const resolved: Record<string, ResolvedVariable> = {
      color: { value: '#abc', source: 'theme' },
      size: { value: 42, source: 'project' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    }
    const css = generateCssVariables(resolved)
    expect(css).toContain('--color: #abc')
    expect(css).toContain('--size: 42')
    expect(css).toContain('--font-family: sans-serif')
  })

  it('appends px suffix to number values when suffixed option set', () => {
    const resolved: Record<string, ResolvedVariable> = {
      fontSize: { value: 16, source: 'theme' }
    }
    const css = generateCssVariables(resolved)
    expect(css).toContain('--font-size: 16')
  })
})
