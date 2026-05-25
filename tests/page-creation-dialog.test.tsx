import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { PageCreationDialog } from '@/components/PageCreationDialog'
import { initI18n } from '@/i18n'
import type { LayoutManifest } from '../../src/shared/types'

const layouts: LayoutManifest[] = [
  {
    name: 'Default',
    label: 'Default',
    filePath: '/p/src/themes/my-theme/layouts/Default.astro',
    props: [],
    cmsHints: {},
    slots: [{ name: 'default' }]
  },
  {
    name: 'Blog',
    label: 'Blog',
    filePath: '/p/src/themes/my-theme/layouts/Blog.astro',
    props: [],
    cmsHints: {},
    slots: [{ name: 'default' }]
  }
]

const directories = ['', 'about', 'about/team']

function renderDialog(
  onCreated: () => void = vi.fn(),
  onClose: () => void = vi.fn()
) {
  const i18n = initI18n('en')
  return render(
    <I18nextProvider i18n={i18n}>
      <PageCreationDialog
        projectPath="/p"
        layouts={layouts}
        directories={directories}
        onCreated={onCreated}
        onClose={onClose}
      />
    </I18nextProvider>
  )
}

describe('PageCreationDialog', () => {
  beforeEach(() => {
    vi.mocked(window.api.createPage).mockReset()
    vi.mocked(window.api.createPage).mockResolvedValue({
      success: true,
      filePath: '/p/src/pages/test.mdx'
    })
  })

  it('renders the dialog title', () => {
    renderDialog()
    expect(screen.getByText('New page')).toBeInTheDocument()
  })

  it('renders slug input', () => {
    renderDialog()
    expect(screen.getByLabelText('Page name (slug)')).toBeInTheDocument()
  })

  it('renders directory selector', () => {
    renderDialog()
    expect(screen.getByLabelText('Directory')).toBeInTheDocument()
  })

  it('renders layout selector with all layouts', () => {
    renderDialog()
    const select = screen.getByLabelText('Layout')
    expect(select).toBeInTheDocument()
    expect(select.querySelectorAll('option')).toHaveLength(2)
  })

  it('renders create and cancel buttons', () => {
    renderDialog()
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    renderDialog(vi.fn(), onClose)

    await userEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls createPage with correct options on submit', async () => {
    const onCreated = vi.fn()
    renderDialog(onCreated)

    await userEvent.type(screen.getByLabelText('Page name (slug)'), 'my-new-page')
    await userEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(window.api.createPage).toHaveBeenCalledWith({
        projectPath: '/p',
        directory: '',
        slug: 'my-new-page',
        layoutPath: layouts[0].filePath
      })
    })
  })

  it('calls onCreated after successful creation', async () => {
    const onCreated = vi.fn()
    renderDialog(onCreated)

    await userEvent.type(screen.getByLabelText('Page name (slug)'), 'success-page')
    await userEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled()
    })
  })

  it('shows validation error for empty slug', async () => {
    renderDialog()

    await userEvent.click(screen.getByText('Create'))

    expect(screen.getByText('Page name is required')).toBeInTheDocument()
    expect(window.api.createPage).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid slug characters', async () => {
    renderDialog()

    await userEvent.type(screen.getByLabelText('Page name (slug)'), 'Bad Name!')
    await userEvent.click(screen.getByText('Create'))

    expect(
      screen.getByText('Only lowercase letters, numbers, and hyphens allowed')
    ).toBeInTheDocument()
  })

  it('shows server error when creation fails', async () => {
    vi.mocked(window.api.createPage).mockResolvedValue({
      success: false,
      error: 'File already exists: test.mdx'
    })
    renderDialog()

    await userEvent.type(screen.getByLabelText('Page name (slug)'), 'test')
    await userEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByText('File already exists: test.mdx')).toBeInTheDocument()
    })
  })

  it('allows selecting a different directory', async () => {
    renderDialog()

    await userEvent.selectOptions(screen.getByLabelText('Directory'), 'about')
    await userEvent.type(screen.getByLabelText('Page name (slug)'), 'sub-page')
    await userEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(window.api.createPage).toHaveBeenCalledWith(
        expect.objectContaining({ directory: 'about' })
      )
    })
  })

  it('allows selecting a different layout', async () => {
    renderDialog()

    await userEvent.selectOptions(screen.getByLabelText('Layout'), 'Blog')
    await userEvent.type(screen.getByLabelText('Page name (slug)'), 'blog-page')
    await userEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(window.api.createPage).toHaveBeenCalledWith(
        expect.objectContaining({ layoutPath: layouts[1].filePath })
      )
    })
  })
})
