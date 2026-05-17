import { useCallback, useState } from 'react'
import { ArrowLeft, FolderOpen, Palette, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ThemeSidebar } from '@/components/ThemeSidebar'
import { RawEditor } from '@/components/RawEditor'
import type { ProjectInfo } from '../../../shared/types'

type EditorState =
  | { mode: 'overview' }
  | { mode: 'editing'; filePath: string; content: string }

export function ProjectScreen({
  project,
  onBack
}: {
  project: ProjectInfo
  onBack: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [editor, setEditor] = useState<EditorState>({ mode: 'overview' })

  const handleOpenPage = useCallback(async () => {
    const pagePath = `${project.path}/src/pages/index.mdx`
    const content = await window.api.readPageContent(pagePath)
    setEditor({ mode: 'editing', filePath: pagePath, content })
  }, [project.path])

  const handleSave = useCallback(
    async (content: string) => {
      if (editor.mode === 'editing') {
        await window.api.writePageContent(editor.filePath, content)
      }
    },
    [editor]
  )

  if (editor.mode === 'editing') {
    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditor({ mode: 'overview' })}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('back', 'Retour')}
          </Button>
        </div>
        <div className="flex-1">
          <RawEditor
            content={editor.content}
            filePath={editor.filePath}
            onSave={handleSave}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <ThemeSidebar projectPath={project.path} />
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('back', 'Retour')}
          </Button>

          <h1 className="mb-6 text-2xl font-bold text-foreground">{project.name}</h1>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Palette className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('activeTheme', 'Thème actif')}
                </p>
                <p className="text-foreground">{project.themeName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FolderOpen className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('path', 'Chemin')}
                </p>
                <p className="text-foreground">{project.path}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button onClick={handleOpenPage}>
              <FileText className="mr-2 h-4 w-4" />
              {t('openPage', 'Ouvrir une page')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
