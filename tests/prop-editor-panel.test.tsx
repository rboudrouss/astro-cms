import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropEditorPanel } from '../src/renderer/src/components/PropEditorPanel'
import type { PropSchema, CmsHints } from '../src/shared/types'

const imageTextSchema: PropSchema[] = [
  { name: 'image', type: 'string', required: true, description: 'Image principale' },
  { name: 'text', type: 'string', required: true, description: 'Texte affiché à côté de l\'image' },
  { name: 'reversed', type: 'boolean', required: false, description: 'Texte à droite au lieu de gauche' }
]

const imageTextHints: CmsHints = {
  image: { format: 'image' },
  text: { format: 'richtext' }
}

const colorLigneSchema: PropSchema[] = [
  { name: 'color', type: 'string', required: true },
  { name: 'height', type: 'number', required: false, default: 2 }
]

const colorLigneHints: CmsHints = {}

describe('PropEditorPanel', () => {
  describe('form generation from schema', () => {
    it('renders a text input for string props', () => {
      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText('image')).toBeInTheDocument()
      expect(screen.getByLabelText('text')).toBeInTheDocument()
    })

    it('renders a checkbox for boolean props', () => {
      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={vi.fn()}
        />
      )

      const checkbox = screen.getByLabelText('reversed')
      expect(checkbox).toBeChecked()
    })

    it('renders a number input for number props', () => {
      render(
        <PropEditorPanel
          blockName="ColorLigne"
          schema={colorLigneSchema}
          cmsHints={colorLigneHints}
          values={{ color: '#e865ad', height: 2 }}
          onChange={vi.fn()}
        />
      )

      const input = screen.getByLabelText('height')
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveValue(2)
    })

    it('shows the block name as a header', () => {
      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('ImageText')).toBeInTheDocument()
    })

    it('shows prop descriptions when present', () => {
      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('Image principale')).toBeInTheDocument()
      expect(screen.getByText('Texte à droite au lieu de gauche')).toBeInTheDocument()
    })
  })

  describe('format hints', () => {
    it('renders a color input for color format hint', () => {
      const schema: PropSchema[] = [
        { name: 'mainColor', type: 'string', required: true }
      ]
      const hints: CmsHints = { mainColor: { format: 'color' } }

      render(
        <PropEditorPanel
          blockName="Test"
          schema={schema}
          cmsHints={hints}
          values={{ mainColor: '#ff0000' }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText('mainColor')).toHaveAttribute('type', 'color')
    })

    it('renders a url input for url format hint', () => {
      const schema: PropSchema[] = [
        { name: 'link', type: 'string', required: true }
      ]
      const hints: CmsHints = { link: { format: 'url' } }

      render(
        <PropEditorPanel
          blockName="Test"
          schema={schema}
          cmsHints={hints}
          values={{ link: 'https://example.com' }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText('link')).toHaveAttribute('type', 'url')
    })

    it('renders a textarea for textarea format hint', () => {
      const schema: PropSchema[] = [
        { name: 'content', type: 'string', required: true }
      ]
      const hints: CmsHints = { content: { format: 'textarea' } }

      render(
        <PropEditorPanel
          blockName="Test"
          schema={schema}
          cmsHints={hints}
          values={{ content: 'Long text here' }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText('content').tagName).toBe('TEXTAREA')
    })

    it('renders a stub label for image format hint', () => {
      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={vi.fn()}
        />
      )

      const imageInput = screen.getByLabelText('image')
      expect(imageInput).toHaveAttribute('type', 'text')
    })

    it('renders a stub for richtext format hint as textarea', () => {
      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText('text').tagName).toBe('TEXTAREA')
    })
  })

  describe('onChange callbacks', () => {
    it('calls onChange when a text input value changes', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <PropEditorPanel
          blockName="ColorLigne"
          schema={colorLigneSchema}
          cmsHints={colorLigneHints}
          values={{ color: '#e865ad', height: 2 }}
          onChange={onChange}
        />
      )

      const colorInput = screen.getByLabelText('color')
      await user.clear(colorInput)
      await user.type(colorInput, '#ff0000')

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.color).toBe('#ff0000')
      })
    })

    it('calls onChange when a checkbox is toggled', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <PropEditorPanel
          blockName="ImageText"
          schema={imageTextSchema}
          cmsHints={imageTextHints}
          values={{ image: '/hero.png', text: 'Welcome', reversed: true }}
          onChange={onChange}
        />
      )

      const checkbox = screen.getByLabelText('reversed')
      await user.click(checkbox)

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.reversed).toBe(false)
      })
    })

    it('calls onChange with number value for number props', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <PropEditorPanel
          blockName="ColorLigne"
          schema={colorLigneSchema}
          cmsHints={colorLigneHints}
          values={{ color: '#e865ad', height: 2 }}
          onChange={onChange}
        />
      )

      const heightInput = screen.getByLabelText('height')
      await user.clear(heightInput)
      await user.type(heightInput, '5')

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall.height).toBe(5)
      })
    })
  })

  describe('optional props', () => {
    it('renders optional string props with empty string when value is undefined', () => {
      render(
        <PropEditorPanel
          blockName="ColorLigne"
          schema={colorLigneSchema}
          cmsHints={colorLigneHints}
          values={{ color: '#e865ad' }}
          onChange={vi.fn()}
        />
      )

      const heightInput = screen.getByLabelText('height')
      expect(heightInput).toHaveValue(null)
    })
  })
})
