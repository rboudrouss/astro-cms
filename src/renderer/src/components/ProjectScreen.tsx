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
import { SeoPanel } from '@/components/SeoPanel'
import type {
  ProjectInfo, ProjectTree, SidebarItem, DevServerStatus,
  BlockSelection, BlockSelectionMessage, ThemeManifest, BlockManifest
} from '../../../shared/types'
import {
  detectSeoFields, extractSeoValues, hasSeoFields
} from '../../../shared/seo-fields'
import type { SeoFieldMapping, SeoValues } from '../../../shared/seo-fields'

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
  const [seoMapping, setSeoMapping] = useState<SeoFieldMapping>({})
  const [seoValues, setSeoValues] = useState<SeoValues>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const content = await window.api.readPageContent(item.fullPath)
    setEditorContent(content)

    const frontmatter = await window.api.getPageFrontmatter(item.fullPath)
    const layout = themeManifest?.layouts.find((l) =>
      typeof frontmatter.layout === 'string' && frontmatter.layout.includes(l.name)
    )
    const mapping = detectSeoFields(frontmatter, layout?.cmsHints)
    setSeoMapping(mapping)
    setSeoValues(extractSeoValues(frontmatter, mapping))
  }, [themeManifest])

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

  const handleSeoChange = useCallback(
    (values: SeoValues) => {
      setSeoValues(values)
      if (!selectedItem) return
      if (seoDebounceRef.current) clearTimeout(seoDebounceRef.current)
      seoDebounceRef.current = setTimeout(async () => {
        const fields: Record<string, unknown> = {}
        for (const [role, fieldName] of Object.entries(seoMapping)) {
          const value = values[role as keyof SeoValues]
          if (fieldName && value !== undefined) {
            fields[fieldName] = value
          }
        }
        const updated = await window.api.updatePageFrontmatter(selectedItem.fullPath, fields)
        setEditorContent(updated)
      }, DEBOUNCE_MS)
    },
    [selectedItem, seoMapping]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (seoDebounceRef.current) clearTimeout(seoDebounceRef.current)
    }
  }, [])

  const devServerUrl = devServerStatus.state === 'running' ? devServerStatus.url : undefined

  let sidePanel: React.ReactNode = null
  if (selectedBlockManifest && blockProps) {
    sidePanel = (
      <PropEditorPanel
        blockName={selectedBlockManifest.name}
        schema={selectedBlockManifest.props}
        cmsHints={selectedBlockManifest.cmsHints}
        values={blockProps}
        onChange={handlePropChange}
      />
    )
  } else if (hasSeoFields(seoMapping)) {
    sidePanel = (
      <SeoPanel
        mapping={seoMapping}
        values={seoValues}
        onChange={handleSeoChange}
      />
    )
  }

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
              {sidePanel}
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
