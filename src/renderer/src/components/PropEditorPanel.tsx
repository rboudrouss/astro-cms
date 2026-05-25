import { useState, useEffect } from 'react'
import type { PropSchema, CmsHints } from '../../../shared/types'
import { ImagePropField } from './ImagePropField'

type Props = {
  blockName: string
  schema: PropSchema[]
  cmsHints: CmsHints
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  projectPath?: string
}

function resolveInputType(prop: PropSchema, hint?: { format?: string }): string {
  if (hint?.format === 'color') return 'color'
  if (hint?.format === 'url') return 'url'
  if (prop.type === 'number') return 'number'
  return 'text'
}

function isTextarea(prop: PropSchema, hint?: { format?: string }): boolean {
  if (!hint) return false
  return hint.format === 'textarea' || hint.format === 'richtext'
}

export function PropEditorPanel({
  blockName,
  schema,
  cmsHints,
  values,
  onChange,
  projectPath
}: Props): React.JSX.Element {
  const [local, setLocal] = useState(values)

  useEffect(() => {
    setLocal(values)
  }, [values])

  const handleChange = (name: string, value: unknown): void => {
    const next = { ...local }
    const isNumber = schema.find((p) => p.name === name)?.type === 'number'
    if (isNumber) {
      next[name] = value === '' ? undefined : Number(value)
    } else {
      next[name] = value
    }
    setLocal(next)
    onChange(next)
  }

  return (
    <div data-testid="prop-editor-panel" className="flex flex-col gap-3 border-l p-3">
      <h3 className="text-sm font-semibold">{blockName}</h3>
      {schema.map((prop) => {
        const hint = cmsHints[prop.name]
        const value = local[prop.name]

        if (prop.type === 'boolean') {
          return (
            <div key={prop.name} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => handleChange(prop.name, e.target.checked)}
                />
                {prop.name}
              </label>
              {prop.description && (
                <span className="text-xs text-muted-foreground">{prop.description}</span>
              )}
            </div>
          )
        }

        if (hint?.format === 'image' && projectPath) {
          return (
            <ImagePropField
              key={prop.name}
              name={prop.name}
              description={prop.description}
              value={typeof value === 'string' ? value : ''}
              projectPath={projectPath}
              onChange={(v) => handleChange(prop.name, v)}
            />
          )
        }

        if (isTextarea(prop, hint)) {
          return (
            <div key={prop.name} className="flex flex-col gap-1">
              <label className="text-xs font-medium" htmlFor={`prop-${prop.name}`}>
                {prop.name}
              </label>
              {prop.description && (
                <span className="text-xs text-muted-foreground">{prop.description}</span>
              )}
              <textarea
                id={`prop-${prop.name}`}
                className="rounded border px-2 py-1 text-sm"
                rows={3}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleChange(prop.name, e.target.value)}
              />
            </div>
          )
        }

        const inputType = resolveInputType(prop, hint)

        return (
          <div key={prop.name} className="flex flex-col gap-1">
            <label className="text-xs font-medium" htmlFor={`prop-${prop.name}`}>
              {prop.name}
            </label>
            {prop.description && (
              <span className="text-xs text-muted-foreground">{prop.description}</span>
            )}
            <input
              id={`prop-${prop.name}`}
              type={inputType}
              className="rounded border px-2 py-1 text-sm"
              value={value != null ? String(value) : ''}
              onChange={(e) => handleChange(prop.name, e.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
