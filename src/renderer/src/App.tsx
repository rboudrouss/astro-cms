import { useCallback, useEffect, useState } from 'react'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { ProjectScreen } from '@/components/ProjectScreen'
import { NewProjectWizard } from '@/components/NewProjectWizard'
import { InstallingScreen } from '@/components/InstallingScreen'
import { ErrorDialog } from '@/components/ErrorDialog'
import { UpdateNotification } from '@/components/UpdateNotification'
import type { ProjectInfo, ValidationError } from '../../shared/types'
import type { RecentProject } from '../../shared/ipc'

type AppState =
  | { screen: 'welcome' }
  | { screen: 'wizard' }
  | { screen: 'installing'; project: ProjectInfo; packageManager: string }
  | { screen: 'project'; project: ProjectInfo }

export function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({ screen: 'welcome' })
  const [errors, setErrors] = useState<ValidationError[] | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [installLogs, setInstallLogs] = useState<string[]>([])
  const [installError, setInstallError] = useState<string | null>(null)

  useEffect(() => {
    window.api.getRecentProjects().then(setRecentProjects)
  }, [])

  const runInstall = useCallback(async (project: ProjectInfo) => {
    setInstallLogs([])
    setInstallError(null)

    const unsub = window.api.onDepsInstallOutput((data) => {
      setInstallLogs((prev) => [...prev, data.line])
    })

    const result = await window.api.installDeps(project.path)
    unsub()

    if (result.success) {
      setState({ screen: 'project', project })
    } else {
      setInstallError(result.error)
    }
  }, [])

  const handleOpenProject = useCallback(async () => {
    const result = await window.api.openProject()
    if (result.status === 'valid') {
      window.api.getRecentProjects().then(setRecentProjects)
      const check = await window.api.checkDepsNeeded(result.project.path)
      if (check.needed) {
        setState({ screen: 'installing', project: result.project, packageManager: check.packageManager })
        runInstall(result.project)
      } else {
        setState({ screen: 'project', project: result.project })
      }
    } else if (result.status === 'invalid') {
      setErrors(result.errors)
    }
  }, [runInstall])

  const handleRetryInstall = useCallback(() => {
    if (state.screen === 'installing') {
      runInstall(state.project)
    }
  }, [state, runInstall])

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
      {state.screen === 'installing' && (
        <InstallingScreen
          projectName={state.project.name}
          packageManager={state.packageManager}
          logs={installLogs}
          error={installError}
          onRetry={handleRetryInstall}
        />
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
