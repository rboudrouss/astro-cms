import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { WelcomeScreen } from '@/components/WelcomeScreen'

describe('WelcomeScreen', () => {
  it('renders the app title', () => {
    render(<WelcomeScreen />)
    expect(screen.getByText('astro-cms')).toBeInTheDocument()
  })

  it('renders three action buttons', () => {
    render(<WelcomeScreen />)
    expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    expect(screen.getByText('Cloner depuis git')).toBeInTheDocument()
    expect(screen.getByText('Nouveau projet')).toBeInTheDocument()
  })

  it('renders the recent projects section', () => {
    render(<WelcomeScreen />)
    expect(screen.getByText('Projets récents')).toBeInTheDocument()
    expect(screen.getByText('Aucun projet récent')).toBeInTheDocument()
  })

  it('calls openProject when "Ouvrir un projet local" is clicked', async () => {
    render(<WelcomeScreen />)
    await userEvent.click(screen.getByText('Ouvrir un projet local'))
    expect(window.api.openProject).toHaveBeenCalled()
  })

  it('calls cloneProject when "Cloner depuis git" is clicked', async () => {
    render(<WelcomeScreen />)
    await userEvent.click(screen.getByText('Cloner depuis git'))
    expect(window.api.cloneProject).toHaveBeenCalled()
  })

  it('calls newProject when "Nouveau projet" is clicked', async () => {
    render(<WelcomeScreen />)
    await userEvent.click(screen.getByText('Nouveau projet'))
    expect(window.api.newProject).toHaveBeenCalled()
  })
})
