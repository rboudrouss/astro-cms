import matter from 'gray-matter'
import yaml from 'js-yaml'

const yamlEngine = {
  parse: (str: string): object => yaml.load(str, { schema: yaml.JSON_SCHEMA }) as object,
  stringify: (obj: object): string => yaml.dump(obj, { schema: yaml.JSON_SCHEMA }).trim()
}

export function readPageVariableOverrides(source: string): Record<string, unknown> {
  const { data } = matter(source, { engines: { yaml: yamlEngine } })
  const variables = data.variables
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
    return {}
  }
  return variables as Record<string, unknown>
}

export function writePageVariableOverrides(
  source: string,
  overrides: Record<string, unknown>
): string {
  const { data, content } = matter(source, { engines: { yaml: yamlEngine } })
  const isEmpty = Object.keys(overrides).length === 0

  if (isEmpty) {
    delete data.variables
  } else {
    data.variables = overrides
  }

  if (Object.keys(data).length === 0) {
    return content.startsWith('\n') ? content.slice(1) : content
  }

  return matter.stringify('\n' + content, data, { engines: { yaml: yamlEngine } })
}
