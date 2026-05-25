import { extractTextNodes, updateTextContent } from '../src/main/mdx-content-updater'

const simpleMdx = `---
title: Test Page
layout: ../layouts/Main.astro
---

# Page Title

Some intro text.

<ImageText image="/hero.png" text="Welcome" />

More text between blocks.

<ColorLigne color="#e865ad" />

Final paragraph.
`

const headingsMdx = `---
title: Headings
---

# Heading One

## Heading Two

### Heading Three

Some body text.
`

const blockquoteMdx = `---
title: Quotes
---

# Title

> This is a blockquote.

A normal paragraph.
`

const formattedMdx = `---
title: Formatted
---

This has **bold** and *italic* text.

A [link](https://example.com) here.
`

const noFrontmatterMdx = `# No Frontmatter

Just a paragraph.
`

describe('extractTextNodes', () => {
  it('extracts headings and paragraphs from MDX with blocks', async () => {
    const nodes = await extractTextNodes(simpleMdx)
    expect(nodes).toHaveLength(4)

    expect(nodes[0].type).toBe('heading')
    expect(nodes[0].depth).toBe(1)
    expect(nodes[0].textContent).toBe('Page Title')

    expect(nodes[1].type).toBe('paragraph')
    expect(nodes[1].textContent).toBe('Some intro text.')

    expect(nodes[2].type).toBe('paragraph')
    expect(nodes[2].textContent).toBe('More text between blocks.')

    expect(nodes[3].type).toBe('paragraph')
    expect(nodes[3].textContent).toBe('Final paragraph.')
  })

  it('extracts multiple heading levels', async () => {
    const nodes = await extractTextNodes(headingsMdx)
    expect(nodes).toHaveLength(4)

    expect(nodes[0]).toMatchObject({ type: 'heading', depth: 1, textContent: 'Heading One' })
    expect(nodes[1]).toMatchObject({ type: 'heading', depth: 2, textContent: 'Heading Two' })
    expect(nodes[2]).toMatchObject({ type: 'heading', depth: 3, textContent: 'Heading Three' })
    expect(nodes[3]).toMatchObject({ type: 'paragraph', textContent: 'Some body text.' })
  })

  it('extracts blockquotes', async () => {
    const nodes = await extractTextNodes(blockquoteMdx)
    expect(nodes).toHaveLength(3)

    expect(nodes[0]).toMatchObject({ type: 'heading', depth: 1, textContent: 'Title' })
    expect(nodes[1]).toMatchObject({ type: 'blockquote', textContent: 'This is a blockquote.' })
    expect(nodes[2]).toMatchObject({ type: 'paragraph', textContent: 'A normal paragraph.' })
  })

  it('preserves inline formatting in content field', async () => {
    const nodes = await extractTextNodes(formattedMdx)
    expect(nodes).toHaveLength(2)

    expect(nodes[0].content).toContain('**bold**')
    expect(nodes[0].content).toContain('*italic*')
    expect(nodes[1].content).toContain('[link](https://example.com)')
  })

  it('handles MDX without frontmatter', async () => {
    const nodes = await extractTextNodes(noFrontmatterMdx)
    expect(nodes).toHaveLength(2)

    expect(nodes[0]).toMatchObject({ type: 'heading', depth: 1, textContent: 'No Frontmatter' })
    expect(nodes[1]).toMatchObject({ type: 'paragraph', textContent: 'Just a paragraph.' })
  })

  it('assigns sequential indices', async () => {
    const nodes = await extractTextNodes(simpleMdx)
    for (let i = 0; i < nodes.length; i++) {
      expect(nodes[i].index).toBe(i)
    }
  })

  it('returns empty array for MDX with only blocks', async () => {
    const mdx = `---
title: Blocks Only
---

<ImageText image="/hero.png" text="Welcome" />

<ColorLigne color="#e865ad" />
`
    const nodes = await extractTextNodes(mdx)
    expect(nodes).toHaveLength(0)
  })
})

describe('updateTextContent', () => {
  it('updates a heading text', async () => {
    const result = await updateTextContent(simpleMdx, 0, '# New Title')
    expect(result).toContain('# New Title')
    expect(result).not.toContain('# Page Title')
    expect(result).toContain('Some intro text.')
  })

  it('updates a paragraph text', async () => {
    const result = await updateTextContent(simpleMdx, 1, 'Updated intro.')
    expect(result).toContain('Updated intro.')
    expect(result).not.toContain('Some intro text.')
    expect(result).toContain('# Page Title')
  })

  it('preserves frontmatter when updating', async () => {
    const result = await updateTextContent(simpleMdx, 0, '# Changed')
    expect(result).toContain('title: Test Page')
    expect(result).toContain('layout: ../layouts/Main.astro')
  })

  it('preserves JSX blocks when updating text', async () => {
    const result = await updateTextContent(simpleMdx, 1, 'Changed paragraph.')
    expect(result).toContain('<ImageText')
    expect(result).toContain('<ColorLigne')
  })

  it('updates blockquote content', async () => {
    const result = await updateTextContent(blockquoteMdx, 1, '> Updated quote.')
    expect(result).toContain('> Updated quote.')
    expect(result).not.toContain('> This is a blockquote.')
  })

  it('returns source unchanged for out-of-range index', async () => {
    const result = await updateTextContent(simpleMdx, 99, 'impossible')
    expect(result).toBe(simpleMdx)
  })

  it('round-trips text content without corruption', async () => {
    const nodes = await extractTextNodes(simpleMdx)
    const result = await updateTextContent(simpleMdx, 0, nodes[0].content)
    const nodesAfter = await extractTextNodes(result)
    expect(nodesAfter[0].textContent).toBe(nodes[0].textContent)
    expect(nodesAfter[0].type).toBe(nodes[0].type)
  })

  it('handles MDX without frontmatter', async () => {
    const result = await updateTextContent(noFrontmatterMdx, 0, '# Updated')
    expect(result).toContain('# Updated')
    expect(result).toContain('Just a paragraph.')
  })

  it('updates formatted text preserving surrounding content', async () => {
    const result = await updateTextContent(
      formattedMdx,
      0,
      'This has **strong** and *emphasis* text.'
    )
    expect(result).toContain('**strong**')
    expect(result).toContain('*emphasis*')
    expect(result).toContain('[link](https://example.com)')
  })
})
