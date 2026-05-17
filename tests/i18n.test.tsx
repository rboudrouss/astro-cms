import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { initI18n } from '@/i18n'

function renderWithI18n(lng: string) {
  const i18n = initI18n(lng)
  return render(
    <I18nextProvider i18n={i18n}>
      <WelcomeScreen />
    </I18nextProvider>
  )
}

describe('i18n', () => {
  describe('French strings', () => {
    it('renders all UI strings in French', () => {
      renderWithI18n('fr')
      expect(screen.getByText('Éditeur WYSIWYG pour sites Astro')).toBeInTheDocument()
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
      expect(screen.getByText('Cloner depuis git')).toBeInTheDocument()
      expect(screen.getByText('Nouveau projet')).toBeInTheDocument()
      expect(screen.getByText('Projets récents')).toBeInTheDocument()
      expect(screen.getByText('Aucun projet récent')).toBeInTheDocument()
    })
  })

  describe('English strings', () => {
    it('renders all UI strings in English', () => {
      renderWithI18n('en')
      expect(screen.getByText('WYSIWYG editor for Astro sites')).toBeInTheDocument()
      expect(screen.getByText('Open local project')).toBeInTheDocument()
      expect(screen.getByText('Clone from git')).toBeInTheDocument()
      expect(screen.getByText('New project')).toBeInTheDocument()
      expect(screen.getByText('Recent projects')).toBeInTheDocument()
      expect(screen.getByText('No recent projects')).toBeInTheDocument()
    })
  })

  describe('Language selector', () => {
    it('switches from French to English', async () => {
      renderWithI18n('fr')
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()

      const selector = screen.getByRole('combobox', { name: /langue|language/i })
      await userEvent.selectOptions(selector, 'en')

      expect(screen.getByText('Open local project')).toBeInTheDocument()
    })

    it('switches from English to French', async () => {
      renderWithI18n('en')
      expect(screen.getByText('Open local project')).toBeInTheDocument()

      const selector = screen.getByRole('combobox', { name: /langue|language/i })
      await userEvent.selectOptions(selector, 'fr')

      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    })
  })

  describe('OS locale detection', () => {
    it('falls back to French for unsupported locales', () => {
      renderWithI18n('ja')
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    })

    it('detects en- prefixed locales as English', () => {
      renderWithI18n('en-US')
      expect(screen.getByText('Open local project')).toBeInTheDocument()
    })

    it('detects fr- prefixed locales as French', () => {
      renderWithI18n('fr-CA')
      expect(screen.getByText('Ouvrir un projet local')).toBeInTheDocument()
    })
  })
})
