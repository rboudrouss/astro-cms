import { useTranslation } from 'react-i18next'
import { Smartphone, Tablet, Monitor, Maximize } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PreviewMode } from '../../../shared/types'

const modes: { mode: PreviewMode; icon: typeof Smartphone; i18nKey: string }[] = [
  { mode: 'mobile', icon: Smartphone, i18nKey: 'preview.mobile' },
  { mode: 'tablet', icon: Tablet, i18nKey: 'preview.tablet' },
  { mode: 'desktop', icon: Monitor, i18nKey: 'preview.desktop' },
  { mode: 'full', icon: Maximize, i18nKey: 'preview.full' }
]

export function PreviewToolbar({
  mode,
  onChange
}: {
  mode: PreviewMode
  onChange: (mode: PreviewMode) => void
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-1 border-b px-2 py-1" data-testid="preview-toolbar">
      {modes.map(({ mode: m, icon: Icon, i18nKey }) => (
        <button
          key={m}
          data-testid={`preview-mode-${m}`}
          aria-pressed={mode === m}
          title={t(i18nKey)}
          onClick={() => onChange(m)}
          className={cn(
            'rounded p-1.5 transition-colors',
            mode === m
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
