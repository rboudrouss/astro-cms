import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'

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

describe('ProjectScreen with raw editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockTree)
    ;(window.api.watchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.unwatchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(window.api.onProjectTreeChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
    ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(
      '---\ntitle: Home\n---\n\n# Welcome\n'
    )
  })

  function renderWithI18n(ui: React.ReactElement) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
  }

  it('shows pages in the sidebar', async () => {
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
  })

  it('opens raw editor when a page is selected from sidebar', async () => {
    const user = userEvent.setup()
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(window.api.readPageContent).toHaveBeenCalledWith(
        '/projects/my-site/src/pages/index.mdx'
      )
    })

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  it('saves content via IPC on Ctrl+S in the editor', async () => {
    const user = userEvent.setup()
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Control>}s{/Control}')

    expect(window.api.writePageContent).toHaveBeenCalled()
  })
})
