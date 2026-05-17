import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/App'
import { initI18n } from '@/i18n'
import type { TemplateInfo, NewProjectResult } from '../src/shared/types'

const mockTemplates: TemplateInfo[] = [
  { id: 'blog', name: 'Blog', description: 'Un blog.', themeName: 'theme-blog' },
  { id: 'vitrine-asso', name: 'Vitrine', description: 'Site asso.', themeName: 'theme-vitrine' }
]

function renderApp() {
  const i18n = initI18n('fr')
  return render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  )
}

describe('App wizard flow', () => {
  beforeEach(() => {
    vi.mocked(window.api.openProject).mockReset()
    vi.mocked(window.api.getRecentProjects).mockReset()
    vi.mocked(window.api.getRecentProjects).mockResolvedValue([])
    vi.mocked(window.api.getTemplates).mockReset()
    vi.mocked(window.api.getTemplates).mockResolvedValue(mockTemplates)
    vi.mocked(window.api.selectDirectory).mockReset()
    vi.mocked(window.api.newProject).mockReset()
  })

  it('clicking "Nouveau projet" opens the wizard', async () => {
    renderApp()
    await userEvent.click(screen.getByText('Nouveau projet'))

    await waitFor(() => {
      expect(screen.getByText('Choisir un template')).toBeInTheDocument()
    })
  })

  it('cancelling the wizard returns to welcome screen', async () => {
    renderApp()
    await userEvent.click(screen.getByText('Nouveau projet'))

    await waitFor(() => {
      expect(screen.getByText('Choisir un template')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Annuler'))

    await waitFor(() => {
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    })
  })

  it('full wizard flow ends on project screen', async () => {
    const successResult: NewProjectResult = {
      status: 'success',
      project: { name: 'site-asso', path: '/tmp/site-asso', themeName: 'theme-vitrine' }
    }
    vi.mocked(window.api.selectDirectory).mockResolvedValue('/tmp')
    vi.mocked(window.api.newProject).mockResolvedValue(successResult)

    renderApp()
    await userEvent.click(screen.getByText('Nouveau projet'))

    await waitFor(() => {
      expect(screen.getByText('Vitrine')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Vitrine'))
    await userEvent.click(screen.getByText('Suivant'))

    await userEvent.type(screen.getByPlaceholderText('mon-site'), 'site-asso')
    await userEvent.click(screen.getByText('Parcourir…'))
    await waitFor(() => {
      expect(screen.getByText('/tmp')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Créer le projet'))

    await waitFor(() => {
      expect(screen.getByText('Projet créé')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Ouvrir le projet'))

    await waitFor(() => {
      expect(screen.getByText('site-asso')).toBeInTheDocument()
      expect(screen.getByText('theme-vitrine')).toBeInTheDocument()
    })
  })
})
