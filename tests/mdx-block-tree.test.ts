import { extractBlocks, insertBlockMdx, deleteBlockMdx, reorderBlockMdx } from '../src/main/mdx-block-tree'

const pageMdx = `---
title: Test Page
layout: ../layouts/Main.astro
---

# Page Title

Some intro text.

<ImageText image="/hero.png" text="Welcome" reversed />

More text between blocks.

<ColorLigne color="#e865ad" />

Final paragraph.
`

describe('extractBlocks', () => {
  it('extracts all top-level JSX blocks in order', async () => {
    const blocks = await extractBlocks(pageMdx)
    expect(blocks).toHaveLength(2)
    expect(blocks[0].blockName).toBe('ImageText')
    expect(blocks[1].blockName).toBe('ColorLigne')
  })

  it('extracts props from each block', async () => {
    const blocks = await extractBlocks(pageMdx)
    expect(blocks[0].props).toEqual({ image: '/hero.png', text: 'Welcome', reversed: true })
    expect(blocks[1].props).toEqual({ color: '#e865ad' })
  })

  it('assigns sequential ids', async () => {
    const blocks = await extractBlocks(pageMdx)
    expect(blocks[0].id).toBe('block-0')
    expect(blocks[1].id).toBe('block-1')
  })

  it('returns empty array for MDX with no blocks', async () => {
    const mdx = `---
title: No blocks
---

Just some text.
`
    const blocks = await extractBlocks(mdx)
    expect(blocks).toEqual([])
  })

  it('handles expression props (numbers, booleans)', async () => {
    const mdx = `---
title: Test
---

<Widget count={3} active={true} label="hello" />
`
    const blocks = await extractBlocks(mdx)
    expect(blocks[0].props.count).toBe(3)
    expect(blocks[0].props.active).toBe(true)
    expect(blocks[0].props.label).toBe('hello')
  })
})

describe('insertBlockMdx', () => {
  it('inserts a block at position 0 (before first block)', async () => {
    const result = await insertBlockMdx(pageMdx, 'NewBlock', { title: 'Hello' }, 0)
    expect(result).toContain('<NewBlock title="Hello" />')
    const blocks = await extractBlocks(result)
    expect(blocks[0].blockName).toBe('NewBlock')
    expect(blocks[1].blockName).toBe('ImageText')
    expect(blocks[2].blockName).toBe('ColorLigne')
  })

  it('inserts a block at position 1 (between existing blocks)', async () => {
    const result = await insertBlockMdx(pageMdx, 'NewBlock', { n: 5 }, 1)
    const blocks = await extractBlocks(result)
    expect(blocks[0].blockName).toBe('ImageText')
    expect(blocks[1].blockName).toBe('NewBlock')
    expect(blocks[2].blockName).toBe('ColorLigne')
  })

  it('inserts at end when position exceeds block count', async () => {
    const result = await insertBlockMdx(pageMdx, 'Footer', {}, 99)
    const blocks = await extractBlocks(result)
    expect(blocks[blocks.length - 1].blockName).toBe('Footer')
  })

  it('preserves frontmatter and markdown content', async () => {
    const result = await insertBlockMdx(pageMdx, 'NewBlock', {}, 1)
    expect(result).toContain('title: Test Page')
    expect(result).toContain('# Page Title')
    expect(result).toContain('Some intro text.')
    expect(result).toContain('Final paragraph.')
  })

  it('inserts a block with no props', async () => {
    const result = await insertBlockMdx(pageMdx, 'Divider', {}, 1)
    expect(result).toContain('<Divider />')
  })

  it('inserts a block with boolean true prop (valueless attribute)', async () => {
    const result = await insertBlockMdx(pageMdx, 'Banner', { visible: true }, 0)
    expect(result).toContain('<Banner visible />')
  })
})

describe('deleteBlockMdx', () => {
  it('deletes the first block', async () => {
    const result = await deleteBlockMdx(pageMdx, 0)
    const blocks = await extractBlocks(result)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].blockName).toBe('ColorLigne')
  })

  it('deletes the second block', async () => {
    const result = await deleteBlockMdx(pageMdx, 1)
    const blocks = await extractBlocks(result)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].blockName).toBe('ImageText')
  })

  it('preserves frontmatter and markdown', async () => {
    const result = await deleteBlockMdx(pageMdx, 0)
    expect(result).toContain('title: Test Page')
    expect(result).toContain('# Page Title')
    expect(result).toContain('Final paragraph.')
  })

  it('returns source unchanged for out-of-range index', async () => {
    const result = await deleteBlockMdx(pageMdx, 99)
    expect(result).toBe(pageMdx)
  })
})

describe('reorderBlockMdx', () => {
  it('swaps two blocks', async () => {
    const result = await reorderBlockMdx(pageMdx, 0, 1)
    const blocks = await extractBlocks(result)
    expect(blocks[0].blockName).toBe('ColorLigne')
    expect(blocks[1].blockName).toBe('ImageText')
  })

  it('preserves frontmatter and markdown', async () => {
    const result = await reorderBlockMdx(pageMdx, 0, 1)
    expect(result).toContain('title: Test Page')
    expect(result).toContain('# Page Title')
  })

  it('returns source unchanged when from equals to', async () => {
    const result = await reorderBlockMdx(pageMdx, 0, 0)
    expect(result).toBe(pageMdx)
  })

  it('returns source unchanged for out-of-range indices', async () => {
    const result = await reorderBlockMdx(pageMdx, 99, 0)
    expect(result).toBe(pageMdx)
  })

  it('works with three blocks', async () => {
    const mdx3 = `---
title: Three
---

<A />

<B />

<C />
`
    const result = await reorderBlockMdx(mdx3, 0, 2)
    const blocks = await extractBlocks(result)
    expect(blocks.map((b) => b.blockName)).toEqual(['B', 'C', 'A'])
  })
})
