import type { ThemeVariable } from '../shared/types'

export type ResolvedVariable = {
  value: unknown
  source: 'theme' | 'project' | 'page'
}

export function resolveVariables(
  themeVars: Record<string, ThemeVariable>,
  projectOverrides: Record<string, unknown>,
  pageOverrides: Record<string, unknown>
): Record<string, ResolvedVariable> {
  const result: Record<string, ResolvedVariable> = {}
  for (const [name, variable] of Object.entries(themeVars)) {
    if (name in pageOverrides) {
      result[name] = { value: pageOverrides[name], source: 'page' }
    } else if (name in projectOverrides) {
      result[name] = { value: projectOverrides[name], source: 'project' }
    } else {
      result[name] = { value: variable.default, source: 'theme' }
    }
  }
  return result
}
