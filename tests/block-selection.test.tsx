import { render, screen, waitFor, act } from '@testing-library/react'
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

function setupRunningDevServer(): {
  setStatus: (status: DevServerStatus) => void
} {
  let statusCallback: (status: DevServerStatus) => void = () => {}
  ;(window.api.onDevServerStatusChanged as ReturnType<typeof vi.fn>).mockImplementation(
    (cb: (status: DevServerStatus) => void) => {
      statusCallback = cb
      return vi.fn()
    }
  )
  return {
    setStatus: (status: DevServerStatus) => statusCallback(status)
  }
}

describe('Block selection via iframe postMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockTree)
    ;(window.api.watchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.unwatchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onProjectTreeChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.startDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.stopDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onDevServerOutput as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(
      '---\ntitle: Home\n---\n\n# Welcome\n'
    )
  })

  async function renderWithPreview(
    tree = mockTree
  ): Promise<ReturnType<typeof userEvent.setup>> {
    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()
    ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(tree)

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })

    return user
  }

  function selectBlock(blockName: string, blockPath: string): void {
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'astro-cms:block-selected',
            blockId: blockName,
            blockName,
            blockPath
          }
        })
      )
    })
  }

  it('shows block info bar when a block-selected message is received', async () => {
    await renderWithPreview()

    selectBlock('ImageText', 'blocks/ImageText.astro')

    await waitFor(() => {
      expect(screen.getByTestId('block-info-bar')).toBeInTheDocument()
      expect(screen.getByTestId('block-info-bar')).toHaveTextContent('ImageText')
    })
  })

  it('updates block info bar when a different block is selected', async () => {
    await renderWithPreview()

    selectBlock('ImageText', 'blocks/ImageText.astro')

    await waitFor(() => {
      expect(screen.getByTestId('block-info-bar')).toHaveTextContent('ImageText')
    })

    selectBlock('Section', 'blocks/Section.astro')

    await waitFor(() => {
      expect(screen.getByTestId('block-info-bar')).toHaveTextContent('Section')
    })
  })

  it('does not show block info bar before any block is selected', async () => {
    await renderWithPreview()

    expect(screen.queryByTestId('block-info-bar')).not.toBeInTheDocument()
  })

  it('clears block selection when a different page is selected', async () => {
    const twoPageTree = {
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

    const user = await renderWithPreview(twoPageTree)

    selectBlock('ImageText', 'blocks/ImageText.astro')

    await waitFor(() => {
      expect(screen.getByTestId('block-info-bar')).toBeInTheDocument()
    })

    await user.click(screen.getByText('about.mdx'))

    await waitFor(() => {
      expect(screen.queryByTestId('block-info-bar')).not.toBeInTheDocument()
    })
  })

  it('ignores messages that are not block-selected events', async () => {
    await renderWithPreview()

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'some-other-event', payload: 'stuff' }
        })
      )
    })

    expect(screen.queryByTestId('block-info-bar')).not.toBeInTheDocument()
  })

  it('shows block path in the info bar', async () => {
    await renderWithPreview()

    selectBlock('ImageText', 'blocks/ImageText.astro')

    await waitFor(() => {
      expect(screen.getByTestId('block-info-bar')).toHaveTextContent('blocks/ImageText.astro')
    })
  })
})
