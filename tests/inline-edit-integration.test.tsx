import { render, screen, act } from '@testing-library/react'
import { ProjectScreen } from '../src/renderer/src/components/ProjectScreen'
import type { TextNodeInfo, TextSelectionMessage } from '../src/shared/types'

const project = {
  name: 'test-project',
  path: '/tmp/test-project',
  themeName: 'my-theme'
}

const sampleMdx = `---
title: Test Page
---

# Page Title

Some intro text.
`

const sampleTextNodes: TextNodeInfo[] = [
  { index: 0, type: 'heading', depth: 1, content: '# Page Title', textContent: 'Page Title' },
  { index: 1, type: 'paragraph', content: 'Some intro text.', textContent: 'Some intro text.' }
]

function mockTextSelection(tagName: string, textContent: string): void {
  const msg: TextSelectionMessage = {
    type: 'astro-cms:text-selected',
    tagName,
    textContent,
    innerHTML: textContent,
    rect: { top: 100, left: 50, width: 400, height: 30 },
    computedStyles: {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      fontWeight: '400',
      fontStyle: 'normal',
      color: 'rgb(0,0,0)',
      lineHeight: '1.5',
      textAlign: 'left',
      letterSpacing: 'normal',
      textDecoration: 'none',
      padding: '0px',
      margin: '0px'
    }
  }
  window.dispatchEvent(new MessageEvent('message', { data: msg }))
}

async function renderWithProject(): Promise<void> {
  const scanMock = vi.fn().mockResolvedValue({
    pages: [
      { type: 'page', name: 'index.mdx', relativePath: 'src/pages/index.mdx', fullPath: '/tmp/test-project/src/pages/index.mdx' }
    ],
    collections: []
  })
  const readMock = vi.fn().mockResolvedValue(sampleMdx)
  const textNodesMock = vi.fn().mockResolvedValue(sampleTextNodes)
  const saveMock = vi.fn().mockResolvedValue(sampleMdx)

  Object.assign(window.api, {
    scanProject: scanMock,
    readPageContent: readMock,
    getTextNodes: textNodesMock,
    saveInlineEdit: saveMock,
    onDevServerStatusChanged: vi.fn().mockImplementation((cb) => {
      cb({ state: 'running', url: 'http://localhost:4321' })
      return vi.fn()
    })
  })

  await act(async () => {
    render(<ProjectScreen project={project} onBack={vi.fn()} />)
  })

  const page = await screen.findByText('index.mdx')
  await act(async () => {
    page.click()
  })
}

describe('Inline text editing (Mode B2)', () => {
  it('shows inline editor when a text element is selected via postMessage', async () => {
    await renderWithProject()

    await act(async () => {
      mockTextSelection('h1', 'Page Title')
    })

    expect(screen.getByTestId('inline-editor')).toBeInTheDocument()
  })

  it('hides inline editor on cancel (Escape)', async () => {
    await renderWithProject()

    await act(async () => {
      mockTextSelection('p', 'Some intro text.')
    })

    expect(screen.getByTestId('inline-editor')).toBeInTheDocument()

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(screen.queryByTestId('inline-editor')).not.toBeInTheDocument()
  })

  it('calls saveInlineEdit on blur with correct node index', async () => {
    await renderWithProject()

    const saveMock = vi.fn().mockResolvedValue(sampleMdx)
    Object.assign(window.api, {
      saveInlineEdit: saveMock,
      getTextNodes: vi.fn().mockResolvedValue(sampleTextNodes)
    })

    await act(async () => {
      mockTextSelection('p', 'Some intro text.')
    })

    const editor = screen.getByTestId('inline-editor')
    await act(async () => {
      editor.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(saveMock).toHaveBeenCalledWith(
      '/tmp/test-project/src/pages/index.mdx',
      1,
      expect.any(String)
    )
  })

  it('clears text selection when a block is selected', async () => {
    await renderWithProject()

    await act(async () => {
      mockTextSelection('h1', 'Page Title')
    })

    expect(screen.getByTestId('inline-editor')).toBeInTheDocument()

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'astro-cms:block-selected',
            blockId: 'TestBlock',
            blockName: 'TestBlock',
            blockPath: 'blocks/TestBlock.astro'
          }
        })
      )
    })

    expect(screen.queryByTestId('inline-editor')).not.toBeInTheDocument()
  })

  it('clears text selection when navigating to a different page', async () => {
    const scanMock = vi.fn().mockResolvedValue({
      pages: [
        { type: 'page', name: 'index.mdx', relativePath: 'src/pages/index.mdx', fullPath: '/tmp/test-project/src/pages/index.mdx' },
        { type: 'page', name: 'about.mdx', relativePath: 'src/pages/about.mdx', fullPath: '/tmp/test-project/src/pages/about.mdx' }
      ],
      collections: []
    })
    Object.assign(window.api, {
      scanProject: scanMock,
      readPageContent: vi.fn().mockResolvedValue(sampleMdx),
      getTextNodes: vi.fn().mockResolvedValue(sampleTextNodes),
      saveInlineEdit: vi.fn().mockResolvedValue(sampleMdx),
      onDevServerStatusChanged: vi.fn().mockImplementation((cb) => {
        cb({ state: 'running', url: 'http://localhost:4321' })
        return vi.fn()
      })
    })

    await act(async () => {
      render(<ProjectScreen project={project} onBack={vi.fn()} />)
    })

    const page = await screen.findByText('index.mdx')
    await act(async () => {
      page.click()
    })

    await act(async () => {
      mockTextSelection('h1', 'Page Title')
    })

    expect(screen.getByTestId('inline-editor')).toBeInTheDocument()

    const aboutPage = await screen.findByText('about.mdx')
    await act(async () => {
      aboutPage.click()
    })

    expect(screen.queryByTestId('inline-editor')).not.toBeInTheDocument()
  })
})
