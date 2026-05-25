import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { BlockManifest, ThemeManifest, BlockInstance } from '../src/shared/types'

const mockBlocks: BlockManifest[] = [
  {
    name: 'ImageText',
    label: 'Image + Text',
    filePath: 'blocks/ImageText.astro',
    props: [{ name: 'image', type: 'string', required: true }],
    cmsHints: {},
    slots: [],
    isCompositional: false
  },
  {
    name: 'ColorLigne',
    label: 'Color Line',
    filePath: 'blocks/ColorLigne.astro',
    props: [{ name: 'color', type: 'string', required: true }],
    cmsHints: {},
    slots: [],
    isCompositional: false
  }
]

const mockManifest: ThemeManifest = {
  name: 'test-theme',
  blocks: mockBlocks,
  layouts: [],
  variables: {}
}

const mockPageBlocks: BlockInstance[] = [
  { id: 'block-0', blockName: 'ImageText', props: { image: '/hero.png' } },
  { id: 'block-1', blockName: 'ColorLigne', props: { color: '#e865ad' } }
]

const project = { name: 'Test', path: '/test', themeName: 'test-theme' }

function setupMocks(): void {
  vi.mocked(window.api.getThemeManifest).mockResolvedValue(mockManifest)
  vi.mocked(window.api.scanProject).mockResolvedValue({ pages: [
    { type: 'page', name: 'index.mdx', relativePath: 'index.mdx', fullPath: '/test/src/pages/index.mdx' }
  ], collections: [] })
  vi.mocked(window.api.readPageContent).mockResolvedValue('---\ntitle: Test\n---\n\n<ImageText image="/hero.png" />\n\n<ColorLigne color="#e865ad" />\n')
  vi.mocked(window.api.getPageBlocks).mockResolvedValue(mockPageBlocks)
  vi.mocked(window.api.insertBlock).mockResolvedValue('')
  vi.mocked(window.api.deleteBlock).mockResolvedValue('')
  vi.mocked(window.api.reorderBlocks).mockResolvedValue('')
  vi.mocked(window.api.onDevServerStatusChanged).mockImplementation((cb) => {
    cb({ state: 'running', url: 'http://localhost:4321/' })
    return vi.fn()
  })
}

async function renderAndSelectPage() {
  setupMocks()
  render(<ProjectScreen project={project} onBack={vi.fn()} />)
  await waitFor(() => {
    expect(screen.getByText('index.mdx')).toBeInTheDocument()
  })
  await act(async () => {
    fireEvent.click(screen.getByText('index.mdx'))
  })
}

describe('Block palette', () => {
  it('displays available blocks from theme manifest', async () => {
    await renderAndSelectPage()
    await waitFor(() => {
      expect(screen.getByText('Image + Text')).toBeInTheDocument()
      expect(screen.getByText('Color Line')).toBeInTheDocument()
    })
  })
})

describe('Page block list', () => {
  it('displays current page blocks', async () => {
    await renderAndSelectPage()
    await waitFor(() => {
      expect(screen.getByTestId('page-block-0')).toBeInTheDocument()
      expect(screen.getByTestId('page-block-1')).toBeInTheDocument()
    })
  })
})

describe('Delete block', () => {
  it('calls deleteBlock IPC when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    await renderAndSelectPage()
    await waitFor(() => {
      expect(screen.getByTestId('page-block-0')).toBeInTheDocument()
    })
    const deleteBtn = screen.getAllByTestId('delete-block-btn')[0]
    await user.click(deleteBtn)
    const confirmBtn = screen.getByTestId('confirm-delete-btn')
    await user.click(confirmBtn)
    expect(window.api.deleteBlock).toHaveBeenCalledWith(
      '/test/src/pages/index.mdx',
      0
    )
  })
})

describe('Insert block', () => {
  it('calls insertBlock IPC when palette block insert button is clicked', async () => {
    const user = userEvent.setup()
    await renderAndSelectPage()
    await waitFor(() => {
      expect(screen.getByText('Image + Text')).toBeInTheDocument()
    })
    const insertBtns = screen.getAllByTestId('insert-palette-btn')
    await user.click(insertBtns[0])
    expect(window.api.insertBlock).toHaveBeenCalledWith(
      '/test/src/pages/index.mdx',
      'ImageText',
      {},
      expect.any(Number)
    )
  })
})

describe('Undo/Redo keyboard shortcuts', () => {
  it('calls writePageContent on Ctrl+Z after a delete', async () => {
    const originalContent = '---\ntitle: Test\n---\n\n<ImageText image="/hero.png" />\n\n<ColorLigne color="#e865ad" />\n'
    const afterDeleteContent = '---\ntitle: Test\n---\n\n<ColorLigne color="#e865ad" />\n'
    setupMocks()
    vi.mocked(window.api.readPageContent).mockResolvedValue(originalContent)
    vi.mocked(window.api.deleteBlock).mockResolvedValue(afterDeleteContent)
    vi.mocked(window.api.getPageBlocks)
      .mockResolvedValueOnce(mockPageBlocks)
      .mockResolvedValueOnce([mockPageBlocks[1]])
      .mockResolvedValueOnce(mockPageBlocks)

    render(<ProjectScreen project={project} onBack={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('index.mdx')).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.click(screen.getByText('index.mdx'))
    })
    await waitFor(() => {
      expect(screen.getByTestId('page-block-0')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    const deleteBtn = screen.getAllByTestId('delete-block-btn')[0]
    await user.click(deleteBtn)
    const confirmBtn = screen.getByTestId('confirm-delete-btn')
    await user.click(confirmBtn)
    await waitFor(() => {
      expect(window.api.deleteBlock).toHaveBeenCalled()
    })
    // Wait for all state updates from delete to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    vi.mocked(window.api.writePageContent).mockClear()
    await user.keyboard('{Control>}z{/Control}')
    await waitFor(() => {
      expect(window.api.writePageContent).toHaveBeenCalledWith(
        '/test/src/pages/index.mdx',
        originalContent
      )
    })
  })
})
