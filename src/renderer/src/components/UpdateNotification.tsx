import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function UpdateNotification(): React.JSX.Element | null {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    return window.api.onUpdateDownloaded((info) => {
      setVersion(info.version)
    })
  }, [])

  if (!version) return null

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg"
    >
      <p className="text-sm text-foreground">
        Nouvelle version {version} disponible
      </p>
      <Button size="sm" onClick={() => window.api.installAndRestart()}>
        Redémarrer
      </Button>
    </div>
  )
}
