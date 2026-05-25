import { describe, it, expect } from 'vitest'
import { extractFrontmatter, updateFrontmatter } from '../src/main/frontmatter-updater'

describe('extractFrontmatter', () => {
  it('extracts frontmatter fields from MDX source', async () => {
    const source = `---
title: Hello World
description: A great page
layout: ../layouts/Base.astro
---

# Content here
`
    const result = await extractFrontmatter(source)
    expect(result.title).toBe('Hello World')
    expect(result.description).toBe('A great page')
    expect(result.layout).toBe('../layouts/Base.astro')
  })

  it('returns empty object for MDX without frontmatter', async () => {
    const source = '# Just content\n\nNo frontmatter here.\n'
    const result = await extractFrontmatter(source)
    expect(result).toEqual({})
  })
})

describe('updateFrontmatter', () => {
  it('updates existing frontmatter fields', async () => {
    const source = `---
title: Old Title
description: Old description
layout: ../layouts/Base.astro
---

# Content
`
    const updated = await updateFrontmatter(source, {
      title: 'New Title',
      description: 'New description'
    })

    const result = await extractFrontmatter(updated)
    expect(result.title).toBe('New Title')
    expect(result.description).toBe('New description')
    expect(result.layout).toBe('../layouts/Base.astro')
  })

  it('adds new frontmatter fields', async () => {
    const source = `---
title: My Page
---

# Content
`
    const updated = await updateFrontmatter(source, {
      description: 'Added description'
    })

    const result = await extractFrontmatter(updated)
    expect(result.title).toBe('My Page')
    expect(result.description).toBe('Added description')
  })

  it('preserves body content after update', async () => {
    const source = `---
title: Hello
---

# My heading

Some paragraph text.
`
    const updated = await updateFrontmatter(source, { title: 'Updated' })
    expect(updated).toContain('# My heading')
    expect(updated).toContain('Some paragraph text.')
  })

  it('handles empty frontmatter values', async () => {
    const source = `---
title: Hello
description: World
---

# Content
`
    const updated = await updateFrontmatter(source, { description: '' })
    const result = await extractFrontmatter(updated)
    expect(result.description).toBe('')
  })
})
