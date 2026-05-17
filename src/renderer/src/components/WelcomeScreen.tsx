import { FolderOpen, GitBranch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RecentProject } from '../../../shared/ipc'

export function WelcomeScreen({
  recentProjects,
  onOpenProject
}: {
  recentProjects: RecentProject[]
  onOpenProject: () => void
}): React.JSX.Element {
  const handleCloneProject = async (): Promise<void> => {
    await window.api.cloneProject('')
  }

  const handleNewProject = async (): Promise<void> => {
    await window.api.newProject()
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <h1 className="mb-2 text-3xl font-bold text-foreground">astro-cms</h1>
      <p className="mb-8 text-muted-foreground">Éditeur WYSIWYG pour sites Astro</p>

      <div className="mb-10 flex gap-4">
        <Button variant="outline" size="lg" onClick={onOpenProject}>
          <FolderOpen />
          Ouvrir un projet local
        </Button>
        <Button variant="outline" size="lg" onClick={handleCloneProject}>
          <GitBranch />
          Cloner depuis git
        </Button>
        <Button variant="outline" size="lg" onClick={handleNewProject}>
          <Plus />
          Nouveau projet
        </Button>
      </div>

      <div className="w-full max-w-md">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Projets récents</h2>
        {recentProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun projet récent</p>
        ) : (
          <ul className="space-y-2">
            {recentProjects.map((project) => (
              <li
                key={project.path}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.path}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
