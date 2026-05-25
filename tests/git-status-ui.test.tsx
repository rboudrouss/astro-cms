import { render, screen, waitFor, act } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { GitStatusIndicator } from '../src/renderer/src/components/GitStatusIndicator'
import { DivergenceWarningBanner } from '../src/renderer/src/components/DivergenceWarningBanner'
import type { GitWorkflowStatus } from '../src/shared/git-types'

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('GitStatusIndicator', () => {
  it('shows idle state with green dot', () => {
    const status: GitWorkflowStatus = {
      state: 'idle',
      currentBranch: 'astro-cms-work',
      lastCommitHash: null,
      lastCommitTime: null,
      divergence: null,
      error: null
    }
    renderWithI18n(<GitStatusIndicator status={status} />)

    const indicator = screen.getByTestId('git-status-indicator')
    expect(indicator).toBeInTheDocument()
    expect(indicator.querySelector('.text-green-500')).toBeInTheDocument()
  })

  it('shows committing state with yellow dot', () => {
    const status: GitWorkflowStatus = {
      state: 'committing',
      currentBranch: 'astro-cms-work',
      lastCommitHash: null,
      lastCommitTime: null,
      divergence: null,
      error: null
    }
    renderWithI18n(<GitStatusIndicator status={status} />)

    const indicator = screen.getByTestId('git-status-indicator')
    expect(indicator.querySelector('.text-yellow-500')).toBeInTheDocument()
  })

  it('shows pushing state with yellow dot', () => {
    const status: GitWorkflowStatus = {
      state: 'pushing',
      currentBranch: 'astro-cms-work',
      lastCommitHash: null,
      lastCommitTime: null,
      divergence: null,
      error: null
    }
    renderWithI18n(<GitStatusIndicator status={status} />)

    const indicator = screen.getByTestId('git-status-indicator')
    expect(indicator.querySelector('.text-yellow-500')).toBeInTheDocument()
  })

  it('shows error state with red dot', () => {
    const status: GitWorkflowStatus = {
      state: 'error',
      currentBranch: 'astro-cms-work',
      lastCommitHash: null,
      lastCommitTime: null,
      divergence: null,
      error: 'git push failed'
    }
    renderWithI18n(<GitStatusIndicator status={status} />)

    const indicator = screen.getByTestId('git-status-indicator')
    expect(indicator.querySelector('.text-red-500')).toBeInTheDocument()
  })
})

describe('DivergenceWarningBanner', () => {
  it('renders nothing when there is no divergence', () => {
    const { container } = renderWithI18n(
      <DivergenceWarningBanner divergence={{ diverged: false, ahead: 0, behind: 0 }} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when divergence is null', () => {
    const { container } = renderWithI18n(
      <DivergenceWarningBanner divergence={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows warning when remote has diverged', () => {
    renderWithI18n(
      <DivergenceWarningBanner divergence={{ diverged: true, ahead: 0, behind: 3 }} />
    )

    const banner = screen.getByTestId('divergence-warning')
    expect(banner).toBeInTheDocument()
  })

  it('renders warning banner with correct structure for behind commits', () => {
    renderWithI18n(
      <DivergenceWarningBanner divergence={{ diverged: true, ahead: 1, behind: 5 }} />
    )

    const banner = screen.getByTestId('divergence-warning')
    expect(banner).toBeInTheDocument()
    expect(banner.querySelector('svg')).toBeInTheDocument()
  })
})
