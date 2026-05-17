import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/App'
import { initI18n } from '@/i18n'
import type { OpenProjectResult } from '../src/shared/types'

function renderApp() {
  const i18n = initI18n('fr')
  return render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  )
}

describe('App flow', () => {
  beforeEach(() => {
    vi.mocked(window.api.openProject).mockReset()
    vi.mocked(window.api.getRecentProjects).mockReset()
    vi.mocked(window.api.getRecentProjects).mockResolvedValue([])
  })

  it('shows welcome screen initially', () => {
    renderApp()
    expect(screen.getByText('astro-cms')).toBeInTheDocument()
    expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
  })

  it('shows project info after opening a valid project', async () => {
    const validResult: OpenProjectResult = {
      status: 'valid',
      project: { name: 'mon-site', path: '/home/user/mon-site', themeName: 'psu-theme' }
    }
    vi.mocked(window.api.openProject).mockResolvedValue(validResult)

    renderApp()
    await userEvent.click(screen.getByText('Ouvrir un projet local'))

    await waitFor(() => {
      expect(screen.getByText('mon-site')).toBeInTheDocument()
    })
    expect(screen.getByText('psu-theme')).toBeInTheDocument()
    expect(screen.getByText('/home/user/mon-site')).toBeInTheDocument()
  })

  it('shows error message for an invalid project', async () => {
    const invalidResult: OpenProjectResult = {
      status: 'invalid',
      errors: [
        { code: 'CONFIG_MISSING', message: 'Le fichier astro-cms.config.ts est introuvable.' }
      ]
    }
    vi.mocked(window.api.openProject).mockResolvedValue(invalidResult)

    renderApp()
    await userEvent.click(screen.getByText('Ouvrir un projet local'))

    await waitFor(() => {
      expect(
        screen.getByText('Le fichier astro-cms.config.ts est introuvable.')
      ).toBeInTheDocument()
    })
  })

  it('stays on welcome screen when file picker is cancelled', async () => {
    const cancelledResult: OpenProjectResult = { status: 'cancelled' }
    vi.mocked(window.api.openProject).mockResolvedValue(cancelledResult)

    renderApp()
    await userEvent.click(screen.getByText('Ouvrir un projet local'))

    await waitFor(() => {
      expect(screen.getByText('astro-cms')).toBeInTheDocument()
    })
    expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
  })

  it('displays recent projects on the welcome screen', async () => {
    vi.mocked(window.api.getRecentProjects).mockResolvedValue([
      { path: '/home/user/site-a', name: 'site-a', lastOpened: '2026-05-17T10:00:00Z' },
      { path: '/home/user/site-b', name: 'site-b', lastOpened: '2026-05-16T10:00:00Z' }
    ])

    renderApp()

    await waitFor(() => {
      expect(screen.getByText('site-a')).toBeInTheDocument()
    })
    expect(screen.getByText('site-b')).toBeInTheDocument()
  })

  it('allows returning to welcome screen from project view', async () => {
    const validResult: OpenProjectResult = {
      status: 'valid',
      project: { name: 'mon-site', path: '/tmp/mon-site', themeName: 'theme-a' }
    }
    vi.mocked(window.api.openProject).mockResolvedValue(validResult)

    renderApp()
    await userEvent.click(screen.getByText('Ouvrir un projet local'))

    await waitFor(() => {
      expect(screen.getByText('mon-site')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Retour'))

    await waitFor(() => {
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    })
  })

  it('dismisses error and returns to welcome screen', async () => {
    const invalidResult: OpenProjectResult = {
      status: 'invalid',
      errors: [
        { code: 'CONFIG_MISSING', message: 'Config manquant.' }
      ]
    }
    vi.mocked(window.api.openProject).mockResolvedValue(invalidResult)

    renderApp()
    await userEvent.click(screen.getByText('Ouvrir un projet local'))

    await waitFor(() => {
      expect(screen.getByText('Config manquant.')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Fermer'))

    await waitFor(() => {
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    })
    expect(screen.queryByText('Config manquant.')).not.toBeInTheDocument()
  })
})
