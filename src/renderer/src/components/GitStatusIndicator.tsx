import { useTranslation } from 'react-i18next'
import { Circle } from 'lucide-react'
import type { GitWorkflowState, GitWorkflowStatus } from '../../../shared/git-types'

const stateColors: Record<GitWorkflowState, string> = {
  idle: 'text-green-500',
  committing: 'text-yellow-500',
  pushing: 'text-yellow-500',
  error: 'text-red-500'
}

export function GitStatusIndicator({ status }: { status: GitWorkflowStatus }): React.JSX.Element {
  const { t } = useTranslation()
  const color = stateColors[status.state]

  return (
    <div data-testid="git-status-indicator" className="flex items-center gap-1.5 text-sm">
      <Circle className={`h-3 w-3 fill-current ${color}`} />
      <span className="text-muted-foreground">{t(`git.${status.state}`)}</span>
    </div>
  )
}
