import { ArrowLeft, FolderOpen, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProjectInfo } from '../../../shared/types'

export function ProjectScreen({
  project,
  onBack
}: {
  project: ProjectInfo
  onBack: () => void
}): React.JSX.Element {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour
        </Button>

        <h1 className="mb-6 text-2xl font-bold text-foreground">{project.name}</h1>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Palette className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Thème actif</p>
              <p className="text-foreground">{project.themeName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FolderOpen className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chemin</p>
              <p className="text-foreground">{project.path}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
