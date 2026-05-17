import { describe, it, expect } from 'vitest'
import {
  readPageVariableOverrides,
  writePageVariableOverrides
} from '../src/main/page-variable-overrides'

describe('readPageVariableOverrides', () => {
  it('reads variables from frontmatter', () => {
    const mdx = `---
layout: ../layouts/Default.astro
title: Home
variables:
  mainColor: "#f00"
  fontSize: 24
---

# Hello`
    const result = readPageVariableOverrides(mdx)
    expect(result).toEqual({ mainColor: '#f00', fontSize: 24 })
  })

  it('returns empty object when no variables in frontmatter', () => {
    const mdx = `---
layout: ../layouts/Default.astro
title: Home
---

# Hello`
    const result = readPageVariableOverrides(mdx)
    expect(result).toEqual({})
  })

  it('returns empty object when no frontmatter', () => {
    const mdx = `# Hello World`
    const result = readPageVariableOverrides(mdx)
    expect(result).toEqual({})
  })

  it('returns empty object when variables is not an object', () => {
    const mdx = `---
variables: "not an object"
---

# Hello`
    const result = readPageVariableOverrides(mdx)
    expect(result).toEqual({})
  })
})

describe('writePageVariableOverrides', () => {
  it('adds variables to frontmatter', () => {
    const mdx = `---
layout: ../layouts/Default.astro
title: Home
---

# Hello`
    const result = writePageVariableOverrides(mdx, { mainColor: '#f00' })
    const readBack = readPageVariableOverrides(result)
    expect(readBack).toEqual({ mainColor: '#f00' })
  })

  it('updates existing variables in frontmatter', () => {
    const mdx = `---
layout: ../layouts/Default.astro
variables:
  mainColor: "#000"
---

# Hello`
    const result = writePageVariableOverrides(mdx, { mainColor: '#f00', fontSize: 20 })
    const readBack = readPageVariableOverrides(result)
    expect(readBack).toEqual({ mainColor: '#f00', fontSize: 20 })
  })

  it('removes variables key when empty', () => {
    const mdx = `---
layout: ../layouts/Default.astro
variables:
  mainColor: "#000"
---

# Hello`
    const result = writePageVariableOverrides(mdx, {})
    expect(result).not.toMatch(/variables:/)
    const readBack = readPageVariableOverrides(result)
    expect(readBack).toEqual({})
  })

  it('preserves other frontmatter keys', () => {
    const mdx = `---
layout: ../layouts/Default.astro
title: Home
---

# Hello`
    const result = writePageVariableOverrides(mdx, { mainColor: '#f00' })
    expect(result).toMatch(/title: Home/)
    expect(result).toMatch(/layout:/)
  })

  it('preserves body content', () => {
    const mdx = `---
title: Home
---

# Hello

Some content here`
    const result = writePageVariableOverrides(mdx, { mainColor: '#f00' })
    expect(result).toContain('# Hello')
    expect(result).toContain('Some content here')
  })
})
