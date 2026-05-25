import { render, screen, waitFor, act } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { GitWorkflowStatus } from '../src/shared/git-types'

const mockProject = {
  name: 'my-site',
  path: '/projects/my-site',
  themeName: 'my-theme'
}

const mockTree = {
  pages: [
    {
      type: 'page' as const,
      name: 'index.mdx',
      relativePath: 'src/pages/index.mdx',
      fullPath: '/projects/my-site/src/pages/index.mdx'
    }
  ],
  collections: []
}

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('ProjectScreen git workflow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockTree)
    ;(window.api.watchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.unwatchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onProjectTreeChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.startDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.stopDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.onDevServerOutput as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.onGitStatusChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
  })

  it('initializes git workflow on mount', async () => {
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.initGitWorkflow).toHaveBeenCalledWith('/projects/my-site')
    })
  })

  it('shows git status indicator in the header', async () => {
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('git-status-indicator')).toBeInTheDocument()
    })
  })

  it('shows divergence warning when remote has diverged', async () => {
    const divergedStatus: GitWorkflowStatus = {
      state: 'idle',
      currentBranch: 'astro-cms-work',
      lastCommitHash: 'abc123',
      lastCommitTime: '2026-05-17',
      divergence: { diverged: true, ahead: 0, behind: 3 },
      error: null
    }
    ;(window.api.initGitWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue(divergedStatus)

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('divergence-warning')).toBeInTheDocument()
    })
  })

  it('does not show divergence warning when not diverged', async () => {
    const normalStatus: GitWorkflowStatus = {
      state: 'idle',
      currentBranch: 'astro-cms-work',
      lastCommitHash: 'abc123',
      lastCommitTime: '2026-05-17',
      divergence: { diverged: false, ahead: 0, behind: 0 },
      error: null
    }
    ;(window.api.initGitWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue(normalStatus)

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.initGitWorkflow).toHaveBeenCalled()
    })

    expect(screen.queryByTestId('divergence-warning')).not.toBeInTheDocument()
  })

  it('subscribes to git status changes and unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn()
    ;(window.api.onGitStatusChanged as ReturnType<typeof vi.fn>).mockReturnValue(unsubscribe)

    const { unmount } = renderWithI18n(
      <ProjectScreen project={mockProject} onBack={vi.fn()} />
    )

    await waitFor(() => {
      expect(window.api.onGitStatusChanged).toHaveBeenCalled()
    })

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('updates git status when status changed event fires', async () => {
    let gitStatusCallback: (status: GitWorkflowStatus) => void = () => {}
    ;(window.api.onGitStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (status: GitWorkflowStatus) => void) => {
        gitStatusCallback = cb
        return vi.fn()
      }
    )

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onGitStatusChanged).toHaveBeenCalled()
    })

    const divergedStatus: GitWorkflowStatus = {
      state: 'idle',
      currentBranch: 'astro-cms-work',
      lastCommitHash: 'def456',
      lastCommitTime: '2026-05-18',
      divergence: { diverged: true, ahead: 0, behind: 2 },
      error: null
    }

    act(() => {
      gitStatusCallback(divergedStatus)
    })

    await waitFor(() => {
      expect(screen.getByTestId('divergence-warning')).toBeInTheDocument()
    })
  })
})
