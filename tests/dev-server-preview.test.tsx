import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { DevServerStatus } from '../src/shared/types'

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

describe('Dev server integration in ProjectScreen', () => {
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

  it('starts the dev server when the project screen mounts', async () => {
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.startDevServer).toHaveBeenCalledWith('/projects/my-site')
    })
  })

  it('stops the dev server when the project screen unmounts', async () => {
    const { unmount } = renderWithI18n(
      <ProjectScreen project={mockProject} onBack={vi.fn()} />
    )

    await waitFor(() => {
      expect(window.api.startDevServer).toHaveBeenCalled()
    })

    unmount()

    expect(window.api.stopDevServer).toHaveBeenCalled()
  })

  it('shows starting indicator initially', async () => {
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('dev-server-indicator')).toBeInTheDocument()
    })
  })

  it('shows running indicator when dev server reports running', async () => {
    let statusCallback: (status: DevServerStatus) => void = () => {}
    ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (status: DevServerStatus) => void) => {
        statusCallback = cb
        return vi.fn()
      }
    )

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })

    statusCallback({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      const indicator = screen.getByTestId('dev-server-indicator')
      expect(indicator).toHaveTextContent('4321')
    })
  })

  it('shows error indicator when dev server reports error', async () => {
    let statusCallback: (status: DevServerStatus) => void = () => {}
    ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (status: DevServerStatus) => void) => {
        statusCallback = cb
        return vi.fn()
      }
    )

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })

    statusCallback({ state: 'error', error: 'Process crashed' })

    await waitFor(() => {
      const indicator = screen.getByTestId('dev-server-indicator')
      expect(indicator.querySelector('.text-red-500')).toBeInTheDocument()
    })
  })

  it('renders an iframe when dev server is running and a page is selected', async () => {
    const user = userEvent.setup()
    let statusCallback: (status: DevServerStatus) => void = () => {}
    ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (status: DevServerStatus) => void) => {
        statusCallback = cb
        return vi.fn()
      }
    )

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.onDevServerStatusChanged).toHaveBeenCalled()
    })

    statusCallback({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      const iframe = screen.getByTestId('preview-iframe') as HTMLIFrameElement
      expect(iframe).toBeInTheDocument()
      expect(iframe.src).toContain('http://localhost:4321/')
    })
  })

  it('still shows raw editor alongside preview', async () => {
    const user = userEvent.setup()
    let statusCallback: (status: DevServerStatus) => void = () => {}
    ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (status: DevServerStatus) => void) => {
        statusCallback = cb
        return vi.fn()
      }
    )

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    statusCallback({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })
  })
})
