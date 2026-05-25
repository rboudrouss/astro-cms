import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FolderOpen, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/Sidebar'
import { RawEditor } from '@/components/RawEditor'
import { DevServerIndicator } from '@/components/DevServerIndicator'
import { PreviewPane } from '@/components/PreviewPane'
import { BlockInfoBar } from '@/components/BlockInfoBar'
import { PropEditorPanel } from '@/components/PropEditorPanel'
import { InlineEditor } from '@/components/InlineEditor'
import type {
  ProjectInfo, ProjectTree, SidebarItem, DevServerStatus,
  BlockSelection, BlockSelectionMessage, TextSelectionMessage,
  ThemeManifest, BlockManifest, TextNodeInfo
} from '../../../shared/types'

const DEBOUNCE_MS = 500

const TAG_TO_TYPE: Record<string, TextNodeInfo['type']> = {
  h1: 'heading', h2: 'heading', h3: 'heading',
  h4: 'heading', h5: 'heading', h6: 'heading',
  p: 'paragraph', blockquote: 'blockquote'
}

function findMatchingTextNode(
  nodes: TextNodeInfo[],
  selection: TextSelectionMessage
): number {
  const expectedType = TAG_TO_TYPE[selection.tagName]
  if (!expectedType) return -1

  const match = nodes.find(
    (n) => n.type === expectedType && n.textContent === selection.textContent
  )
  return match ? match.index : -1
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
  const [textSelection, setTextSelection] = useState<TextSelectionMessage | null>(null)
  const [textNodes, setTextNodes] = useState<TextNodeInfo[]>([])
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
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
      const data = event.data as BlockSelectionMessage | TextSelectionMessage | undefined
      if (!data?.type) return

      if (data.type === 'astro-cms:block-selected') {
        setSelectedBlock({
          blockId: data.blockId,
          blockName: data.blockName,
          blockPath: data.blockPath
        })
        setTextSelection(null)
      } else if (data.type === 'astro-cms:text-selected') {
        setTextSelection(data as TextSelectionMessage)
        setSelectedBlock(null)
      }
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
    setTextSelection(null)
    const content = await window.api.readPageContent(item.fullPath)
    setEditorContent(content)
    const nodes = await window.api.getTextNodes(item.fullPath)
    setTextNodes(nodes)
  }, [])

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

  const handleInlineSave = useCallback(
    async (html: string) => {
      if (!selectedItem || !textSelection) return

      const matchIndex = findMatchingTextNode(textNodes, textSelection)
      if (matchIndex === -1) {
        setTextSelection(null)
        return
      }

      const updated = await window.api.saveInlineEdit(
        selectedItem.fullPath,
        matchIndex,
        html
      )
      setEditorContent(updated)
      setTextSelection(null)

      const nodes = await window.api.getTextNodes(selectedItem.fullPath)
      setTextNodes(nodes)
    },
    [selectedItem, textSelection, textNodes]
  )

  const handleInlineCancel = useCallback(() => {
    setTextSelection(null)
  }, [])

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
        <Sidebar tree={tree} selectedPath={selectedItem?.fullPath ?? null} onSelect={handleSelect} />

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
              <div className="relative flex w-1/2 flex-col">
                {devServerUrl ? (
                  <>
                    <div ref={(el) => {
                      const iframe = el?.querySelector('iframe')
                      if (iframe && iframeRef.current !== iframe) {
                        iframeRef.current = iframe
                      }
                    }}>
                      <PreviewPane url={devServerUrl} pagePath={selectedItem.relativePath} />
                    </div>
                    {selectedBlock && <BlockInfoBar selection={selectedBlock} />}
                    {textSelection && iframeRef.current && (
                      <InlineEditor
                        selection={textSelection}
                        iframeRect={iframeRef.current.getBoundingClientRect()}
                        onSave={handleInlineSave}
                        onCancel={handleInlineCancel}
                      />
                    )}
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
