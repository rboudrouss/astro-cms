import yaml from 'js-yaml'
import type { CollectionSchema, EntryValidationError } from '../../../shared/types'

const FM_RE = /^---\n([\s\S]*?)\n---/

export function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(FM_RE)
  if (!match) return {}
  try {
    const parsed = yaml.load(match[1], { schema: yaml.JSON_SCHEMA })
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    return {}
  } catch {
    return {}
  }
}

function isBlank(val: unknown): boolean {
  return val === undefined || val === null || val === ''
}

export function validateEntryFields(
  schema: CollectionSchema,
  values: Record<string, unknown>
): EntryValidationError[] {
  const errors: EntryValidationError[] = []

  for (const field of schema.fields) {
    const val = values[field.name]

    if (isBlank(val)) {
      if (field.required) {
        errors.push({ field: field.name, message: `${field.name} is required` })
      }
      continue
    }

    switch (field.type) {
      case 'number':
        if (typeof val !== 'number' && (typeof val !== 'string' || isNaN(Number(val)))) {
          errors.push({ field: field.name, message: `${field.name} must be a number` })
        }
        break
      case 'boolean':
        if (typeof val !== 'boolean') {
          errors.push({ field: field.name, message: `${field.name} must be true or false` })
        }
        break
      case 'date':
        if (isNaN(Date.parse(String(val)))) {
          errors.push({ field: field.name, message: `${field.name} must be a valid date` })
        }
        break
      case 'enum':
        if (field.enumValues && !field.enumValues.includes(String(val))) {
          errors.push({ field: field.name, message: `${field.name} must be one of: ${field.enumValues.join(', ')}` })
        }
        break
    }
  }

  return errors
}
