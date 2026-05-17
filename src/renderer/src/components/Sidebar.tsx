import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FileText, FolderOpen } from 'lucide-react'
import type { ProjectTree, SidebarItem, CollectionNode } from '../../../shared/types'

function FileItem({
  item,
  isSelected,
  onSelect
}: {
  item: SidebarItem
  isSelected: boolean
  onSelect: (item: SidebarItem) => void
}) {
  return (
    <button
      onClick={() => onSelect(item)}
      className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-accent/50 ${
        isSelected ? 'bg-accent text-accent-foreground' : ''
      }`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{item.name}</span>
    </button>
  )
}

function CollectionItem({
  collection,
  selectedPath,
  onSelect
}: {
  collection: CollectionNode
  selectedPath: string | null
  onSelect: (item: SidebarItem) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent/50"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <FolderOpen className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium">{collection.name}</span>
      </button>
      {expanded && (
        <div className="ml-4">
          {collection.entries.map((entry) => (
            <FileItem
              key={entry.fullPath}
              item={entry}
              isSelected={selectedPath === entry.fullPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  tree,
  selectedPath,
  onSelect
}: {
  tree: ProjectTree
  selectedPath: string | null
  onSelect: (item: SidebarItem) => void
}): React.JSX.Element {
  const { t } = useTranslation()

  const isEmpty = tree.pages.length === 0 && tree.collections.length === 0

  if (isEmpty) {
    return (
      <div className="flex h-full w-60 flex-col border-r bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">{t('sidebar.empty')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-60 flex-col overflow-y-auto border-r bg-muted/30 p-2">
      {tree.pages.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('sidebar.pages')}
          </h3>
          {tree.pages.map((page) => (
            <FileItem
              key={page.fullPath}
              item={page}
              isSelected={selectedPath === page.fullPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {tree.collections.length > 0 && (
        <div>
          <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('sidebar.collections')}
          </h3>
          {tree.collections.map((collection) => (
            <CollectionItem
              key={collection.name}
              collection={collection}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
