import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import type { DivergenceInfo } from '../../../shared/git-types'

export function DivergenceWarningBanner({
  divergence
}: {
  divergence: DivergenceInfo | null
}): React.JSX.Element | null {
  const { t } = useTranslation()

  if (!divergence?.diverged) return null

  return (
    <div
      data-testid="divergence-warning"
      className="flex items-center gap-2 border-b border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {t('git.divergenceWarning')}{' '}
        {t('git.divergedBehind', { count: divergence.behind })}
      </span>
    </div>
  )
}
