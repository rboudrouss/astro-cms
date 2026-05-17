import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { initI18n } from '@/i18n'

const defaultProps = {
  recentProjects: [],
  onOpenProject: vi.fn()
}

function renderWelcomeScreen(props = defaultProps) {
  const i18n = initI18n('fr')
  return render(
    <I18nextProvider i18n={i18n}>
      <WelcomeScreen {...props} />
    </I18nextProvider>
  )
}

describe('WelcomeScreen', () => {
  it('renders the app title', () => {
    renderWelcomeScreen()
    expect(screen.getByText('astro-cms')).toBeInTheDocument()
  })

  it('renders three action buttons', () => {
    renderWelcomeScreen()
    expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    expect(screen.getByText('Cloner depuis git')).toBeInTheDocument()
    expect(screen.getByText('Nouveau projet')).toBeInTheDocument()
  })

  it('renders the recent projects section', () => {
    renderWelcomeScreen()
    expect(screen.getByText('Projets récents')).toBeInTheDocument()
    expect(screen.getByText('Aucun projet récent')).toBeInTheDocument()
  })

  it('calls onOpenProject when "Ouvrir un projet local" is clicked', async () => {
    const onOpenProject = vi.fn()
    renderWelcomeScreen({ ...defaultProps, onOpenProject })
    await userEvent.click(screen.getByText('Ouvrir un projet local'))
    expect(onOpenProject).toHaveBeenCalled()
  })

  it('calls cloneProject when "Cloner depuis git" is clicked', async () => {
    renderWelcomeScreen()
    await userEvent.click(screen.getByText('Cloner depuis git'))
    expect(window.api.cloneProject).toHaveBeenCalled()
  })

  it('calls newProject when "Nouveau projet" is clicked', async () => {
    renderWelcomeScreen()
    await userEvent.click(screen.getByText('Nouveau projet'))
    expect(window.api.newProject).toHaveBeenCalled()
  })

  it('displays recent projects when provided', () => {
    const i18n = initI18n('fr')
    render(
      <I18nextProvider i18n={i18n}>
        <WelcomeScreen
          recentProjects={[
            { path: '/tmp/proj', name: 'proj', lastOpened: '2026-05-17T10:00:00Z' }
          ]}
          onOpenProject={vi.fn()}
        />
      </I18nextProvider>
    )
    expect(screen.getByText('proj')).toBeInTheDocument()
    expect(screen.queryByText('Aucun projet récent')).not.toBeInTheDocument()
  })
})
