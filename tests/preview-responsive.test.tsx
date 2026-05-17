import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import { PreviewToolbar } from '../src/renderer/src/components/PreviewToolbar'
import type { DevServerStatus, PreviewMode } from '../src/shared/types'

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
    },
    {
      type: 'page' as const,
      name: 'about.mdx',
      relativePath: 'src/pages/about.mdx',
      fullPath: '/projects/my-site/src/pages/about.mdx'
    }
  ],
  collections: []
}

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

function setupDevServerRunning() {
  let statusCallback: (status: DevServerStatus) => void = () => {}
  ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
    (cb: (status: DevServerStatus) => void) => {
      statusCallback = cb
      return vi.fn()
    }
  )
  return {
    setRunning: () =>
      statusCallback({ state: 'running', url: 'http://localhost:4321/', port: 4321 })
  }
}

describe('PreviewToolbar', () => {
  it('renders four mode buttons', () => {
    const onChange = vi.fn()
    renderWithI18n(<PreviewToolbar mode="full" onChange={onChange} />)

    expect(screen.getByTestId('preview-mode-mobile')).toBeInTheDocument()
    expect(screen.getByTestId('preview-mode-tablet')).toBeInTheDocument()
    expect(screen.getByTestId('preview-mode-desktop')).toBeInTheDocument()
    expect(screen.getByTestId('preview-mode-full')).toBeInTheDocument()
  })

  it('highlights the active mode', () => {
    const onChange = vi.fn()
    renderWithI18n(<PreviewToolbar mode="tablet" onChange={onChange} />)

    const tabletBtn = screen.getByTestId('preview-mode-tablet')
    expect(tabletBtn).toHaveAttribute('aria-pressed', 'true')

    const mobileBtn = screen.getByTestId('preview-mode-mobile')
    expect(mobileBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange when a mode is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithI18n(<PreviewToolbar mode="full" onChange={onChange} />)

    await user.click(screen.getByTestId('preview-mode-mobile'))
    expect(onChange).toHaveBeenCalledWith('mobile')
  })
})

describe('Preview responsive toggle in ProjectScreen', () => {
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
    ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(
      '---\ntitle: Home\n---\n\n# Welcome\n'
    )
  })

  it('shows preview toolbar when a page is selected and dev server running', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-full')).toBeInTheDocument()
    })
  })

  it('defaults to full width preview mode', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      const fullBtn = screen.getByTestId('preview-mode-full')
      expect(fullBtn).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('constrains iframe to 375px when mobile mode is selected', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-mobile')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('preview-mode-mobile'))

    await waitFor(() => {
      const container = screen.getByTestId('preview-container')
      expect(container.style.maxWidth).toBe('375px')
    })
  })

  it('constrains iframe to 768px when tablet mode is selected', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-tablet')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('preview-mode-tablet'))

    await waitFor(() => {
      const container = screen.getByTestId('preview-container')
      expect(container.style.maxWidth).toBe('768px')
    })
  })

  it('constrains iframe to 1280px when desktop mode is selected', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-desktop')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('preview-mode-desktop'))

    await waitFor(() => {
      const container = screen.getByTestId('preview-container')
      expect(container.style.maxWidth).toBe('1280px')
    })
  })

  it('removes max-width constraint when full mode is selected', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-mobile')).toBeInTheDocument()
    })

    // Switch to mobile first
    await user.click(screen.getByTestId('preview-mode-mobile'))
    await waitFor(() => {
      expect(screen.getByTestId('preview-container').style.maxWidth).toBe('375px')
    })

    // Switch back to full
    await user.click(screen.getByTestId('preview-mode-full'))
    await waitFor(() => {
      expect(screen.getByTestId('preview-container').style.maxWidth).toBe('')
    })
  })

  it('persists preview mode when switching between pages', async () => {
    const user = userEvent.setup()
    const { setRunning } = setupDevServerRunning()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })
    setRunning()

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-tablet')).toBeInTheDocument()
    })

    // Set tablet mode
    await user.click(screen.getByTestId('preview-mode-tablet'))
    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-tablet')).toHaveAttribute('aria-pressed', 'true')
    })

    // Switch to about page
    await user.click(screen.getByText('about.mdx'))

    // Tablet mode should still be selected
    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-tablet')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('preview-container').style.maxWidth).toBe('768px')
    })
  })
})
