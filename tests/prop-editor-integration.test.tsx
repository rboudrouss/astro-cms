import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { DevServerStatus, ThemeManifest } from '../src/shared/types'

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

const mockManifest: ThemeManifest = {
  name: 'my-theme',
  blocks: [
    {
      name: 'ImageText',
      label: 'ImageText',
      filePath: '/themes/my-theme/blocks/ImageText.astro',
      props: [
        { name: 'image', type: 'string', required: true, description: 'Image principale' },
        { name: 'text', type: 'string', required: true, description: 'Texte affiché' },
        { name: 'reversed', type: 'boolean', required: false }
      ],
      cmsHints: { image: { format: 'image' }, text: { format: 'richtext' } },
      slots: [],
      isCompositional: false
    },
    {
      name: 'ColorLigne',
      label: 'ColorLigne',
      filePath: '/themes/my-theme/blocks/ColorLigne.astro',
      props: [
        { name: 'color', type: 'string', required: true },
        { name: 'height', type: 'number', required: false }
      ],
      cmsHints: {},
      slots: [],
      isCompositional: false
    }
  ],
  layouts: [],
  variables: {}
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

describe('Block prop edition (Mode B1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockTree)
    ;(window.api.watchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.unwatchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onProjectTreeChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.startDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.stopDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onDevServerOutput as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.onThemeManifestUpdated as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.getThemeManifest as ReturnType<typeof vi.fn>).mockResolvedValue(mockManifest)
    ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(
      '---\ntitle: Home\n---\n\n# Welcome\n\n<ImageText image="/hero.png" text="Welcome" reversed />\n'
    )
    ;(window.api.getBlockProps as ReturnType<typeof vi.fn>).mockResolvedValue({
      image: '/hero.png',
      text: 'Welcome',
      reversed: true
    })
    ;(window.api.updateBlockProps as ReturnType<typeof vi.fn>).mockResolvedValue(
      '---\ntitle: Home\n---\n\n# Welcome\n\n<ImageText image="/updated.png" text="Welcome" reversed />\n'
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function renderAndSelectBlock(): Promise<ReturnType<typeof userEvent.setup>> {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'astro-cms:block-selected',
            blockId: 'ImageText',
            blockName: 'ImageText',
            blockPath: 'blocks/ImageText.astro'
          }
        })
      )
    })

    return user
  }

  it('shows prop editor panel when a block with a manifest is selected', async () => {
    await renderAndSelectBlock()

    await waitFor(() => {
      expect(screen.getByTestId('prop-editor-panel')).toBeInTheDocument()
    })
  })

  it('displays form fields generated from the block schema', async () => {
    await renderAndSelectBlock()

    await waitFor(() => {
      expect(screen.getByLabelText('image')).toBeInTheDocument()
      expect(screen.getByLabelText('text')).toBeInTheDocument()
      expect(screen.getByLabelText('reversed')).toBeInTheDocument()
    })
  })

  it('populates form fields with current prop values', async () => {
    await renderAndSelectBlock()

    await waitFor(() => {
      expect(screen.getByLabelText('image')).toHaveValue('/hero.png')
      expect(screen.getByLabelText('reversed')).toBeChecked()
    })
  })

  it('calls getBlockProps to extract current values from MDX', async () => {
    await renderAndSelectBlock()

    await waitFor(() => {
      expect(window.api.getBlockProps).toHaveBeenCalledWith(
        '/projects/my-site/src/pages/index.mdx',
        'ImageText'
      )
    })
  })

  it('calls updateBlockProps debounced at 500ms after prop change', async () => {
    const user = await renderAndSelectBlock()

    await waitFor(() => {
      expect(screen.getByLabelText('image')).toBeInTheDocument()
    })

    const imageInput = screen.getByLabelText('image')
    await user.clear(imageInput)
    await user.type(imageInput, '/new.png')

    expect(window.api.updateBlockProps).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(window.api.updateBlockProps).toHaveBeenCalledWith(
        '/projects/my-site/src/pages/index.mdx',
        'ImageText',
        expect.objectContaining({ image: '/new.png' })
      )
    })
  })

  it('does not show prop editor when no manifest match for selected block', async () => {
    ;(window.api.getThemeManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockManifest,
      blocks: []
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'astro-cms:block-selected',
            blockId: 'UnknownBlock',
            blockName: 'UnknownBlock',
            blockPath: 'blocks/UnknownBlock.astro'
          }
        })
      )
    })

    await waitFor(() => {
      expect(screen.queryByTestId('prop-editor-panel')).not.toBeInTheDocument()
    })
  })

  it('clears prop editor when switching pages', async () => {
    const twoPageTree = {
      pages: [
        ...mockTree.pages,
        {
          type: 'page' as const,
          name: 'about.mdx',
          relativePath: 'src/pages/about.mdx',
          fullPath: '/projects/my-site/src/pages/about.mdx'
        }
      ],
      collections: []
    }
    ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(twoPageTree)

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'astro-cms:block-selected',
            blockId: 'ImageText',
            blockName: 'ImageText',
            blockPath: 'blocks/ImageText.astro'
          }
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('prop-editor-panel')).toBeInTheDocument()
    })

    await user.click(screen.getByText('about.mdx'))

    await waitFor(() => {
      expect(screen.queryByTestId('prop-editor-panel')).not.toBeInTheDocument()
    })
  })
})
