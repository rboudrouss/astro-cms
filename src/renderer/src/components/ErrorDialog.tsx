import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ValidationError } from '../../../shared/types'

export function ErrorDialog({
  errors,
  onClose
}: {
  errors: ValidationError[]
  onClose: () => void
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Projet invalide</h2>
        </div>

        <ul className="mb-6 space-y-2">
          {errors.map((error, i) => (
            <li key={i} className="text-sm text-foreground">
              {error.message}
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}
