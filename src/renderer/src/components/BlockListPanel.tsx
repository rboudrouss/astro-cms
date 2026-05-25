import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import type { BlockInstance } from '../../../shared/types'

function SortableBlock({
  block,
  index,
  onDelete,
  onSelect,
  isSelected
}: {
  block: BlockInstance
  index: number
  onDelete: (index: number, name: string) => void
  onSelect: (block: BlockInstance) => void
  isSelected: boolean
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`page-block-${index}`}
      className={`flex items-center gap-1 rounded border px-2 py-1.5 text-sm ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
      }`}
      onClick={() => onSelect(block)}
    >
      <button className="cursor-grab touch-none text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate">{block.blockName}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
        data-testid="delete-block-btn"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(index, block.blockName)
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function BlockListPanel({
  blocks,
  selectedBlockId,
  onReorder,
  onDelete,
  onSelect
}: {
  blocks: BlockInstance[]
  selectedBlockId: string | null
  onReorder: (fromIndex: number, toIndex: number) => void
  onDelete: (blockIndex: number) => void
  onSelect: (block: BlockInstance) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [pendingDelete, setPendingDelete] = useState<{ index: number; name: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIdx = blocks.findIndex((b) => b.id === active.id)
    const toIdx = blocks.findIndex((b) => b.id === over.id)
    if (fromIdx !== -1 && toIdx !== -1) {
      onReorder(fromIdx, toIdx)
    }
  }

  function handleDeleteRequest(index: number, name: string): void {
    setPendingDelete({ index, name })
  }

  function confirmDelete(): void {
    if (pendingDelete) {
      onDelete(pendingDelete.index)
      setPendingDelete(null)
    }
  }

  return (
    <div className="px-3 py-2">
      <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {t('blockTree.pageBlocks')}
      </h3>
      {blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('blockTree.emptyPage')}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {blocks.map((block, i) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  index={i}
                  onDelete={handleDeleteRequest}
                  onSelect={onSelect}
                  isSelected={block.id === selectedBlockId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {pendingDelete && (
        <div className="mt-2 rounded border border-destructive bg-destructive/10 p-2">
          <p className="mb-2 text-sm">
            {t('blockTree.deleteConfirm', { name: pendingDelete.name })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              data-testid="confirm-delete-btn"
              onClick={confirmDelete}
            >
              {t('blockTree.deleteBtn')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingDelete(null)}
            >
              {t('wizard.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
