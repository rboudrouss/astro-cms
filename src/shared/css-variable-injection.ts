import type { ResolvedVariable } from './variable-resolver'

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

export function generateCssVariables(resolved: Record<string, ResolvedVariable>): string {
  const entries = Object.entries(resolved)
  if (entries.length === 0) return ''

  const props = entries
    .map(([name, rv]) => `  --${camelToKebab(name)}: ${rv.value};`)
    .join('\n')

  return `:root {\n${props}\n}`
}
