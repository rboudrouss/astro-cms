import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropEditorPanel } from '../src/renderer/src/components/PropEditorPanel'
import type { PropSchema, CmsHints, AssetInfo } from '../src/shared/types'

const imageSchema: PropSchema[] = [
  { name: 'image', type: 'string', required: true, description: 'Image principale' }
]

const imageHints: CmsHints = {
  image: { format: 'image' }
}

const mockAssets: AssetInfo[] = [
  { name: 'hero.png', relativePath: 'hero.png', fullPath: '/project/src/assets/uploads/hero.png', size: 1024 },
  { name: 'photo.jpg', relativePath: 'photo.jpg', fullPath: '/project/src/assets/uploads/photo.jpg', size: 2048 },
  { name: 'banner.webp', relativePath: 'banner.webp', fullPath: '/project/src/assets/uploads/banner.webp', size: 512 }
]

describe('Image prop field', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an image picker for format: image hint instead of text input', () => {
    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '/hero.png' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    expect(screen.getByTestId('image-prop-field')).toBeInTheDocument()
    expect(screen.queryBySelector?.('input[type="text"]')).toBeFalsy()
  })

  it('displays current image path value', () => {
    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '/hero.png' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    expect(screen.getByText('/hero.png')).toBeInTheDocument()
  })

  it('shows Browse library button', () => {
    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    expect(screen.getByRole('button', { name: /library|bibliothèque/i })).toBeInTheDocument()
  })

  it('shows Upload button', () => {
    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  })

  it('opens library modal when Browse library is clicked', async () => {
    const user = userEvent.setup()

    ;(window.api.scanAssets as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssets)

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /library|bibliothèque/i }))

    await waitFor(() => {
      expect(screen.getByTestId('image-library-modal')).toBeInTheDocument()
    })
  })

  it('displays scanned assets in the library modal', async () => {
    const user = userEvent.setup()

    ;(window.api.scanAssets as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssets)

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /library|bibliothèque/i }))

    await waitFor(() => {
      expect(screen.getByText('hero.png')).toBeInTheDocument()
      expect(screen.getByText('photo.jpg')).toBeInTheDocument()
      expect(screen.getByText('banner.webp')).toBeInTheDocument()
    })
  })

  it('calls onChange with selected asset path when an image is picked from library', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    ;(window.api.scanAssets as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssets)

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={onChange}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /library|bibliothèque/i }))

    await waitFor(() => {
      expect(screen.getByText('hero.png')).toBeInTheDocument()
    })

    await user.click(screen.getByText('hero.png'))

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ image: 'hero.png' })
      )
    })
  })

  it('calls selectImageFile and uploadAsset when Upload is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    ;(window.api.selectImageFile as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/new-image.png')
    ;(window.api.uploadAsset as ReturnType<typeof vi.fn>).mockResolvedValue('new-image.png')

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={onChange}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(window.api.selectImageFile).toHaveBeenCalled()
      expect(window.api.uploadAsset).toHaveBeenCalledWith(
        '/tmp/new-image.png',
        expect.stringContaining('uploads')
      )
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ image: 'new-image.png' })
      )
    })
  })

  it('does not call uploadAsset if selectImageFile is cancelled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    ;(window.api.selectImageFile as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={onChange}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(window.api.selectImageFile).toHaveBeenCalled()
    })
    expect(window.api.uploadAsset).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('filters library images by search query', async () => {
    const user = userEvent.setup()

    ;(window.api.scanAssets as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssets)

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /library|bibliothèque/i }))

    await waitFor(() => {
      expect(screen.getByText('hero.png')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search|rechercher/i)
    await user.type(searchInput, 'hero')

    expect(screen.getByText('hero.png')).toBeInTheDocument()
    expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument()
    expect(screen.queryByText('banner.webp')).not.toBeInTheDocument()
  })

  it('closes library modal when an image is selected', async () => {
    const user = userEvent.setup()

    ;(window.api.scanAssets as ReturnType<typeof vi.fn>).mockResolvedValue(mockAssets)

    render(
      <PropEditorPanel
        blockName="ImageText"
        schema={imageSchema}
        cmsHints={imageHints}
        values={{ image: '' }}
        onChange={vi.fn()}
        projectPath="/project"
      />
    )

    await user.click(screen.getByRole('button', { name: /library|bibliothèque/i }))

    await waitFor(() => {
      expect(screen.getByTestId('image-library-modal')).toBeInTheDocument()
    })

    await user.click(screen.getByText('hero.png'))

    await waitFor(() => {
      expect(screen.queryByTestId('image-library-modal')).not.toBeInTheDocument()
    })
  })
})
