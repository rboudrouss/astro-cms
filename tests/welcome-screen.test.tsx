import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { WelcomeScreen } from '@/components/WelcomeScreen'

const defaultProps = {
  recentProjects: [],
  onOpenProject: vi.fn()
}

describe('WelcomeScreen', () => {
  it('renders the app title', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByText('astro-cms')).toBeInTheDocument()
  })

  it('renders three action buttons', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    expect(screen.getByText('Cloner depuis git')).toBeInTheDocument()
    expect(screen.getByText('Nouveau projet')).toBeInTheDocument()
  })

  it('renders the recent projects section', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByText('Projets récents')).toBeInTheDocument()
    expect(screen.getByText('Aucun projet récent')).toBeInTheDocument()
  })

  it('calls onOpenProject when "Ouvrir un projet local" is clicked', async () => {
    const onOpenProject = vi.fn()
    render(<WelcomeScreen {...defaultProps} onOpenProject={onOpenProject} />)
    await userEvent.click(screen.getByText('Ouvrir un projet local'))
    expect(onOpenProject).toHaveBeenCalled()
  })

  it('calls cloneProject when "Cloner depuis git" is clicked', async () => {
    render(<WelcomeScreen {...defaultProps} />)
    await userEvent.click(screen.getByText('Cloner depuis git'))
    expect(window.api.cloneProject).toHaveBeenCalled()
  })

  it('calls newProject when "Nouveau projet" is clicked', async () => {
    render(<WelcomeScreen {...defaultProps} />)
    await userEvent.click(screen.getByText('Nouveau projet'))
    expect(window.api.newProject).toHaveBeenCalled()
  })

  it('displays recent projects when provided', () => {
    render(
      <WelcomeScreen
        recentProjects={[
          { path: '/tmp/proj', name: 'proj', lastOpened: '2026-05-17T10:00:00Z' }
        ]}
        onOpenProject={vi.fn()}
      />
    )
    expect(screen.getByText('proj')).toBeInTheDocument()
    expect(screen.queryByText('Aucun projet récent')).not.toBeInTheDocument()
  })
})
