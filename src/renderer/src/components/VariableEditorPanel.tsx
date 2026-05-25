import { useTranslation } from 'react-i18next'
import type { ThemeVariable } from '../../../shared/types'
import type { ResolvedVariable } from '../../../shared/variable-resolver'

type Props = {
  themeVariables: Record<string, ThemeVariable>
  resolved: Record<string, ResolvedVariable>
  onChange: (name: string, value: unknown) => void
  onReset?: (name: string) => void
  overrideSource?: 'project' | 'page'
  title?: string
}

function inputTypeForVariable(varType: string): string {
  if (varType === 'color') return 'color'
  if (varType === 'number') return 'number'
  return 'text'
}

export function VariableEditorPanel({
  themeVariables,
  resolved,
  onChange,
  onReset,
  overrideSource,
  title
}: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div data-testid="variable-editor-panel" className="flex flex-col gap-3 border-l p-3">
      <h3 className="text-sm font-semibold">{title ?? t('variableEditor.title')}</h3>
      {Object.entries(themeVariables).map(([name, variable]) => {
        const rv = resolved[name]
        const value = rv?.value
        const source = rv?.source ?? 'theme'
        const showReset = overrideSource ? source === overrideSource : source !== 'theme'

        return (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" htmlFor={`var-${name}`}>
                {name}
              </label>
              <span className="text-xs text-muted-foreground">
                {t(`variableEditor.source.${source}`)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {variable.type === 'select' && variable.options ? (
                <select
                  id={`var-${name}`}
                  aria-label={name}
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  value={value != null ? String(value) : ''}
                  onChange={(e) => onChange(name, e.target.value)}
                >
                  {variable.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={`var-${name}`}
                  aria-label={name}
                  type={inputTypeForVariable(variable.type)}
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  value={value != null ? String(value) : ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (variable.type === 'number') {
                      onChange(name, raw === '' ? undefined : Number(raw))
                    } else {
                      onChange(name, raw)
                    }
                  }}
                />
              )}
              {showReset && onReset && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onReset(name)}
                >
                  {t('variableEditor.reset')}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
