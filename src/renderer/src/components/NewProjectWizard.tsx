import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TemplateInfo, ProjectInfo } from '../../../shared/types'

type WizardStep = 'template' | 'config' | 'success'

export function NewProjectWizard({
  onComplete,
  onCancel
}: {
  onComplete: (project: ProjectInfo) => void
  onCancel: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [step, setStep] = useState<WizardStep>('template')
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [parentDir, setParentDir] = useState<string | null>(null)
  const [initGit, setInitGit] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdProject, setCreatedProject] = useState<ProjectInfo | null>(null)

  useEffect(() => {
    window.api.getTemplates().then(setTemplates)
  }, [])

  const handleSelectFolder = useCallback(async () => {
    const dir = await window.api.selectDirectory()
    if (dir) setParentDir(dir)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!selectedTemplate || !projectName.trim() || !parentDir) return

    setCreating(true)
    setError(null)

    const result = await window.api.newProject({
      templateId: selectedTemplate,
      projectName: projectName.trim(),
      parentDir,
      initGit
    })

    setCreating(false)

    if (result.status === 'success') {
      setCreatedProject(result.project)
      setStep('success')
    } else if (result.status === 'error') {
      setError(result.message)
    }
  }, [selectedTemplate, projectName, parentDir, initGit])

  const canProceedToConfig = selectedTemplate !== null
  const canCreate = selectedTemplate && projectName.trim() && parentDir

  if (step === 'success' && createdProject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">{t('wizard.successTitle')}</h2>
          <p className="mb-6 text-muted-foreground">
            {t('wizard.successMessage', { name: createdProject.name })}
          </p>
          <Button size="lg" onClick={() => onComplete(createdProject)}>
            {t('wizard.openCreatedProject')}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'config') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-2xl font-bold text-foreground">{t('wizard.stepConfig')}</h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('wizard.projectName')}
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('wizard.projectNamePlaceholder')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('wizard.parentDir')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 truncate rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {parentDir ?? t('wizard.noFolderSelected')}
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectFolder}>
                <FolderOpen className="mr-1 h-4 w-4" />
                {t('wizard.selectFolder')}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={initGit}
                onChange={(e) => setInitGit(e.target.checked)}
                className="rounded"
              />
              {t('wizard.initGit')}
            </label>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('template')}>
              {t('wizard.back')}
            </Button>
            <Button onClick={handleCreate} disabled={!canCreate || creating}>
              {creating ? t('wizard.creating') : t('wizard.create')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <h2 className="mb-6 text-2xl font-bold text-foreground">{t('wizard.stepTemplate')}</h2>

        <div className="mb-6 space-y-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                selectedTemplate === template.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              }`}
            >
              <p className="font-medium text-foreground">{template.name}</p>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            {t('wizard.cancel')}
          </Button>
          <Button onClick={() => setStep('config')} disabled={!canProceedToConfig}>
            {t('wizard.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
