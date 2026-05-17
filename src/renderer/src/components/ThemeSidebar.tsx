import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Blocks, LayoutTemplate, Layers, Square } from 'lucide-react'
import type { ThemeManifest, BlockManifest, LayoutManifest } from '../../../shared/types'

export function ThemeSidebar({ projectPath }: { projectPath: string }): React.JSX.Element {
  const { t } = useTranslation()
  const [manifest, setManifest] = useState<ThemeManifest | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    window.api
      .getThemeManifest(projectPath)
      .then((m) => {
        setManifest(m)
        setError(!m)
      })
      .catch(() => setError(true))

    const cleanup = window.api.onThemeManifestUpdated((updated) => {
      setManifest(updated)
      setError(false)
    })

    return cleanup
  }, [projectPath])

  if (error) {
    return (
      <div className="w-64 border-r border-border bg-muted/30 p-4" data-testid="theme-sidebar">
        <p className="text-sm text-destructive">{t('themeLoadError')}</p>
      </div>
    )
  }

  if (!manifest) {
    return (
      <div className="w-64 border-r border-border bg-muted/30 p-4" data-testid="theme-sidebar">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border bg-muted/30 p-4" data-testid="theme-sidebar">
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Blocks className="h-4 w-4" />
          {t('blocks')}
        </h2>
        {manifest.blocks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noBlocks')}</p>
        ) : (
          <ul className="space-y-1">
            {manifest.blocks.map((block: BlockManifest) => (
              <li
                key={block.name}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                data-testid={`block-${block.name}`}
              >
                {block.isCompositional ? (
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>{block.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {block.isCompositional ? t('compositional') : t('leaf')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <LayoutTemplate className="h-4 w-4" />
          {t('layouts')}
        </h2>
        {manifest.layouts.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noLayouts')}</p>
        ) : (
          <ul className="space-y-1">
            {manifest.layouts.map((layout: LayoutManifest) => (
              <li
                key={layout.name}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                data-testid={`layout-${layout.name}`}
              >
                <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{layout.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
