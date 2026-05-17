import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { InstallingScreen } from '@/components/InstallingScreen'
import { initI18n } from '@/i18n'

function renderWithI18n(ui: React.ReactElement, locale = 'fr') {
  const i18n = initI18n(locale)
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('InstallingScreen', () => {
  it('shows installing message with package manager name', () => {
    renderWithI18n(
      <InstallingScreen projectName="mon-site" packageManager="pnpm" logs={[]} error={null} onRetry={() => {}} />
    )
    expect(screen.getByText('Installation via pnpm…')).toBeInTheDocument()
  })

  it('displays the project name', () => {
    renderWithI18n(
      <InstallingScreen projectName="mon-site" packageManager="npm" logs={[]} error={null} onRetry={() => {}} />
    )
    expect(screen.getByText('mon-site')).toBeInTheDocument()
  })

  it('displays streamed log lines', () => {
    const logs = ['Resolving packages...', 'Downloading express@4.18.0']
    renderWithI18n(
      <InstallingScreen projectName="mon-site" packageManager="pnpm" logs={logs} error={null} onRetry={() => {}} />
    )
    expect(screen.getByText('Resolving packages...')).toBeInTheDocument()
    expect(screen.getByText('Downloading express@4.18.0')).toBeInTheDocument()
  })

  it('shows error message and retry button when install fails', () => {
    renderWithI18n(
      <InstallingScreen
        projectName="mon-site"
        packageManager="pnpm"
        logs={['some output']}
        error="pnpm install exited with code 1"
        onRetry={() => {}}
      />
    )
    expect(screen.getByText("Échec de l'installation")).toBeInTheDocument()
    expect(screen.getByText('pnpm install exited with code 1')).toBeInTheDocument()
    expect(screen.getByText('Réessayer')).toBeInTheDocument()
  })

  it('does not show retry button when there is no error', () => {
    renderWithI18n(
      <InstallingScreen projectName="mon-site" packageManager="pnpm" logs={[]} error={null} onRetry={() => {}} />
    )
    expect(screen.queryByText('Réessayer')).not.toBeInTheDocument()
  })
})
