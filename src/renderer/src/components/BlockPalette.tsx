import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlockManifest } from '../../../shared/types'

export function BlockPalette({
  blocks,
  onInsert
}: {
  blocks: BlockManifest[]
  onInsert: (blockName: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="border-b px-3 py-2">
      <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {t('blockTree.palette')}
      </h3>
      {blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('blockTree.emptyPalette')}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {blocks.map((block) => (
            <div
              key={block.name}
              className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
            >
              <span>{block.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                data-testid="insert-palette-btn"
                onClick={() => onInsert(block.name)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
