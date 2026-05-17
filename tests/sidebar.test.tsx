import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { Sidebar } from '@/components/Sidebar'
import { initI18n } from '@/i18n'
import type { ProjectTree, SidebarItem } from '../../src/shared/types'

const emptyTree: ProjectTree = { pages: [], collections: [] }

const sampleTree: ProjectTree = {
  pages: [
    { type: 'page', name: 'about', relativePath: 'about.mdx', fullPath: '/p/src/pages/about.mdx' },
    { type: 'page', name: 'index', relativePath: 'index.mdx', fullPath: '/p/src/pages/index.mdx' }
  ],
  collections: [
    {
      type: 'collection',
      name: 'blog',
      entries: [
        {
          type: 'entry',
          name: 'first-post',
          relativePath: 'first-post.mdx',
          fullPath: '/p/src/content/blog/first-post.mdx'
        },
        {
          type: 'entry',
          name: 'second-post',
          relativePath: 'second-post.md',
          fullPath: '/p/src/content/blog/second-post.md'
        }
      ]
    }
  ]
}

function renderSidebar(
  tree: ProjectTree = sampleTree,
  onSelect: (item: SidebarItem) => void = vi.fn()
) {
  const i18n = initI18n('fr')
  return render(
    <I18nextProvider i18n={i18n}>
      <Sidebar tree={tree} selectedPath={null} onSelect={onSelect} />
    </I18nextProvider>
  )
}

describe('Sidebar', () => {
  it('renders Pages section header', () => {
    renderSidebar()
    expect(screen.getByText('Pages')).toBeInTheDocument()
  })

  it('renders Collections section header', () => {
    renderSidebar()
    expect(screen.getByText('Collections')).toBeInTheDocument()
  })

  it('lists all pages', () => {
    renderSidebar()
    expect(screen.getByText('about')).toBeInTheDocument()
    expect(screen.getByText('index')).toBeInTheDocument()
  })

  it('lists collection names', () => {
    renderSidebar()
    expect(screen.getByText('blog')).toBeInTheDocument()
  })

  it('lists entries within a collection', () => {
    renderSidebar()
    expect(screen.getByText('first-post')).toBeInTheDocument()
    expect(screen.getByText('second-post')).toBeInTheDocument()
  })

  it('calls onSelect with the page node when a page is clicked', async () => {
    const onSelect = vi.fn()
    renderSidebar(sampleTree, onSelect)

    await userEvent.click(screen.getByText('about'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(sampleTree.pages[0])
  })

  it('calls onSelect with the entry node when an entry is clicked', async () => {
    const onSelect = vi.fn()
    renderSidebar(sampleTree, onSelect)

    await userEvent.click(screen.getByText('first-post'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(sampleTree.collections[0].entries[0])
  })

  it('highlights the selected item', () => {
    const i18n = initI18n('fr')
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar
          tree={sampleTree}
          selectedPath="/p/src/pages/about.mdx"
          onSelect={vi.fn()}
        />
      </I18nextProvider>
    )

    const aboutButton = screen.getByText('about').closest('button')!
    expect(aboutButton.className).toMatch(/bg-accent/)
  })

  it('shows empty state when no pages or collections', () => {
    renderSidebar(emptyTree)
    expect(screen.getByText('Aucune page ou collection trouvée')).toBeInTheDocument()
  })

  it('renders in English when i18n is set to en', () => {
    const i18n = initI18n('en')
    render(
      <I18nextProvider i18n={i18n}>
        <Sidebar tree={sampleTree} selectedPath={null} onSelect={vi.fn()} />
      </I18nextProvider>
    )
    expect(screen.getByText('Pages')).toBeInTheDocument()
    expect(screen.getByText('Collections')).toBeInTheDocument()
  })
})
