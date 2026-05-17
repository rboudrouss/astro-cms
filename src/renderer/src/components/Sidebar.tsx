import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FileText, FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageCreationDialog } from '@/components/PageCreationDialog'
import type { ProjectTree, SidebarItem, CollectionNode, PageNode, ThemeManifest, InternalLinkReference } from '../../../shared/types'

function PageItem({
  item,
  isSelected,
  onSelect,
  onRename,
  onDelete
}: {
  item: PageNode
  isSelected: boolean
  onSelect: (item: SidebarItem) => void
  onRename: (item: PageNode) => void
  onDelete: (item: PageNode) => void
}) {
  const { t } = useTranslation()

  return (
    <div data-page-item className="group flex items-center">
      <button
        onClick={() => onSelect(item)}
        className={`flex flex-1 items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-accent/50 ${
          isSelected ? 'bg-accent text-accent-foreground' : ''
        }`}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{item.name}</span>
      </button>
      <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
        <button
          title={t('pageActions.rename')}
          onClick={(e) => {
            e.stopPropagation()
            onRename(item)
          }}
          className="rounded p-0.5 hover:bg-accent"
        >
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
        <button
          title={t('pageActions.delete')}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item)
          }}
          className="rounded p-0.5 hover:bg-accent"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

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

function RenameDialog({
  page,
  projectPath,
  onRenamed,
  onClose
}: {
  page: PageNode
  projectPath: string
  onRenamed: (oldPath: string, newPath: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [slug, setSlug] = useState(page.name)
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<InternalLinkReference[]>([])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (slug === page.name) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const foundLinks = await window.api.findInternalLinks(projectPath, page.name)
      if (foundLinks.length > 0 && links.length === 0) {
        setLinks(foundLinks)
        setSaving(false)
        return
      }

      const newPath = await window.api.renamePage(page.fullPath, slug)
      onRenamed(page.fullPath, newPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pageActions.errorRenameFailed'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{t('pageActions.renameTitle')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rename-slug" className="mb-1 block text-sm font-medium">
              {t('pageActions.renameSlug')}
            </label>
            <input
              id="rename-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
              disabled={saving}
            />
          </div>

          {links.length > 0 && (
            <div className="rounded border border-yellow-500/50 bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {t('pageActions.brokenLinksWarning', { count: links.length })}
              </p>
              <ul className="mt-1 list-inside list-disc text-yellow-700 dark:text-yellow-300">
                {links.map((link, i) => (
                  <li key={i} className="truncate">{link.content}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('pageActions.renameCancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {t('pageActions.renameSave')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteDialog({
  page,
  projectPath,
  onDeleted,
  onClose
}: {
  page: PageNode
  projectPath: string
  onDeleted: (path: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [links, setLinks] = useState<InternalLinkReference[] | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useState(() => {
    window.api.findInternalLinks(projectPath, page.name).then(setLinks)
  })

  const handleDelete = async (): Promise<void> => {
    setDeleting(true)
    try {
      await window.api.deletePage(page.fullPath)
      onDeleted(page.fullPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pageActions.errorDeleteFailed'))
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{t('pageActions.confirmDeleteTitle')}</h2>

        <p className="mb-4 text-sm">
          {t('pageActions.confirmDeleteMessage', { name: page.name })}
        </p>

        {links && links.length > 0 && (
          <div className="mb-4 rounded border border-yellow-500/50 bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              {t('pageActions.confirmDeleteWithLinks', { count: links.length })}
            </p>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            {t('pageActions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {t('pageActions.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({
  tree,
  selectedPath,
  onSelect,
  projectPath,
  themeManifest,
  onPageCreated,
  onPageRenamed,
  onPageDeleted
}: {
  tree: ProjectTree
  selectedPath: string | null
  onSelect: (item: SidebarItem) => void
  projectPath?: string
  themeManifest?: ThemeManifest | null
  onPageCreated?: () => void
  onPageRenamed?: (oldPath: string, newPath: string) => void
  onPageDeleted?: (path: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [renamingPage, setRenamingPage] = useState<PageNode | null>(null)
  const [deletingPage, setDeletingPage] = useState<PageNode | null>(null)
  const [directories, setDirectories] = useState<string[]>([''])

  const hasLayouts = themeManifest && themeManifest.layouts.length > 0

  const handleNewPageClick = useCallback(async () => {
    if (projectPath) {
      const dirs = await window.api.listPageDirectories(projectPath)
      setDirectories(dirs)
    }
    setShowCreateDialog(true)
  }, [projectPath])

  const handlePageCreated = useCallback(() => {
    setShowCreateDialog(false)
    onPageCreated?.()
  }, [onPageCreated])

  const handlePageRenamed = useCallback(
    (oldPath: string, newPath: string) => {
      setRenamingPage(null)
      onPageRenamed?.(oldPath, newPath)
    },
    [onPageRenamed]
  )

  const handlePageDeleted = useCallback(
    (path: string) => {
      setDeletingPage(null)
      onPageDeleted?.(path)
    },
    [onPageDeleted]
  )

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
          <div className="mb-1 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('sidebar.pages')}
            </h3>
            {hasLayouts && (
              <button
                title={t('pageActions.newPage')}
                onClick={handleNewPageClick}
                className="rounded p-0.5 hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {tree.pages.map((page) => (
            <PageItem
              key={page.fullPath}
              item={page}
              isSelected={selectedPath === page.fullPath}
              onSelect={onSelect}
              onRename={setRenamingPage}
              onDelete={setDeletingPage}
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

      {showCreateDialog && projectPath && themeManifest && (
        <PageCreationDialog
          projectPath={projectPath}
          layouts={themeManifest.layouts}
          directories={directories}
          onCreated={handlePageCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {renamingPage && projectPath && (
        <RenameDialog
          page={renamingPage}
          projectPath={projectPath}
          onRenamed={handlePageRenamed}
          onClose={() => setRenamingPage(null)}
        />
      )}

      {deletingPage && projectPath && (
        <DeleteDialog
          page={deletingPage}
          projectPath={projectPath}
          onDeleted={handlePageDeleted}
          onClose={() => setDeletingPage(null)}
        />
      )}
    </div>
  )
}
