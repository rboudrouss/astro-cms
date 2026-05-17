import { useRef, useEffect } from 'react'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function InstallingScreen({
  projectName,
  packageManager,
  logs,
  error,
  onRetry
}: {
  projectName: string
  packageManager: string
  logs: string[]
  error: string | null
  onRetry: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{projectName}</h1>

        <div className="mb-4 flex items-center gap-2">
          {error ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          <p className="text-muted-foreground">
            {error ? t('installError') : t('installingDepsUsing', { pm: packageManager })}
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        <div className="mb-4 max-h-64 overflow-y-auto rounded-md border bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
          {logs.length === 0 && !error && (
            <p className="text-zinc-500">{t('installingDeps')}</p>
          )}
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {error && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1 h-4 w-4" />
            {t('installRetry')}
          </Button>
        )}
      </div>
    </div>
  )
}
