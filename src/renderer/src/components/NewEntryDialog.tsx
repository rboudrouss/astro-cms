import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { EntryEditorForm } from '@/components/EntryEditorForm'
import { validateEntryFields } from '@/lib/entry-validation'
import type { CollectionSchema, EntryValidationError } from '../../../shared/types'

type Props = {
  collectionName: string
  schema: CollectionSchema | null
  onCreate: (slug: string, frontmatter: Record<string, unknown>) => void
  onCancel: () => void
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function buildDefaults(schema: CollectionSchema | null): Record<string, unknown> {
  if (!schema) return {}
  const defaults: Record<string, unknown> = {}
  for (const field of schema.fields) {
    if (field.default !== undefined) {
      defaults[field.name] = field.default
    }
  }
  return defaults
}

export function NewEntryDialog({
  collectionName,
  schema,
  onCreate,
  onCancel
}: Props): React.JSX.Element {
  const { t } = useTranslation()
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>(() => buildDefaults(schema))
  const [validationErrors, setValidationErrors] = useState<EntryValidationError[]>([])

  const handleSlugChange = (newSlug: string): void => {
    setSlug(newSlug)
    if (!newSlug.trim()) {
      setSlugError(t('entryEditor.slugRequired'))
    } else if (!SLUG_RE.test(newSlug)) {
      setSlugError(t('entryEditor.slugInvalid'))
    } else {
      setSlugError(null)
    }
  }

  const handleSubmit = (): void => {
    if (!slug.trim()) {
      setSlugError(t('entryEditor.slugRequired'))
      return
    }
    if (!SLUG_RE.test(slug)) {
      setSlugError(t('entryEditor.slugInvalid'))
      return
    }

    const fieldErrors = schema ? validateEntryFields(schema, values) : []
    if (fieldErrors.length > 0) {
      setValidationErrors(fieldErrors)
      return
    }

    onCreate(slug, values)
  }

  return (
    <div data-testid="new-entry-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-[480px] overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {t('entryEditor.newEntryTitle', { collection: collectionName })}
        </h2>

        <div className="mb-3 flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="new-entry-slug">
            {t('entryEditor.slug')}
          </label>
          <input
            id="new-entry-slug"
            type="text"
            className="rounded border px-2 py-1 text-sm"
            placeholder={t('entryEditor.slugPlaceholder')}
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          {slugError && <span className="text-xs text-red-500">{slugError}</span>}
        </div>

        {schema ? (
          <EntryEditorForm
            schema={schema}
            values={values}
            onChange={(v) => {
              setValues(v)
              setValidationErrors(validateEntryFields(schema, v))
            }}
            validationErrors={validationErrors}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t('entryEditor.noSchema')}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t('entryEditor.cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {t('entryEditor.create')}
          </Button>
        </div>
      </div>
    </div>
  )
}
