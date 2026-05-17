import { FolderOpen, GitBranch, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/LanguageSelector'

export function WelcomeScreen(): React.JSX.Element {
  const { t } = useTranslation()

  const handleOpenProject = async (): Promise<void> => {
    await window.api.openProject()
  }

  const handleCloneProject = async (): Promise<void> => {
    await window.api.cloneProject('')
  }

  const handleNewProject = async (): Promise<void> => {
    await window.api.newProject()
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="absolute right-4 top-4">
        <LanguageSelector />
      </div>

      <h1 className="mb-2 text-3xl font-bold text-foreground">astro-cms</h1>
      <p className="mb-8 text-muted-foreground">{t('subtitle')}</p>

      <div className="mb-10 flex gap-4">
        <Button variant="outline" size="lg" onClick={handleOpenProject}>
          <FolderOpen />
          {t('openProject')}
        </Button>
        <Button variant="outline" size="lg" onClick={handleCloneProject}>
          <GitBranch />
          {t('cloneProject')}
        </Button>
        <Button variant="outline" size="lg" onClick={handleNewProject}>
          <Plus />
          {t('newProject')}
        </Button>
      </div>

      <div className="w-full max-w-md">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t('recentProjects')}</h2>
        <p className="text-sm text-muted-foreground">{t('noRecentProjects')}</p>
      </div>
    </div>
  )
}
