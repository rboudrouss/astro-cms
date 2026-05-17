import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { initI18n } from '../src/renderer/src/i18n'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { DevServerStatus, ThemeManifest } from '../src/shared/types'

const i18nInstance = initI18n('en')

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

const mockManifest: ThemeManifest = {
  name: 'my-theme',
  blocks: [
    {
      name: 'ImageText',
      label: 'ImageText',
      filePath: '/themes/my-theme/blocks/ImageText.astro',
      props: [],
      cmsHints: {},
      slots: [],
      isCompositional: false
    }
  ],
  layouts: [
    {
      name: 'Main',
      label: 'Main',
      filePath: '/themes/my-theme/layouts/Main.astro',
      props: [],
      cmsHints: {},
      slots: []
    },
    {
      name: 'Blog',
      label: 'Blog',
      filePath: '/themes/my-theme/layouts/Blog.astro',
      props: [],
      cmsHints: {},
      slots: []
    }
  ],
  variables: {}
}

const MDX_WITH_THEME_LAYOUT = `---
title: Home
layout: ../../themes/my-theme/layouts/Main.astro
---

# Welcome
`

const MDX_WITH_CUSTOM_LAYOUT = `---
title: Home
layout: ../layouts/Custom.astro
---

# Welcome
`

const MDX_WITHOUT_LAYOUT = `---
title: Home
---

# Welcome
`

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18nInstance}>{ui}</I18nextProvider>)
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

function setupMocks(pageContent: string = MDX_WITH_CUSTOM_LAYOUT): void {
  vi.clearAllMocks()
  ;(window.api.scanProject as ReturnType<typeof vi.fn>).mockResolvedValue(mockTree)
  ;(window.api.watchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  ;(window.api.unwatchProject as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  ;(window.api.onProjectTreeChanged as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
  ;(window.api.startDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  ;(window.api.stopDevServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  ;(window.api.onDevServerOutput as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
  ;(window.api.onThemeManifestUpdated as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn())
  ;(window.api.getThemeManifest as ReturnType<typeof vi.fn>).mockResolvedValue(mockManifest)
  ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(pageContent)
  ;(window.api.getBlockProps as ReturnType<typeof vi.fn>).mockResolvedValue(null)
}

async function selectPage(
  pageName: string,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  await waitFor(() => {
    expect(screen.getByText(pageName)).toBeInTheDocument()
  })
  await user.click(screen.getByText(pageName))
}

describe('Layout warning integration', () => {
  it('shows warning banner when page uses a custom layout outside theme', async () => {
    setupMocks(MDX_WITH_CUSTOM_LAYOUT)
    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await selectPage('index.mdx', user)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('does not show warning when page uses a theme layout', async () => {
    setupMocks(MDX_WITH_THEME_LAYOUT)
    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await selectPage('index.mdx', user)

    await waitFor(() => {
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not show warning when page has no layout', async () => {
    setupMocks(MDX_WITHOUT_LAYOUT)
    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await selectPage('index.mdx', user)

    await waitFor(() => {
      expect(screen.getByTestId('preview-iframe')).toBeInTheDocument()
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows dropdown with theme layouts when apply button is clicked', async () => {
    setupMocks(MDX_WITH_CUSTOM_LAYOUT)
    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await selectPage('index.mdx', user)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Apply a Theme Layout|Appliquer un Layout/))

    await waitFor(() => {
      expect(screen.getByText('Main')).toBeInTheDocument()
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
  })

  it('calls applyThemeLayout and updates content when layout is selected', async () => {
    setupMocks(MDX_WITH_CUSTOM_LAYOUT)
    const updatedContent = MDX_WITH_THEME_LAYOUT
    ;(window.api.applyThemeLayout as ReturnType<typeof vi.fn>).mockResolvedValue(updatedContent)

    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await selectPage('index.mdx', user)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Apply a Theme Layout|Appliquer un Layout/))

    await waitFor(() => {
      expect(screen.getByText('Main')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Main'))

    await waitFor(() => {
      expect(window.api.applyThemeLayout).toHaveBeenCalledWith(
        '/projects/my-site/src/pages/index.mdx',
        'Main'
      )
    })
  })

  it('clears warning when switching to a page with theme layout', async () => {
    setupMocks(MDX_WITH_CUSTOM_LAYOUT)
    const user = userEvent.setup()
    const { setStatus } = setupRunningDevServer()

    renderWithI18n(<ProjectScreen project={mockProject} onBack={vi.fn()} />)
    setStatus({ state: 'running', url: 'http://localhost:4321/', port: 4321 })

    await selectPage('index.mdx', user)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    ;(window.api.readPageContent as ReturnType<typeof vi.fn>).mockResolvedValue(
      MDX_WITH_THEME_LAYOUT
    )

    await user.click(screen.getByText('about.mdx'))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
