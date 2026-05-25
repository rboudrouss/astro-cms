import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { ProjectInfo, ThemeManifest } from '../src/shared/types'

const project: ProjectInfo = {
  name: 'test-project',
  path: '/tmp/test-project',
  themeName: 'my-theme'
}

const themeManifest: ThemeManifest = {
  name: 'my-theme',
  blocks: [],
  layouts: [
    {
      name: 'Base',
      label: 'Base',
      filePath: '/tmp/test-project/src/themes/my-theme/layouts/Base.astro',
      props: [
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: false }
      ],
      cmsHints: {},
      slots: [{ name: 'default' }]
    }
  ],
  variables: {}
}

const pageContent = `---
title: Hello World
description: A great page about awesome things and more content here
layout: ../layouts/Base.astro
---

# Welcome
`

const frontmatter = {
  title: 'Hello World',
  description: 'A great page about awesome things and more content here',
  layout: '../layouts/Base.astro'
}

describe('SEO integration in ProjectScreen', () => {
  beforeEach(() => {
    vi.mocked(window.api.scanProject).mockResolvedValue({
      pages: [
        {
          type: 'page',
          name: 'index.mdx',
          relativePath: 'index.mdx',
          fullPath: '/tmp/test-project/src/pages/index.mdx'
        }
      ],
      collections: []
    })
    vi.mocked(window.api.getThemeManifest).mockResolvedValue(themeManifest)
    vi.mocked(window.api.readPageContent).mockResolvedValue(pageContent)
    vi.mocked(window.api.getPageFrontmatter).mockResolvedValue(frontmatter)
    vi.mocked(window.api.updatePageFrontmatter).mockResolvedValue(pageContent)
  })

  it('shows SEO panel when page with SEO fields is selected', async () => {
    const user = userEvent.setup()
    render(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByTestId('seo-panel')).toBeInTheDocument()
    })
  })

  it('populates SEO fields from page frontmatter', async () => {
    const user = userEvent.setup()
    render(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Hello World')
      expect(screen.getByLabelText(/description/i)).toHaveValue(frontmatter.description)
    })
  })

  it('does not show SEO panel when page has no SEO fields', async () => {
    vi.mocked(window.api.getPageFrontmatter).mockResolvedValue({
      layout: '../layouts/Base.astro'
    })

    const user = userEvent.setup()
    render(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('seo-panel')).not.toBeInTheDocument()
  })

  it('calls updatePageFrontmatter when SEO field is edited', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })

    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'New Title')

    act(() => {
      vi.advanceTimersByTime(600)
    })

    await waitFor(() => {
      expect(window.api.updatePageFrontmatter).toHaveBeenCalledWith(
        '/tmp/test-project/src/pages/index.mdx',
        expect.objectContaining({ title: 'New Title' })
      )
    })

    vi.useRealTimers()
  })

  it('shows social card preview with frontmatter data', async () => {
    const user = userEvent.setup()
    render(<ProjectScreen project={project} onBack={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('index.mdx'))

    await waitFor(() => {
      const preview = screen.getByTestId('social-card-preview')
      expect(preview).toHaveTextContent('Hello World')
      expect(preview).toHaveTextContent(frontmatter.description)
    })
  })
})
