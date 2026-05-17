import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { Sidebar } from '@/components/Sidebar'
import { initI18n } from '@/i18n'
import type { ProjectTree, SidebarItem, LayoutManifest, ThemeManifest } from '../../src/shared/types'

const sampleTree: ProjectTree = {
  pages: [
    { type: 'page', name: 'about', relativePath: 'about.mdx', fullPath: '/p/src/pages/about.mdx' },
    { type: 'page', name: 'index', relativePath: 'index.mdx', fullPath: '/p/src/pages/index.mdx' }
  ],
  collections: []
}

const layouts: LayoutManifest[] = [
  {
    name: 'Default',
    label: 'Default',
    filePath: '/p/src/themes/my-theme/layouts/Default.astro',
    props: [],
    cmsHints: {},
    slots: [{ name: 'default' }]
  }
]

const themeManifest: ThemeManifest = {
  name: 'my-theme',
  blocks: [],
  layouts,
  variables: {}
}

function renderSidebar(
  onSelect: (item: SidebarItem) => void = vi.fn(),
  props: {
    tree?: ProjectTree
    projectPath?: string
    themeManifest?: ThemeManifest | null
    onPageCreated?: () => void
    onPageRenamed?: (oldPath: string, newPath: string) => void
    onPageDeleted?: (path: string) => void
  } = {}
) {
  const i18n = initI18n('en')
  const manifest = 'themeManifest' in props ? props.themeManifest : themeManifest
  return render(
    <I18nextProvider i18n={i18n}>
      <Sidebar
        tree={props.tree ?? sampleTree}
        selectedPath={null}
        onSelect={onSelect}
        projectPath={props.projectPath ?? '/p'}
        themeManifest={manifest}
        onPageCreated={props.onPageCreated ?? vi.fn()}
        onPageRenamed={props.onPageRenamed ?? vi.fn()}
        onPageDeleted={props.onPageDeleted ?? vi.fn()}
      />
    </I18nextProvider>
  )
}

function getPageItem(name: string): HTMLElement {
  return screen.getByText(name).closest('div[data-page-item]')!
}

function getActionButton(pageItem: HTMLElement, title: string): HTMLElement {
  return pageItem.querySelector(`button[title="${title}"]`)! as HTMLElement
}

describe('Sidebar page actions', () => {
  beforeEach(() => {
    vi.mocked(window.api.createPage).mockReset()
    vi.mocked(window.api.renamePage).mockReset()
    vi.mocked(window.api.deletePage).mockReset()
    vi.mocked(window.api.findInternalLinks).mockReset()
    vi.mocked(window.api.listPageDirectories).mockReset()

    vi.mocked(window.api.createPage).mockResolvedValue({ success: true, filePath: '' })
    vi.mocked(window.api.renamePage).mockResolvedValue('/p/src/pages/renamed.mdx')
    vi.mocked(window.api.deletePage).mockResolvedValue(undefined)
    vi.mocked(window.api.findInternalLinks).mockResolvedValue([])
    vi.mocked(window.api.listPageDirectories).mockResolvedValue(['', 'about'])
  })

  it('renders "New page" button when themeManifest has layouts', () => {
    renderSidebar()
    expect(screen.getByTitle('New page')).toBeInTheDocument()
  })

  it('does not render "New page" button when themeManifest is null', () => {
    renderSidebar(vi.fn(), { themeManifest: null })
    expect(screen.queryByTitle('New page')).not.toBeInTheDocument()
  })

  it('opens the creation dialog when "New page" is clicked', async () => {
    renderSidebar()

    await userEvent.click(screen.getByTitle('New page'))

    await waitFor(() => {
      expect(screen.getByText('New page')).toBeInTheDocument()
      expect(screen.getByLabelText('Page name (slug)')).toBeInTheDocument()
    })
  })

  it('shows rename and delete buttons on page item', () => {
    renderSidebar()

    const aboutItem = getPageItem('about')
    expect(getActionButton(aboutItem, 'Rename')).toBeInTheDocument()
    expect(getActionButton(aboutItem, 'Delete')).toBeInTheDocument()
  })

  it('opens rename dialog on rename button click', async () => {
    renderSidebar()

    const aboutItem = getPageItem('about')
    await userEvent.click(getActionButton(aboutItem, 'Rename'))

    expect(screen.getByText('Rename page')).toBeInTheDocument()
    expect(screen.getByLabelText('New name (slug)')).toBeInTheDocument()
  })

  it('calls renamePage on rename submit', async () => {
    const onPageRenamed = vi.fn()
    renderSidebar(vi.fn(), { onPageRenamed })

    const aboutItem = getPageItem('about')
    await userEvent.click(getActionButton(aboutItem, 'Rename'))

    const input = screen.getByLabelText('New name (slug)')
    await userEvent.clear(input)
    await userEvent.type(input, 'about-us')
    await userEvent.click(screen.getByText('Rename', { selector: 'button[type="submit"]' }))

    await waitFor(() => {
      expect(window.api.renamePage).toHaveBeenCalledWith(
        '/p/src/pages/about.mdx',
        'about-us'
      )
    })
  })

  it('opens delete confirmation on delete button click', async () => {
    renderSidebar()

    const aboutItem = getPageItem('about')
    await userEvent.click(getActionButton(aboutItem, 'Delete'))

    expect(screen.getByText('Delete page')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete "about"\?/)).toBeInTheDocument()
  })

  it('calls deletePage on delete confirm', async () => {
    const onPageDeleted = vi.fn()
    renderSidebar(vi.fn(), { onPageDeleted })

    const aboutItem = getPageItem('about')
    await userEvent.click(getActionButton(aboutItem, 'Delete'))

    const deleteButton = screen.getAllByText('Delete').find(
      (el) => el.closest('div.fixed') && el.tagName === 'BUTTON'
    )!
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.api.deletePage).toHaveBeenCalledWith('/p/src/pages/about.mdx')
    })
  })

  it('shows internal link warning on delete when links exist', async () => {
    vi.mocked(window.api.findInternalLinks).mockResolvedValue([
      { filePath: '/p/src/pages/index.mdx', line: 5, content: '[About](/about)' }
    ])

    renderSidebar()

    const aboutItem = getPageItem('about')
    await userEvent.click(getActionButton(aboutItem, 'Delete'))

    await waitFor(() => {
      expect(screen.getByText(/1 other page\(s\) link to this page/)).toBeInTheDocument()
    })
  })

  it('closes delete dialog on cancel', async () => {
    renderSidebar()

    const aboutItem = getPageItem('about')
    await userEvent.click(getActionButton(aboutItem, 'Delete'))

    expect(screen.getByText('Delete page')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Delete page')).not.toBeInTheDocument()
  })
})
