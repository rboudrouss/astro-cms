import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FolderOpen, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/Sidebar'
import { RawEditor } from '@/components/RawEditor'
import { DevServerIndicator } from '@/components/DevServerIndicator'
import { PreviewPane } from '@/components/PreviewPane'
import { BlockInfoBar } from '@/components/BlockInfoBar'
import { PropEditorPanel } from '@/components/PropEditorPanel'
import { BlockPalette } from '@/components/BlockPalette'
import { BlockListPanel } from '@/components/BlockListPanel'
import { reduce, initialState } from '@/block-tree-state'
import type {
  ProjectInfo, ProjectTree, SidebarItem, DevServerStatus,
  BlockSelection, BlockSelectionMessage, ThemeManifest, BlockManifest,
  BlockInstance
} from '../../../shared/types'

const DEBOUNCE_MS = 500

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
  const [blockTree, dispatchBlockTree] = useReducer(reduce, initialState())
  const undoSourceStack = useRef<string[]>([])
  const redoSourceStack = useRef<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const reloadPageBlocks = useCallback(async (filePath: string) => {
    const blocks = await window.api.getPageBlocks(filePath)
    dispatchBlockTree({ type: 'LOAD', blocks })
  }, [])

  const loadPageBlocksFresh = useCallback(async (filePath: string) => {
    await reloadPageBlocks(filePath)
    undoSourceStack.current = []
    redoSourceStack.current = []
  }, [reloadPageBlocks])

  const selectedBlockManifest: BlockManifest | undefined =
    themeManifest?.blocks.find((b) => b.name === selectedBlock?.blockName)

  const handleSelect = useCallback(async (item: SidebarItem) => {
    setSelectedItem(item)
    setSelectedBlock(null)
    setBlockProps(null)
    const content = await window.api.readPageContent(item.fullPath)
    setEditorContent(content)
    await loadPageBlocksFresh(item.fullPath)
  }, [loadPageBlocksFresh])

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

  const handleInsertBlock = useCallback(
    async (blockName: string) => {
      if (!selectedItem) return
      const position = blockTree.blocks.length
      if (editorContent) {
        undoSourceStack.current.push(editorContent)
        redoSourceStack.current = []
      }
      dispatchBlockTree({
        type: 'INSERT',
        block: { id: `block-new-${Date.now()}`, blockName, props: {} },
        position
      })
      const updated = await window.api.insertBlock(
        selectedItem.fullPath, blockName, {}, position
      )
      setEditorContent(updated)
      await reloadPageBlocks(selectedItem.fullPath)
    },
    [selectedItem, blockTree.blocks.length, editorContent, reloadPageBlocks]
  )

  const handleDeleteBlock = useCallback(
    async (blockIndex: number) => {
      if (!selectedItem) return
      if (editorContent) {
        undoSourceStack.current.push(editorContent)
        redoSourceStack.current = []
      }
      const block = blockTree.blocks[blockIndex]
      if (block) {
        dispatchBlockTree({ type: 'DELETE', blockId: block.id })
      }
      const updated = await window.api.deleteBlock(selectedItem.fullPath, blockIndex)
      setEditorContent(updated)
      await reloadPageBlocks(selectedItem.fullPath)
    },
    [selectedItem, blockTree.blocks, editorContent, reloadPageBlocks]
  )

  const handleReorderBlocks = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!selectedItem || fromIndex === toIndex) return
      if (editorContent) {
        undoSourceStack.current.push(editorContent)
        redoSourceStack.current = []
      }
      const block = blockTree.blocks[fromIndex]
      if (block) {
        dispatchBlockTree({ type: 'REORDER', blockId: block.id, toPosition: toIndex })
      }
      const updated = await window.api.reorderBlocks(selectedItem.fullPath, fromIndex, toIndex)
      setEditorContent(updated)
      await reloadPageBlocks(selectedItem.fullPath)
    },
    [selectedItem, blockTree.blocks, editorContent, reloadPageBlocks]
  )

  const handleUndo = useCallback(async () => {
    if (undoSourceStack.current.length === 0 || !selectedItem) return
    const previousSource = undoSourceStack.current.pop()!
    if (editorContent) {
      redoSourceStack.current.push(editorContent)
    }
    dispatchBlockTree({ type: 'UNDO' })
    await window.api.writePageContent(selectedItem.fullPath, previousSource)
    setEditorContent(previousSource)
    await reloadPageBlocks(selectedItem.fullPath)
  }, [selectedItem, editorContent, reloadPageBlocks])

  const handleRedo = useCallback(async () => {
    if (redoSourceStack.current.length === 0 || !selectedItem) return
    const nextSource = redoSourceStack.current.pop()!
    if (editorContent) {
      undoSourceStack.current.push(editorContent)
    }
    dispatchBlockTree({ type: 'REDO' })
    await window.api.writePageContent(selectedItem.fullPath, nextSource)
    setEditorContent(nextSource)
    await reloadPageBlocks(selectedItem.fullPath)
  }, [selectedItem, editorContent, reloadPageBlocks])

  const handleBlockSelect = useCallback((block: BlockInstance) => {
    setSelectedBlock({
      blockId: block.id,
      blockName: block.blockName,
      blockPath: ''
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const devServerUrl = devServerStatus.state === 'running' ? devServerStatus.url : undefined

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
        <div className="flex w-56 flex-col overflow-y-auto border-r">
          <Sidebar tree={tree} selectedPath={selectedItem?.fullPath ?? null} onSelect={handleSelect} />
          {selectedItem && themeManifest && (
            <>
              <BlockPalette
                blocks={themeManifest.blocks}
                onInsert={handleInsertBlock}
              />
              <BlockListPanel
                blocks={blockTree.blocks}
                selectedBlockId={selectedBlock?.blockId ?? null}
                onReorder={handleReorderBlocks}
                onDelete={handleDeleteBlock}
                onSelect={handleBlockSelect}
              />
            </>
          )}
        </div>

        <main className="flex flex-1 overflow-hidden">
          {selectedItem && editorContent !== null ? (
            <>
              <div className="flex w-1/2 flex-col border-r">
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
    </div>
  )
}
