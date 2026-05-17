import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FolderOpen, Palette, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/Sidebar'
import { RawEditor } from '@/components/RawEditor'
import { DevServerIndicator } from '@/components/DevServerIndicator'
import { PreviewPane } from '@/components/PreviewPane'
import { BlockInfoBar } from '@/components/BlockInfoBar'
import { PropEditorPanel } from '@/components/PropEditorPanel'
import { EntryEditorForm } from '@/components/EntryEditorForm'
import { NewEntryDialog } from '@/components/NewEntryDialog'
import { DeleteEntryDialog } from '@/components/DeleteEntryDialog'
import type {
  ProjectInfo, ProjectTree, SidebarItem, DevServerStatus,
  BlockSelection, BlockSelectionMessage, ThemeManifest, BlockManifest,
  CollectionSchema, EntryValidationError
} from '../../../shared/types'

const DEBOUNCE_MS = 500
const FM_RE = /^---\n([\s\S]*?)\n---/

function parseFrontmatterFromContent(content: string): Record<string, unknown> {
  const match = content.match(FM_RE)
  if (!match) return {}
  try {
    const lines = match[1].split('\n')
    const result: Record<string, unknown> = {}
    for (const line of lines) {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const key = line.slice(0, colonIdx).trim()
      let value: unknown = line.slice(colonIdx + 1).trim()
      if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (value !== '' && !isNaN(Number(value))) value = Number(value)
      result[key] = value
    }
    return result
  } catch {
    return {}
  }
}

function findCollectionName(tree: ProjectTree, item: SidebarItem): string | null {
  for (const collection of tree.collections) {
    if (collection.entries.some((e) => e.fullPath === item.fullPath)) {
      return collection.name
    }
  }
  return null
}

