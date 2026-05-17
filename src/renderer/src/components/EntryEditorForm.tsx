import { useState, useEffect } from 'react'
import type { CollectionSchema, EntryValidationError } from '../../../shared/types'

type Props = {
  schema: CollectionSchema
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  validationErrors: EntryValidationError[]
}

export function EntryEditorForm({
  schema,
  values,
  onChange,
  validationErrors
}: Props): React.JSX.Element {
  const [local, setLocal] = useState(values)

  useEffect(() => {
    setLocal(values)
  }, [values])

  const handleChange = (name: string, value: unknown, fieldType: string): void => {
    const next = { ...local }
    if (fieldType === 'number') {
      next[name] = value === '' ? undefined : Number(value)
    } else {
      next[name] = value
    }
    setLocal(next)
    onChange(next)
  }

  const getError = (fieldName: string): string | undefined =>
    validationErrors.find((e) => e.field === fieldName)?.message

  return (
    <div data-testid="entry-editor-form" className="flex flex-col gap-3 p-3">
      {schema.fields.map((field) => {
        const value = local[field.name]
        const error = getError(field.name)

        if (field.type === 'boolean') {
          return (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => handleChange(field.name, e.target.checked, 'boolean')}
                />
                {field.name}
              </label>
              {field.description && (
                <span className="text-xs text-muted-foreground">{field.description}</span>
              )}
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
          )
        }

        if (field.type === 'enum' && field.enumValues) {
          return (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor={`field-${field.name}`}>
                {field.name}
              </label>
              {field.description && (
                <span className="text-xs text-muted-foreground">{field.description}</span>
              )}
              <select
                id={`field-${field.name}`}
                className="rounded border px-2 py-1 text-sm"
                value={typeof value === 'string' ? value : ''}
                required={field.required}
                onChange={(e) => handleChange(field.name, e.target.value, 'enum')}
              >
                <option value=""></option>
                {field.enumValues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
          )
        }

        const inputType =
          field.type === 'number' ? 'number' :
          field.type === 'date' ? 'date' :
          'text'

        return (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor={`field-${field.name}`}>
              {field.name}
            </label>
            {field.description && (
              <span className="text-xs text-muted-foreground">{field.description}</span>
            )}
            <input
              id={`field-${field.name}`}
              type={inputType}
              className="rounded border px-2 py-1 text-sm"
              required={field.required}
              value={value != null ? String(value) : ''}
              onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        )
      })}
    </div>
  )
}
