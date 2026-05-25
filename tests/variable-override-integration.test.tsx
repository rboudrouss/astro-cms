import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { ThemeManifest } from '../src/shared/types'

const manifest: ThemeManifest = {
  name: 'test-theme',
  blocks: [],
  layouts: [],
  variables: {
    mainColor: { type: 'color', default: '#000' },
    fontSize: { type: 'number', default: 16 }
  }
}

const tree = {
  pages: [
    { type: 'page' as const, name: 'index.mdx', relativePath: 'index.mdx', fullPath: '/project/src/pages/index.mdx' }
  ],
  collections: []
}

const project = {
  name: 'test-project',
  path: '/project',
  themeName: 'test-theme'
}

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('Variable override integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(window.api.getThemeManifest).mockResolvedValue(manifest)
    vi.mocked(window.api.scanProject).mockResolvedValue(tree)
    vi.mocked(window.api.readPageContent).mockResolvedValue('---\ntitle: Home\n---\n\n# Hello')
    vi.mocked(window.api.getVariableOverrides).mockResolvedValue({})
    vi.mocked(window.api.setVariableOverrides).mockResolvedValue(undefined)
    vi.mocked(window.api.getPageVariableOverrides).mockResolvedValue({})
    vi.mocked(window.api.setPageVariableOverrides).mockResolvedValue(undefined)
    vi.mocked(window.api.watchProject).mockResolvedValue(undefined)
    vi.mocked(window.api.unwatchProject).mockResolvedValue(undefined)
    vi.mocked(window.api.onProjectTreeChanged).mockReturnValue(vi.fn())
    vi.mocked(window.api.startDevServer).mockResolvedValue(undefined)
    vi.mocked(window.api.stopDevServer).mockResolvedValue(undefined)
    vi.mocked(window.api.onDevServerStatusChanged).mockReturnValue(vi.fn())
    vi.mocked(window.api.onDevServerOutput).mockReturnValue(vi.fn())
    vi.mocked(window.api.onThemeManifestUpdated).mockReturnValue(vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads project variable overrides on mount', async () => {
    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(window.api.getVariableOverrides).toHaveBeenCalledWith('/project')
    })
  })

  it('shows variable editor panel when theme has variables', async () => {
    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('variable-editor-panel')).toBeInTheDocument()
    })
  })

  it('resolves variables showing project override badge', async () => {
    vi.mocked(window.api.getVariableOverrides).mockResolvedValue({ mainColor: '#ff0000' })

    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId('variable-editor-panel')).toBeInTheDocument()
    })

    await waitFor(() => {
      const colorInput = screen.getByLabelText('mainColor') as HTMLInputElement
      expect(colorInput.value).toBe('#ff0000')
    })
  })

  it('saves project variable overrides on change (debounced)', async () => {
    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText('fontSize')).toBeInTheDocument()
    })

    act(() => {
      fireEvent.change(screen.getByLabelText('fontSize'), { target: { value: '24' } })
    })

    expect(window.api.setVariableOverrides).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(window.api.setVariableOverrides).toHaveBeenCalledWith(
        '/project',
        expect.objectContaining({ fontSize: 24 })
      )
    })
  })

  it('loads page variable overrides when page is selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(window.api.getPageVariableOverrides).toHaveBeenCalledWith(
        '/project/src/pages/index.mdx'
      )
    })
  })

  it('shows page variable editor panel when a page is selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      const panels = screen.getAllByTestId('variable-editor-panel')
      expect(panels.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('saves page variable overrides on change (debounced)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithI18n(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      const panels = screen.getAllByTestId('variable-editor-panel')
      expect(panels.length).toBeGreaterThanOrEqual(2)
    })

    const fontSizeInputs = screen.getAllByLabelText('fontSize')
    const pageInput = fontSizeInputs[fontSizeInputs.length - 1]

    act(() => {
      fireEvent.change(pageInput, { target: { value: '20' } })
    })

    expect(window.api.setPageVariableOverrides).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(window.api.setPageVariableOverrides).toHaveBeenCalledWith(
        '/project/src/pages/index.mdx',
        expect.objectContaining({ fontSize: 20 })
      )
    })
  })
})
