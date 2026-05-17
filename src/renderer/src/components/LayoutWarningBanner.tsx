import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import type { LayoutManifest } from '../../../shared/types'

export function LayoutWarningBanner({
  currentLayout: _currentLayout,
  themeLayouts,
  onApplyLayout
}: {
  currentLayout: string
  themeLayouts: LayoutManifest[]
  onApplyLayout: (layoutName: string) => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (themeLayouts.length === 0) return null

  return (
    <div
      role="alert"
      className="flex items-center gap-2 border-b border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{t('layoutWarning.message')}</span>
      <div className="relative">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-yellow-400 bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {t('layoutWarning.applyLayout')}
          <ChevronDown className="h-3 w-3" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded border bg-white shadow-lg">
            {themeLayouts.map((layout) => (
              <button
                key={layout.name}
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                onClick={() => {
                  onApplyLayout(layout.name)
                  setDropdownOpen(false)
                }}
              >
                {layout.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
