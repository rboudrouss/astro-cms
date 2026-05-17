import { updateBlockProps, extractBlockProps } from '../src/main/mdx-block-updater'

const simpleMdx = `---
title: Test Page
layout: ../layouts/Main.astro
---

# Page Title

Some intro text.

<ImageText image="/hero.png" text="Welcome to our site" reversed />

More text between blocks.

<ColorLigne color="#e865ad" />

Final paragraph.
`

describe('extractBlockProps', () => {
  it('extracts string props from a block', async () => {
    const props = await extractBlockProps(simpleMdx, 'ImageText')
    expect(props).not.toBeNull()
    expect(props!.image).toBe('/hero.png')
    expect(props!.text).toBe('Welcome to our site')
  })

  it('extracts boolean props (value-less attribute = true)', async () => {
    const props = await extractBlockProps(simpleMdx, 'ImageText')
    expect(props!.reversed).toBe(true)
  })

  it('returns null for a block that does not exist', async () => {
    const props = await extractBlockProps(simpleMdx, 'NonExistent')
    expect(props).toBeNull()
  })

  it('extracts expression props (numbers)', async () => {
    const mdx = `---
title: Test
---

<ColorLigne color="#fff" height={4} />
`
    const props = await extractBlockProps(mdx, 'ColorLigne')
    expect(props!.color).toBe('#fff')
    expect(props!.height).toBe(4)
  })
})

describe('updateBlockProps', () => {
  it('updates a string prop value', async () => {
    const result = await updateBlockProps(simpleMdx, 'ImageText', {
      image: '/new-image.png',
      text: 'Welcome to our site',
      reversed: true
    })
    expect(result).toContain('image="/new-image.png"')
    expect(result).toContain('text="Welcome to our site"')
  })

  it('updates a boolean prop (true → present, false → removed)', async () => {
    const result = await updateBlockProps(simpleMdx, 'ImageText', {
      image: '/hero.png',
      text: 'Welcome to our site',
      reversed: false
    })
    expect(result).not.toContain('reversed')
    expect(result).toContain('image="/hero.png"')
  })

  it('adds a boolean prop when set to true', async () => {
    const mdxWithoutBool = `---
title: Test
---

<ImageText image="/hero.png" text="Hello" />
`
    const result = await updateBlockProps(mdxWithoutBool, 'ImageText', {
      image: '/hero.png',
      text: 'Hello',
      reversed: true
    })
    expect(result).toContain('reversed')
  })

  it('updates a number prop using expression syntax', async () => {
    const mdx = `---
title: Test
---

<ColorLigne color="#e865ad" />
`
    const result = await updateBlockProps(mdx, 'ColorLigne', {
      color: '#ff0000',
      height: 5
    })
    expect(result).toContain('color="#ff0000"')
    expect(result).toContain('height={5}')
  })

  it('preserves other content around the block', async () => {
    const result = await updateBlockProps(simpleMdx, 'ImageText', {
      image: '/updated.png',
      text: 'Updated text',
      reversed: true
    })
    expect(result).toContain('# Page Title')
    expect(result).toContain('Some intro text.')
    expect(result).toContain('More text between blocks.')
    expect(result).toContain('<ColorLigne')
    expect(result).toContain('Final paragraph.')
    expect(result).toContain('title: Test Page')
  })

  it('returns source unchanged when block not found', async () => {
    const result = await updateBlockProps(simpleMdx, 'NonExistent', { foo: 'bar' })
    expect(result).toBe(simpleMdx)
  })

  it('round-trips without changing unrelated blocks', async () => {
    const props = await extractBlockProps(simpleMdx, 'ColorLigne')
    const result = await updateBlockProps(simpleMdx, 'ColorLigne', props!)
    const propsAfter = await extractBlockProps(result, 'ColorLigne')
    expect(propsAfter).toEqual(props)
  })

  it('handles adding a new prop that was not previously present', async () => {
    const result = await updateBlockProps(simpleMdx, 'ColorLigne', {
      color: '#e865ad',
      height: 3
    })
    expect(result).toContain('height={3}')
    expect(result).toContain('color="#e865ad"')
  })

  it('removes props not present in the new props object', async () => {
    const result = await updateBlockProps(simpleMdx, 'ImageText', {
      image: '/hero.png'
    })
    expect(result).not.toContain('text=')
    expect(result).not.toContain('reversed')
    expect(result).toContain('image="/hero.png"')
  })
})
