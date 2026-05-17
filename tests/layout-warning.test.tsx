import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { LayoutWarningBanner } from '../src/renderer/src/components/LayoutWarningBanner'
import type { LayoutManifest } from '../src/shared/types'

const themeLayouts: LayoutManifest[] = [
  {
    name: 'Main',
    label: 'Main',
    filePath: '/project/src/themes/my-theme/layouts/Main.astro',
    props: [],
    cmsHints: {},
    slots: []
  },
  {
    name: 'Blog',
    label: 'Blog',
    filePath: '/project/src/themes/my-theme/layouts/Blog.astro',
    props: [],
    cmsHints: {},
    slots: []
  }
]

function initI18n(): typeof i18n {
  i18n.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          layoutWarning: {
            message: 'This page uses a layout outside the active theme. Editing is partial.',
            applyLayout: 'Apply a Theme Layout',
            layoutApplied: 'Layout applied'
          }
        }
      }
    }
  })
  return i18n
}

function renderBanner(
  props: Partial<React.ComponentProps<typeof LayoutWarningBanner>> = {}
): ReturnType<typeof render> {
  const defaultProps = {
    currentLayout: '../layouts/Custom.astro',
    themeLayouts,
    onApplyLayout: vi.fn()
  }
  return render(
    <I18nextProvider i18n={initI18n()}>
      <LayoutWarningBanner {...defaultProps} {...props} />
    </I18nextProvider>
  )
}

describe('LayoutWarningBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders warning message', () => {
    renderBanner()
    expect(screen.getByText(/uses a layout outside the active theme/)).toBeInTheDocument()
  })

  it('renders the apply layout button', () => {
    renderBanner()
    expect(screen.getByText('Apply a Theme Layout')).toBeInTheDocument()
  })

  it('shows dropdown with theme layouts when button is clicked', async () => {
    renderBanner()
    fireEvent.click(screen.getByText('Apply a Theme Layout'))
    await waitFor(() => {
      expect(screen.getByText('Main')).toBeInTheDocument()
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
  })

  it('calls onApplyLayout when a layout is selected', async () => {
    const onApplyLayout = vi.fn()
    renderBanner({ onApplyLayout })
    fireEvent.click(screen.getByText('Apply a Theme Layout'))
    await waitFor(() => {
      fireEvent.click(screen.getByText('Main'))
    })
    expect(onApplyLayout).toHaveBeenCalledWith('Main')
  })

  it('does not render when themeLayouts is empty', () => {
    const { container } = renderBanner({ themeLayouts: [] })
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('has accessible alert role', () => {
    renderBanner()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