export function ProjectScreen({
  project,
  onBack
}: {
  project: ProjectInfo
  onBack: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [tree, setTree] = useState<ProjectTree>({ pages: [], collections: [] })
  const [selectedItem, setSelectedItem] = useState<SidebarItem | null>(null)
  const [editorContent, setEditorContent] = useState<string | null>(null)
  const [devServerStatus, setDevServerStatus] = useState<DevServerStatus>({ state: 'starting' })
  const [selectedBlock, setSelectedBlock] = useState<BlockSelection | null>(null)
  const [themeManifest, setThemeManifest] = useState<ThemeManifest | null>(null)
  const [blockProps, setBlockProps] = useState<Record<string, unknown> | null>(null)
  const [collectionSchema, setCollectionSchema] = useState<CollectionSchema | null>(null)
  const [entryFrontmatter, setEntryFrontmatter] = useState<Record<string, unknown>>({})
  const [entryValidationErrors, setEntryValidationErrors] = useState<EntryValidationError[]>([])
  const [newEntryCollection, setNewEntryCollection] = useState<string | null>(null)
  const [newEntrySchema, setNewEntrySchema] = useState<CollectionSchema | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SidebarItem | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fmDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.api.scanProject(project.path).then(setTree)
    window.api.watchProject(project.path)
    window.api.startDevServer(project.path)
    window.api.getThemeManifest(project.path).then((m) => {
      if (m) setThemeManifest(m)
    })

    const unsubTree = window.api.onProjectTreeChanged(setTree)
    const unsubStatus = window.api.onDevServerStatusChanged(setDevServerStatus)
    const unsubManifest = window.api.onThemeManifestUpdated(setThemeManifest)

    return () => {
      unsubTree()
      unsubStatus()
      unsubManifest()
      window.api.unwatchProject()
      window.api.stopDevServer()
    }
  }, [project.path])

  useEffect(() => {
    const handler = (event: MessageEvent): void => {
      const data = event.data as BlockSelectionMessage | undefined
      if (data?.type !== 'astro-cms:block-selected') return
      setSelectedBlock({
        blockId: data.blockId,
        blockName: data.blockName,
        blockPath: data.blockPath
      })
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    if (!selectedBlock || !selectedItem) {
      setBlockProps(null)
      return
    }
    window.api.getBlockProps(selectedItem.fullPath, selectedBlock.blockName).then(setBlockProps)
  }, [selectedBlock, selectedItem])

  const selectedBlockManifest: BlockManifest | undefined =
    themeManifest?.blocks.find((b) => b.name === selectedBlock?.blockName)

  const handleSelect = useCallback(async (item: SidebarItem) => {
    setSelectedItem(item)
    setSelectedBlock(null)
    setBlockProps(null)
    setCollectionSchema(null)
    setEntryFrontmatter({})
    setEntryValidationErrors([])
    const content = await window.api.readPageContent(item.fullPath)
    setEditorContent(content)

    if (item.type === 'entry') {
      const collectionName = findCollectionName(tree, item)
      if (collectionName) {
        const schema = await window.api.getCollectionSchema(project.path, collectionName)
        setCollectionSchema(schema)
        if (schema && content) {
          const fm = parseFrontmatterFromContent(content)
          setEntryFrontmatter(fm)
        }
      }
    }
  }, [project.path, tree])

  const handleSave = useCallback(
    async (content: string) => {
      if (selectedItem) {
        await window.api.writePageContent(selectedItem.fullPath, content)
      }
    },
    [selectedItem]
  )

  const handlePropChange = useCallback(
    (props: Record<string, unknown>) => {
      setBlockProps(props)
      if (!selectedItem || !selectedBlock) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        const updated = await window.api.updateBlockProps(
          selectedItem.fullPath,
          selectedBlock.blockName,
          props
        )
        setEditorContent(updated)
      }, DEBOUNCE_MS)
    },
    [selectedItem, selectedBlock]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (fmDebounceRef.current) clearTimeout(fmDebounceRef.current)
    }
  }, [])

  const handleNewEntry = useCallback(async (collectionName: string) => {
    const schema = await window.api.getCollectionSchema(project.path, collectionName)
    setNewEntrySchema(schema)
    setNewEntryCollection(collectionName)
  }, [project.path])

  const handleCreateEntry = useCallback(async (slug: string, frontmatter: Record<string, unknown>) => {
    if (!newEntryCollection) return
    const result = await window.api.createEntry(project.path, newEntryCollection, slug, frontmatter)
    setNewEntryCollection(null)
    setNewEntrySchema(null)
    if (result.status === 'success') {
      const refreshedTree = await window.api.scanProject(project.path)
      setTree(refreshedTree)
      handleSelect(result.entry)
    }
  }, [newEntryCollection, project.path, handleSelect])

  const handleDeleteEntry = useCallback(async () => {
    if (!deleteTarget) return
    await window.api.deleteEntry(deleteTarget.fullPath)
    setDeleteTarget(null)
    if (selectedItem?.fullPath === deleteTarget.fullPath) {
      setSelectedItem(null)
      setEditorContent(null)
      setCollectionSchema(null)
      setEntryFrontmatter({})
    }
    const refreshedTree = await window.api.scanProject(project.path)
    setTree(refreshedTree)
  }, [deleteTarget, selectedItem, project.path])

  const handleFrontmatterChange = useCallback((values: Record<string, unknown>) => {
    setEntryFrontmatter(values)

    if (collectionSchema) {
      const errors: EntryValidationError[] = []
      for (const field of collectionSchema.fields) {
        if (!field.required) continue
        const val = values[field.name]
        if (val === undefined || val === null || val === '') {
          errors.push({ field: field.name, message: `${field.name} is required` })
        }
      }
      setEntryValidationErrors(errors)
    }

    if (!selectedItem) return
    if (fmDebounceRef.current) clearTimeout(fmDebounceRef.current)
    fmDebounceRef.current = setTimeout(async () => {
      await window.api.updateEntryFrontmatter(selectedItem.fullPath, values)
      const content = await window.api.readPageContent(selectedItem.fullPath)
      setEditorContent(content)
    }, DEBOUNCE_MS)
  }, [selectedItem, collectionSchema])

  const devServerUrl = devServerStatus.state === 'running' ? devServerStatus.url : undefined

  const isEntry = selectedItem?.type === 'entry'

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('projectScreen.back')}
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Palette className="h-4 w-4" />
          {project.themeName}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          {project.path}
        </div>
        <div className="ml-auto">
          <DevServerIndicator status={devServerStatus} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tree={tree}
          selectedPath={selectedItem?.fullPath ?? null}
          onSelect={handleSelect}
          onNewEntry={handleNewEntry}
        />

        <main className="flex flex-1 overflow-hidden">
          {selectedItem && editorContent !== null ? (
            <>
              <div className="flex w-1/2 flex-col border-r">
                {isEntry && collectionSchema && (
                  <div className="border-b">
                    <div className="flex items-center justify-between px-3 py-2">
                      <h3 className="text-sm font-semibold">
                        {t('entryEditor.frontmatter')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeleteTarget(selectedItem)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t('entryEditor.delete')}
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <EntryEditorForm
                        schema={collectionSchema}
                        values={entryFrontmatter}
                        onChange={handleFrontmatterChange}
                        validationErrors={entryValidationErrors}
                      />
                    </div>
                  </div>
                )}
                <RawEditor
                  content={editorContent}
                  filePath={selectedItem.fullPath}
                  onSave={handleSave}
                />
              </div>
              <div className="flex w-1/2 flex-col">
                {devServerUrl ? (
                  <>
                    <PreviewPane url={devServerUrl} pagePath={selectedItem.relativePath} />
                    {selectedBlock && <BlockInfoBar selection={selectedBlock} />}
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-muted-foreground">{t('devServer.waiting')}</p>
                  </div>
                )}
              </div>
              {selectedBlockManifest && blockProps && (
                <PropEditorPanel
                  blockName={selectedBlockManifest.name}
                  schema={selectedBlockManifest.props}
                  cmsHints={selectedBlockManifest.cmsHints}
                  values={blockProps}
                  onChange={handlePropChange}
                />
              )}
            </>
          ) : selectedItem ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-foreground">{selectedItem.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedItem.relativePath}</p>
                <p className="mt-4 text-sm text-muted-foreground">{t('sidebar.editing')}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">{t('projectScreen.selectItem')}</p>
            </div>
          )}
        </main>
      </div>

      {newEntryCollection && (
        <NewEntryDialog
          collectionName={newEntryCollection}
          schema={newEntrySchema}
          onCreate={handleCreateEntry}
          onCancel={() => { setNewEntryCollection(null); setNewEntrySchema(null) }}
        />
      )}

      {deleteTarget && (
        <DeleteEntryDialog
          entryName={deleteTarget.name}
          onConfirm={handleDeleteEntry}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
