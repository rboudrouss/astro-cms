import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeoPanel } from '../src/renderer/src/components/SeoPanel'
import type { SeoFieldMapping, SeoValues } from '../src/shared/seo-fields'

describe('SeoPanel', () => {
  const fullMapping: SeoFieldMapping = {
    title: 'title',
    description: 'description',
    ogImage: 'ogImage'
  }

  const fullValues: SeoValues = {
    title: 'My Page Title',
    description: 'This is a description of my page that tells search engines what it is about.',
    ogImage: '/images/og.png'
  }

  describe('rendering', () => {
    it('renders the SEO panel with header', () => {
      render(
        <SeoPanel mapping={fullMapping} values={fullValues} onChange={vi.fn()} />
      )
      expect(screen.getByTestId('seo-panel')).toBeInTheDocument()
      expect(screen.getByText('SEO')).toBeInTheDocument()
    })

    it('renders title input when title field is mapped', () => {
      render(
        <SeoPanel mapping={{ title: 'title' }} values={{ title: 'Hello' }} onChange={vi.fn()} />
      )
      const input = screen.getByLabelText(/title/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Hello')
    })

    it('renders description textarea when description field is mapped', () => {
      render(
        <SeoPanel
          mapping={{ description: 'description' }}
          values={{ description: 'A description' }}
          onChange={vi.fn()}
        />
      )
      const textarea = screen.getByLabelText(/description/i)
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveValue('A description')
    })

    it('renders og image input when ogImage field is mapped', () => {
      render(
        <SeoPanel
          mapping={{ ogImage: 'ogImage' }}
          values={{ ogImage: '/img.png' }}
          onChange={vi.fn()}
        />
      )
      const input = screen.getByLabelText(/image/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('/img.png')
    })

    it('does not render unmapped fields', () => {
      render(
        <SeoPanel mapping={{ title: 'title' }} values={{ title: 'T' }} onChange={vi.fn()} />
      )
      expect(screen.queryByLabelText(/description/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/image/i)).not.toBeInTheDocument()
    })
  })

  describe('character counters', () => {
    it('shows character count for title', () => {
      render(
        <SeoPanel
          mapping={{ title: 'title' }}
          values={{ title: 'Hello World' }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('11/70')).toBeInTheDocument()
    })

    it('shows character count for description', () => {
      const desc = 'A'.repeat(100)
      render(
        <SeoPanel
          mapping={{ description: 'description' }}
          values={{ description: desc }}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('100/160')).toBeInTheDocument()
    })

    it('shows warning style when title exceeds max', () => {
      const longTitle = 'A'.repeat(71)
      render(
        <SeoPanel
          mapping={{ title: 'title' }}
          values={{ title: longTitle }}
          onChange={vi.fn()}
        />
      )
      const counter = screen.getByText('71/70')
      expect(counter).toHaveClass('text-orange-600')
    })

    it('shows warning style when description exceeds max', () => {
      const longDesc = 'A'.repeat(161)
      render(
        <SeoPanel
          mapping={{ description: 'description' }}
          values={{ description: longDesc }}
          onChange={vi.fn()}
        />
      )
      const counter = screen.getByText('161/160')
      expect(counter).toHaveClass('text-orange-600')
    })
  })

  describe('social card preview', () => {
    it('renders a social card preview section', () => {
      render(
        <SeoPanel mapping={fullMapping} values={fullValues} onChange={vi.fn()} />
      )
      expect(screen.getByTestId('social-card-preview')).toBeInTheDocument()
    })

    it('shows title in the preview card', () => {
      render(
        <SeoPanel mapping={fullMapping} values={fullValues} onChange={vi.fn()} />
      )
      const preview = screen.getByTestId('social-card-preview')
      expect(preview).toHaveTextContent('My Page Title')
    })

    it('shows description in the preview card', () => {
      render(
        <SeoPanel mapping={fullMapping} values={fullValues} onChange={vi.fn()} />
      )
      const preview = screen.getByTestId('social-card-preview')
      expect(preview).toHaveTextContent(fullValues.description!)
    })

    it('shows og image in the preview card', () => {
      render(
        <SeoPanel mapping={fullMapping} values={fullValues} onChange={vi.fn()} />
      )
      const img = screen.getByTestId('social-card-preview').querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', '/images/og.png')
    })

    it('shows placeholder when no og image', () => {
      render(
        <SeoPanel
          mapping={{ title: 'title', description: 'description' }}
          values={{ title: 'T', description: 'D' }}
          onChange={vi.fn()}
        />
      )
      const preview = screen.getByTestId('social-card-preview')
      expect(preview.querySelector('img')).not.toBeInTheDocument()
    })
  })

  describe('onChange callbacks', () => {
    it('calls onChange when title changes', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SeoPanel
          mapping={{ title: 'title' }}
          values={{ title: 'Old' }}
          onChange={onChange}
        />
      )

      const input = screen.getByLabelText(/title/i)
      await user.clear(input)
      await user.type(input, 'New')

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.title).toBe('New')
      })
    })

    it('calls onChange when description changes', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SeoPanel
          mapping={{ description: 'description' }}
          values={{ description: 'Old' }}
          onChange={onChange}
        />
      )

      const textarea = screen.getByLabelText(/description/i)
      await user.clear(textarea)
      await user.type(textarea, 'New desc')

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.description).toBe('New desc')
      })
    })

    it('calls onChange when og image changes', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SeoPanel
          mapping={{ ogImage: 'ogImage' }}
          values={{ ogImage: '/old.png' }}
          onChange={onChange}
        />
      )

      const input = screen.getByLabelText(/image/i)
      await user.clear(input)
      await user.type(input, '/new.png')

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.ogImage).toBe('/new.png')
      })
    })
  })
})
