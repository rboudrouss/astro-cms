import { markdownToHtml, htmlToMarkdown } from '../src/main/tiptap-serializer'
import { extractTextNodes, updateTextContent } from '../src/main/mdx-content-updater'

describe('markdownToHtml', () => {
  it('converts a heading to HTML', async () => {
    const html = await markdownToHtml('# Hello World')
    expect(html).toContain('<h1>Hello World</h1>')
  })

  it('converts multiple heading levels', async () => {
    expect(await markdownToHtml('## Level Two')).toContain('<h2>Level Two</h2>')
    expect(await markdownToHtml('### Level Three')).toContain('<h3>Level Three</h3>')
    expect(await markdownToHtml('#### Level Four')).toContain('<h4>Level Four</h4>')
  })

  it('converts a paragraph', async () => {
    const html = await markdownToHtml('A simple paragraph.')
    expect(html).toContain('<p>A simple paragraph.</p>')
  })

  it('converts bold text', async () => {
    const html = await markdownToHtml('This is **bold** text.')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('converts italic text', async () => {
    const html = await markdownToHtml('This is *italic* text.')
    expect(html).toContain('<em>italic</em>')
  })

  it('converts links', async () => {
    const html = await markdownToHtml('A [link](https://example.com) here.')
    expect(html).toContain('<a href="https://example.com">link</a>')
  })

  it('converts blockquotes', async () => {
    const html = await markdownToHtml('> A quoted line.')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('A quoted line.')
  })

  it('converts inline code', async () => {
    const html = await markdownToHtml('Use `code` here.')
    expect(html).toContain('<code>code</code>')
  })
})

describe('htmlToMarkdown', () => {
  it('converts an h1 to markdown heading', async () => {
    const md = await htmlToMarkdown('<h1>Hello World</h1>')
    expect(md.trim()).toBe('# Hello World')
  })

  it('converts multiple heading levels', async () => {
    expect((await htmlToMarkdown('<h2>Two</h2>')).trim()).toBe('## Two')
    expect((await htmlToMarkdown('<h3>Three</h3>')).trim()).toBe('### Three')
  })

  it('converts a paragraph', async () => {
    const md = await htmlToMarkdown('<p>A simple paragraph.</p>')
    expect(md.trim()).toBe('A simple paragraph.')
  })

  it('converts bold text', async () => {
    const md = await htmlToMarkdown('<p>This is <strong>bold</strong> text.</p>')
    expect(md).toContain('**bold**')
  })

  it('converts italic text', async () => {
    const md = await htmlToMarkdown('<p>This is <em>italic</em> text.</p>')
    expect(md).toContain('*italic*')
  })

  it('converts links', async () => {
    const md = await htmlToMarkdown('<p>A <a href="https://example.com">link</a> here.</p>')
    expect(md).toContain('[link](https://example.com)')
  })

  it('converts blockquotes', async () => {
    const md = await htmlToMarkdown('<blockquote><p>Quoted.</p></blockquote>')
    expect(md.trim()).toContain('> Quoted.')
  })

  it('converts inline code', async () => {
    const md = await htmlToMarkdown('<p>Use <code>code</code> here.</p>')
    expect(md).toContain('`code`')
  })
})

describe('round-trip markdown → HTML → markdown', () => {
  const cases = [
    ['# Heading One', '# Heading One'],
    ['## Heading Two', '## Heading Two'],
    ['A simple paragraph.', 'A simple paragraph.'],
    ['This has **bold** and *italic* text.', 'This has **bold** and *italic* text.'],
    ['A [link](https://example.com) here.', 'A [link](https://example.com) here.'],
    ['> A blockquote.', '> A blockquote.'],
    ['Use `code` inline.', 'Use `code` inline.']
  ]

  it.each(cases)('round-trips: %s', async (input, expected) => {
    const html = await markdownToHtml(input)
    const md = await htmlToMarkdown(html)
    expect(md.trim()).toBe(expected)
  })
})

describe('full pipeline: edit text in MDX via HTML round-trip', () => {
  const mdxSource = `---
title: Test Page
layout: ../layouts/Main.astro
---

# Welcome

Some intro text.

<ImageText image="/hero.png" text="Welcome" />

Final paragraph.
`

  it('edits a heading via HTML and rewrites MDX correctly', async () => {
    const nodes = await extractTextNodes(mdxSource)
    const heading = nodes.find((n) => n.type === 'heading')!
    const html = await markdownToHtml(heading.content)

    const editedHtml = html.replace('Welcome', 'Hello World')
    const newMarkdown = (await htmlToMarkdown(editedHtml)).trimEnd()
    const updated = await updateTextContent(mdxSource, heading.index, newMarkdown)

    expect(updated).toContain('# Hello World')
    expect(updated).not.toContain('# Welcome')
    expect(updated).toContain('Some intro text.')
    expect(updated).toContain('<ImageText')
  })

  it('edits a paragraph via HTML and preserves surrounding content', async () => {
    const nodes = await extractTextNodes(mdxSource)
    const para = nodes.find((n) => n.type === 'paragraph' && n.textContent === 'Some intro text.')!
    const html = await markdownToHtml(para.content)

    const editedHtml = html.replace('Some intro text.', 'Updated <strong>bold</strong> intro.')
    const newMarkdown = (await htmlToMarkdown(editedHtml)).trimEnd()
    const updated = await updateTextContent(mdxSource, para.index, newMarkdown)

    expect(updated).toContain('Updated **bold** intro.')
    expect(updated).toContain('# Welcome')
    expect(updated).toContain('<ImageText')
    expect(updated).toContain('Final paragraph.')
  })

  it('preserves frontmatter and JSX blocks after inline edit', async () => {
    const nodes = await extractTextNodes(mdxSource)
    const last = nodes[nodes.length - 1]
    const editedHtml = '<p>New final text.</p>'
    const newMarkdown = (await htmlToMarkdown(editedHtml)).trimEnd()
    const updated = await updateTextContent(mdxSource, last.index, newMarkdown)

    expect(updated).toContain('title: Test Page')
    expect(updated).toContain('layout: ../layouts/Main.astro')
    expect(updated).toContain('<ImageText image="/hero.png" text="Welcome" />')
    expect(updated).toContain('New final text.')
  })

  it('round-trips a heading edit without corruption', async () => {
    const nodes = await extractTextNodes(mdxSource)
    const heading = nodes[0]
    const html = await markdownToHtml(heading.content)
    const md = (await htmlToMarkdown(html)).trimEnd()
    const updated = await updateTextContent(mdxSource, 0, md)

    const nodesAfter = await extractTextNodes(updated)
    expect(nodesAfter[0].textContent).toBe(heading.textContent)
    expect(nodesAfter[0].type).toBe(heading.type)
    expect(nodesAfter.length).toBe(nodes.length)
  })
})
