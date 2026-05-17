import { describe, it, expect } from 'vitest'
import { resolveVariables } from '../src/shared/variable-resolver'
import type { ThemeVariable } from '../src/shared/types'

describe('resolveVariables', () => {
  const themeVars: Record<string, ThemeVariable> = {
    mainColor: { type: 'color', default: '#000' },
    fontSize: { type: 'number', default: 16 },
    fontFamily: { type: 'string', default: 'sans-serif' }
  }

  it('returns theme defaults when no overrides', () => {
    const result = resolveVariables(themeVars, {}, {})
    expect(result).toEqual({
      mainColor: { value: '#000', source: 'theme' },
      fontSize: { value: 16, source: 'theme' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    })
  })

  it('applies project overrides over theme defaults', () => {
    const result = resolveVariables(themeVars, { mainColor: '#f00' }, {})
    expect(result).toEqual({
      mainColor: { value: '#f00', source: 'project' },
      fontSize: { value: 16, source: 'theme' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    })
  })

  it('applies page overrides over project overrides', () => {
    const result = resolveVariables(
      themeVars,
      { mainColor: '#f00' },
      { mainColor: '#0f0', fontSize: 24 }
    )
    expect(result).toEqual({
      mainColor: { value: '#0f0', source: 'page' },
      fontSize: { value: 24, source: 'page' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    })
  })

  it('ignores overrides for variables not in theme', () => {
    const result = resolveVariables(themeVars, { unknownVar: 'value' }, {})
    expect(result).not.toHaveProperty('unknownVar')
    expect(Object.keys(result)).toEqual(['mainColor', 'fontSize', 'fontFamily'])
  })

  it('returns empty object for empty theme variables', () => {
    const result = resolveVariables({}, {}, {})
    expect(result).toEqual({})
  })

  it('page override wins over project override', () => {
    const result = resolveVariables(
      { color: { type: 'color', default: '#000' } },
      { color: '#111' },
      { color: '#222' }
    )
    expect(result.color).toEqual({ value: '#222', source: 'page' })
  })
})
