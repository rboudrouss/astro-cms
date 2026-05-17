import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type Props = {
  entryName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteEntryDialog({ entryName, onConfirm, onCancel }: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div data-testid="delete-entry-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">{t('entryEditor.deleteConfirm')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('entryEditor.deleteConfirmMessage', { name: entryName })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t('entryEditor.deleteConfirmNo')}
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            {t('entryEditor.deleteConfirmYes')}
          </Button>
        </div>
      </div>
    </div>
  )
}
