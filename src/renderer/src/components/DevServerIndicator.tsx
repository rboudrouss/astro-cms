import { useTranslation } from 'react-i18next'
import { Circle } from 'lucide-react'
import type { DevServerStatus } from '../../../shared/types'

const stateColors: Record<string, string> = {
  starting: 'text-yellow-500',
  running: 'text-green-500',
  error: 'text-red-500',
  stopped: 'text-gray-400'
}

export function DevServerIndicator({ status }: { status: DevServerStatus }): React.JSX.Element {
  const { t } = useTranslation()
  const color = stateColors[status.state] ?? 'text-gray-400'

  return (
    <div data-testid="dev-server-indicator" className="flex items-center gap-1.5 text-sm">
      <Circle className={`h-3 w-3 fill-current ${color}`} />
      {status.state === 'running' && status.port && (
        <span className="text-muted-foreground">:{status.port}</span>
      )}
      {status.state === 'starting' && (
        <span className="text-muted-foreground">{t('devServer.starting')}</span>
      )}
      {status.state === 'error' && (
        <span className="text-muted-foreground">{t('devServer.error')}</span>
      )}
      {status.state === 'stopped' && (
        <span className="text-muted-foreground">{t('devServer.stopped')}</span>
      )}
    </div>
  )
}
