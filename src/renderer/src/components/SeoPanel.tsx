import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { SeoFieldMapping, SeoValues, SeoRole } from '../../../shared/seo-fields'
import { SEO_LIMITS } from '../../../shared/seo-fields'

type Props = {
  mapping: SeoFieldMapping
  values: SeoValues
  onChange: (values: SeoValues) => void
}

function CharCounter({ role, length }: { role: 'title' | 'description'; length: number }): React.JSX.Element {
  const max = SEO_LIMITS[role].max
  const overLimit = length > max
  return (
    <span className={`text-xs ${overLimit ? 'text-orange-600' : 'text-muted-foreground'}`}>
      {length}/{max}
    </span>
  )
}

export function SeoPanel({ mapping, values, onChange }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const [local, setLocal] = useState(values)

  useEffect(() => {
    setLocal(values)
  }, [values])

  const handleChange = (role: SeoRole, value: string): void => {
    const next = { ...local, [role]: value }
    setLocal(next)
    onChange(next)
  }

  return (
    <div data-testid="seo-panel" className="flex flex-col gap-3 border-l p-3">
      <h3 className="text-sm font-semibold">{t('seo.title', 'SEO')}</h3>

      {mapping.title && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" htmlFor="seo-title">
              {t('seo.metaTitle', 'Meta Title')}
            </label>
            <CharCounter role="title" length={(local.title ?? '').length} />
          </div>
          <input
            id="seo-title"
            type="text"
            className="rounded border px-2 py-1 text-sm"
            value={local.title ?? ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>
      )}

      {mapping.description && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" htmlFor="seo-description">
              {t('seo.metaDescription', 'Meta Description')}
            </label>
            <CharCounter role="description" length={(local.description ?? '').length} />
          </div>
          <textarea
            id="seo-description"
            className="rounded border px-2 py-1 text-sm"
            rows={3}
            value={local.description ?? ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>
      )}

      {mapping.ogImage && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" htmlFor="seo-og-image">
            {t('seo.ogImage', 'OG Image')}
          </label>
          <input
            id="seo-og-image"
            type="text"
            className="rounded border px-2 py-1 text-sm"
            value={local.ogImage ?? ''}
            onChange={(e) => handleChange('ogImage', e.target.value)}
          />
        </div>
      )}

      <div data-testid="social-card-preview" className="mt-2 overflow-hidden rounded border">
        {local.ogImage && (
          <img
            src={local.ogImage}
            alt={t('seo.ogImageAlt', 'Social card preview')}
            className="h-32 w-full object-cover"
          />
        )}
        {!local.ogImage && mapping.ogImage && (
          <div className="flex h-32 w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">
              {t('seo.noImage', 'No image')}
            </span>
          </div>
        )}
        <div className="p-2">
          <p className="text-sm font-medium leading-tight">
            {local.title || t('seo.untitled', 'Untitled')}
          </p>
          {local.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{local.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
