export function readVariableOverrides(configContent: string): Record<string, unknown> {
  const match = configContent.match(
    /variableOverrides\s*:\s*(\{[\s\S]*?\})\s*[,}]/
  )
  if (!match) return {}
  try {
    return new Function(`return (${match[1]})`)() as Record<string, unknown>
  } catch {
    return {}
  }
}

function serializeOverrides(overrides: Record<string, unknown>): string {
  const entries = Object.entries(overrides)
  if (entries.length === 0) return '{}'
  const pairs = entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  if (pairs.join(', ').length <= 60) {
    return `{ ${pairs.join(', ')} }`
  }
  return `{\n    ${pairs.join(',\n    ')},\n  }`
}

export function writeVariableOverrides(
  configContent: string,
  overrides: Record<string, unknown>
): string {
  const isEmpty = Object.keys(overrides).length === 0
  const hasExisting = /variableOverrides\s*:\s*\{[\s\S]*?\}\s*,?/.test(configContent)

  if (hasExisting && isEmpty) {
    return configContent.replace(
      /\s*variableOverrides\s*:\s*\{[\s\S]*?\}\s*,?/,
      ''
    )
  }

  if (hasExisting) {
    return configContent.replace(
      /variableOverrides\s*:\s*\{[\s\S]*?\}/,
      `variableOverrides: ${serializeOverrides(overrides)}`
    )
  }

  if (isEmpty) return configContent

  return configContent.replace(
    /(theme\s*:\s*\w+\s*,?)/,
    `$1\n  variableOverrides: ${serializeOverrides(overrides)},`
  )
}
