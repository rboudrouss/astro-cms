import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { NewProjectWizard } from '@/components/NewProjectWizard'
import { initI18n } from '@/i18n'
import type { TemplateInfo, NewProjectResult } from '../src/shared/types'

const mockTemplates: TemplateInfo[] = [
  { id: 'blog', name: 'Blog', description: 'Un blog personnel.', themeName: 'theme-blog' },
  {
    id: 'vitrine-asso',
    name: 'Vitrine association',
    description: 'Site vitrine pour asso.',
    themeName: 'theme-vitrine'
  }
]

function renderWizard(props?: { onComplete?: () => void; onCancel?: () => void }) {
  const i18n = initI18n('fr')
  return render(
    <I18nextProvider i18n={i18n}>
      <NewProjectWizard
        onComplete={props?.onComplete ?? vi.fn()}
        onCancel={props?.onCancel ?? vi.fn()}
      />
    </I18nextProvider>
  )
}

describe('NewProjectWizard', () => {
  beforeEach(() => {
    vi.mocked(window.api.getTemplates).mockReset()
    vi.mocked(window.api.getTemplates).mockResolvedValue(mockTemplates)
    vi.mocked(window.api.selectDirectory).mockReset()
    vi.mocked(window.api.newProject).mockReset()
  })

  it('shows template selection step initially', async () => {
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Choisir un template')).toBeInTheDocument()
    })
  })

  it('loads and displays templates', async () => {
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    expect(screen.getByText('Vitrine association')).toBeInTheDocument()
    expect(window.api.getTemplates).toHaveBeenCalled()
  })

  it('disables Next button when no template is selected', async () => {
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    expect(screen.getByText('Suivant')).toBeDisabled()
  })

  it('enables Next button after selecting a template', async () => {
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Blog'))
    expect(screen.getByText('Suivant')).toBeEnabled()
  })

  it('navigates to config step after clicking Next', async () => {
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Blog'))
    await userEvent.click(screen.getByText('Suivant'))

    expect(screen.getByText('Configuration')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('mon-site')).toBeInTheDocument()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn()
    renderWizard({ onCancel })
    await waitFor(() => {
      expect(screen.getByText('Annuler')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Annuler'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('can go back from config to template step', async () => {
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Blog'))
    await userEvent.click(screen.getByText('Suivant'))

    expect(screen.getByText('Configuration')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Retour'))
    expect(screen.getByText('Choisir un template')).toBeInTheDocument()
  })

  it('calls selectDirectory when browse button is clicked', async () => {
    vi.mocked(window.api.selectDirectory).mockResolvedValue('/home/user/projects')
    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Blog'))
    await userEvent.click(screen.getByText('Suivant'))

    await userEvent.click(screen.getByText('Parcourir…'))
    expect(window.api.selectDirectory).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
    })
  })

  it('creates project and shows success screen', async () => {
    const onComplete = vi.fn()
    const successResult: NewProjectResult = {
      status: 'success',
      project: { name: 'mon-blog', path: '/home/user/projects/mon-blog', themeName: 'theme-blog' }
    }
    vi.mocked(window.api.selectDirectory).mockResolvedValue('/home/user/projects')
    vi.mocked(window.api.newProject).mockResolvedValue(successResult)

    renderWizard({ onComplete })
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Blog'))
    await userEvent.click(screen.getByText('Suivant'))

    await userEvent.type(screen.getByPlaceholderText('mon-site'), 'mon-blog')
    await userEvent.click(screen.getByText('Parcourir…'))

    await waitFor(() => {
      expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Créer le projet'))

    await waitFor(() => {
      expect(screen.getByText('Projet créé')).toBeInTheDocument()
    })

    expect(window.api.newProject).toHaveBeenCalledWith({
      templateId: 'blog',
      projectName: 'mon-blog',
      parentDir: '/home/user/projects',
      initGit: true
    })

    await userEvent.click(screen.getByText('Ouvrir le projet'))
    expect(onComplete).toHaveBeenCalledWith(successResult.project)
  })

  it('shows error message on generation failure', async () => {
    const errorResult: NewProjectResult = {
      status: 'error',
      message: 'Le dossier existe déjà'
    }
    vi.mocked(window.api.selectDirectory).mockResolvedValue('/tmp')
    vi.mocked(window.api.newProject).mockResolvedValue(errorResult)

    renderWizard()
    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Blog'))
    await userEvent.click(screen.getByText('Suivant'))

    await userEvent.type(screen.getByPlaceholderText('mon-site'), 'test')
    await userEvent.click(screen.getByText('Parcourir…'))
    await waitFor(() => {
      expect(screen.getByText('/tmp')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Créer le projet'))

    await waitFor(() => {
      expect(screen.getByText('Le dossier existe déjà')).toBeInTheDocument()
    })
  })
})
