import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { ThemeSidebar } from '@/components/ThemeSidebar'
import { initI18n } from '@/i18n'
import type { ThemeManifest } from '../src/shared/types'

const mockManifest: ThemeManifest = {
  name: 'test-theme',
  blocks: [
    {
      name: 'ImageText',
      label: 'ImageText',
      filePath: '/test/blocks/ImageText.astro',
      props: [{ name: 'image', type: 'string', required: true }],
      cmsHints: { image: { format: 'image' } },
      slots: [],
      isCompositional: false
    },
    {
      name: 'Section',
      label: 'Section',
      filePath: '/test/blocks/Section.astro',
      props: [{ name: 'title', type: 'string', required: true }],
      cmsHints: {},
      slots: [{ name: 'default' }],
      isCompositional: true
    }
  ],
  layouts: [
    {
      name: 'Default',
      label: 'Default',
      filePath: '/test/layouts/Default.astro',
      props: [{ name: 'title', type: 'string', required: true }],
      cmsHints: {},
      slots: [{ name: 'default' }]
    }
  ],
  variables: {}
}

function renderSidebar() {
  const i18n = initI18n('fr')
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeSidebar projectPath="/test/project" />
    </I18nextProvider>
  )
}

describe('ThemeSidebar', () => {
  beforeEach(() => {
    vi.mocked(window.api.getThemeManifest).mockResolvedValue(mockManifest)
    vi.mocked(window.api.onThemeManifestUpdated).mockReturnValue(vi.fn())
  })

  it('renders blocks section with block names', async () => {
    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('Blocs')).toBeInTheDocument()
      expect(screen.getByText('ImageText')).toBeInTheDocument()
      expect(screen.getByText('Section')).toBeInTheDocument()
    })
  })

  it('renders layouts section with layout names', async () => {
    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('Layouts')).toBeInTheDocument()
      expect(screen.getByText('Default')).toBeInTheDocument()
    })
  })

  it('shows leaf/compositional labels', async () => {
    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('Feuille')).toBeInTheDocument()
      expect(screen.getByText('Compositionnel')).toBeInTheDocument()
    })
  })

  it('shows error when manifest fails to load', async () => {
    vi.mocked(window.api.getThemeManifest).mockResolvedValue(null)
    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('Impossible de charger le thème')).toBeInTheDocument()
    })
  })

  it('shows empty state when no blocks or layouts', async () => {
    vi.mocked(window.api.getThemeManifest).mockResolvedValue({
      name: 'empty',
      blocks: [],
      layouts: [],
      variables: {}
    })
    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('Aucun bloc disponible')).toBeInTheDocument()
      expect(screen.getByText('Aucun layout disponible')).toBeInTheDocument()
    })
  })

  it('updates when hot reload sends new manifest', async () => {
    let hotReloadCallback: ((m: ThemeManifest) => void) | null = null
    vi.mocked(window.api.onThemeManifestUpdated).mockImplementation((cb) => {
      hotReloadCallback = cb
      return vi.fn()
    })

    renderSidebar()
    await waitFor(() => {
      expect(screen.getByText('ImageText')).toBeInTheDocument()
    })

    const updatedManifest: ThemeManifest = {
      ...mockManifest,
      blocks: [
        ...mockManifest.blocks,
        {
          name: 'NewBlock',
          label: 'NewBlock',
          filePath: '/test/blocks/NewBlock.astro',
          props: [],
          cmsHints: {},
          slots: [],
          isCompositional: false
        }
      ]
    }

    act(() => {
      hotReloadCallback!(updatedManifest)
    })

    await waitFor(() => {
      expect(screen.getByText('NewBlock')).toBeInTheDocument()
    })
  })

  it('calls getThemeManifest with correct project path', async () => {
    renderSidebar()
    expect(window.api.getThemeManifest).toHaveBeenCalledWith('/test/project')
  })

  it('cleans up hot reload listener on unmount', async () => {
    const cleanup = vi.fn()
    vi.mocked(window.api.onThemeManifestUpdated).mockReturnValue(cleanup)
    const { unmount } = renderSidebar()
    unmount()
    expect(cleanup).toHaveBeenCalled()
  })
})
