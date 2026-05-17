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

describe('ProjectScreen with raw editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(
      '---\ntitle: Home\n---\n\n# Welcome\n'
    )
  })

  function renderWithI18n(ui: React.ReactElement) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
  }

  it('shows an "open page" button', () => {
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    expect(screen.getByText(/ouvrir.*page|open.*page/i)).toBeInTheDocument()
  })

  it('opens raw editor when a page file path is provided', async () => {
    const user = userEvent.setup()
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    const openBtn = screen.getByText(/ouvrir.*page|open.*page/i)
    await user.click(openBtn)

    await waitFor(() => {
      expect(window.api.readPageContent).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  it('saves content via IPC on Ctrl+S in the editor', async () => {
    const user = userEvent.setup()
    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)

    const openBtn = screen.getByText(/ouvrir.*page|open.*page/i)
    await user.click(openBtn)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Control>}s{/Control}')

    expect(window.api.writePageContent).toHaveBeenCalled()
  })
})
