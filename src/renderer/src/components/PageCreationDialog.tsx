import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { VALID_SLUG, type LayoutManifest } from '../../../shared/types'

export function PageCreationDialog({
  projectPath,
  layouts,
  directories,
  onCreated,
  onClose
}: {
  projectPath: string
  layouts: LayoutManifest[]
  directories: string[]
  onCreated: () => void
  onClose: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [slug, setSlug] = useState('')
  const [directory, setDirectory] = useState(directories[0] ?? '')
  const [layoutIndex, setLayoutIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    if (!slug.trim()) {
      setError(t('pageWizard.errorSlugEmpty'))
      return
    }

    if (!VALID_SLUG.test(slug)) {
      setError(t('pageWizard.errorSlugInvalid'))
      return
    }

    setCreating(true)
    const result = await window.api.createPage({
      projectPath,
      directory,
      slug,
      layoutPath: layouts[layoutIndex].filePath
    })

    if (result.success) {
      onCreated()
    } else {
      setError(result.error)
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{t('pageWizard.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="page-slug" className="mb-1 block text-sm font-medium">
              {t('pageWizard.slug')}
            </label>
            <input
              id="page-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={t('pageWizard.slugPlaceholder')}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
              disabled={creating}
            />
          </div>

          <div>
            <label htmlFor="page-directory" className="mb-1 block text-sm font-medium">
              {t('pageWizard.directory')}
            </label>
            <select
              id="page-directory"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
              disabled={creating}
            >
              {directories.map((dir) => (
                <option key={dir} value={dir}>
                  {dir || t('pageWizard.directoryRoot')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="page-layout" className="mb-1 block text-sm font-medium">
              {t('pageWizard.layout')}
            </label>
            <select
              id="page-layout"
              value={layoutIndex}
              onChange={(e) => setLayoutIndex(Number(e.target.value))}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
              disabled={creating}
            >
              {layouts.map((layout, i) => (
                <option key={layout.name} value={i}>
                  {layout.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
              {t('pageWizard.cancel')}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? t('pageWizard.creating') : t('pageWizard.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
