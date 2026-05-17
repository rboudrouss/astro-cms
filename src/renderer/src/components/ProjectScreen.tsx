import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FolderOpen, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/Sidebar'
import type { ProjectInfo, ProjectTree, SidebarItem } from '../../../shared/types'

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

  useEffect(() => {
    window.api.scanProject(project.path).then(setTree)
    window.api.watchProject(project.path)

    const unsubscribe = window.api.onProjectTreeChanged(setTree)

    return () => {
      unsubscribe()
      window.api.unwatchProject()
    }
  }, [project.path])

  const handleSelect = useCallback((item: SidebarItem) => {
    setSelectedItem(item)
  }, [])

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
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar tree={tree} selectedPath={selectedItem?.fullPath ?? null} onSelect={handleSelect} />

        <main className="flex flex-1 items-center justify-center p-8">
          {selectedItem ? (
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-foreground">{selectedItem.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedItem.relativePath}</p>
              <p className="mt-4 text-sm text-muted-foreground">{t('sidebar.editing')}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('projectScreen.selectItem')}</p>
          )}
        </main>
      </div>
    </div>
  )
}
