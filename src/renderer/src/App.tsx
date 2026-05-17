import { useCallback, useEffect, useState } from 'react'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { ProjectScreen } from '@/components/ProjectScreen'
import { NewProjectWizard } from '@/components/NewProjectWizard'
import { ErrorDialog } from '@/components/ErrorDialog'
import { UpdateNotification } from '@/components/UpdateNotification'
import type { ProjectInfo, ValidationError } from '../../shared/types'
import type { RecentProject } from '../../shared/ipc'

type AppState =
  | { screen: 'welcome' }
  | { screen: 'wizard' }
  | { screen: 'project'; project: ProjectInfo }

export function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({ screen: 'welcome' })
  const [errors, setErrors] = useState<ValidationError[] | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])

  useEffect(() => {
    window.api.getRecentProjects().then(setRecentProjects)
  }, [])

  const handleOpenProject = useCallback(async () => {
    const result = await window.api.openProject()
    if (result.status === 'valid') {
      setState({ screen: 'project', project: result.project })
      window.api.getRecentProjects().then(setRecentProjects)
    } else if (result.status === 'invalid') {
      setErrors(result.errors)
    }
  }, [])

  const handleNewProject = useCallback(() => {
    setState({ screen: 'wizard' })
  }, [])

  const handleWizardComplete = useCallback((project: ProjectInfo) => {
    setState({ screen: 'project', project })
    window.api.getRecentProjects().then(setRecentProjects)
  }, [])

  const handleWizardCancel = useCallback(() => {
    setState({ screen: 'welcome' })
  }, [])

  return (
    <>
      {state.screen === 'welcome' && (
        <WelcomeScreen
          recentProjects={recentProjects}
          onOpenProject={handleOpenProject}
          onNewProject={handleNewProject}
        />
      )}
      {state.screen === 'wizard' && (
        <NewProjectWizard onComplete={handleWizardComplete} onCancel={handleWizardCancel} />
      )}
      {state.screen === 'project' && (
        <ProjectScreen
          project={state.project}
          onBack={() => setState({ screen: 'welcome' })}
        />
      )}
      {errors && <ErrorDialog errors={errors} onClose={() => setErrors(null)} />}
      <UpdateNotification />
    </>
  )
}
