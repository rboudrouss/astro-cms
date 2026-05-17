import { describe, it, expect } from 'vitest'
import {
  extractLayoutFromSource,
  isLayoutFromTheme,
  computeLayoutRef,
  updatePageLayout
} from '../src/main/layout-checker'
import type { LayoutManifest } from '../src/shared/types'

const themeLayouts: Pick<LayoutManifest, 'name' | 'filePath'>[] = [
  { name: 'Main', filePath: '/project/src/themes/my-theme/layouts/Main.astro' },
  { name: 'Blog', filePath: '/project/src/themes/my-theme/layouts/Blog.astro' }
]

describe('extractLayoutFromSource', () => {
  it('extracts layout from standard frontmatter', () => {
    const source = `---
title: Hello
layout: ../layouts/Main.astro
---

# Content`
    expect(extractLayoutFromSource(source)).toBe('../layouts/Main.astro')
  })

  it('extracts layout with extra spaces', () => {
    const source = `---
layout:   ../layouts/Custom.astro
title: Hello
---

# Content`
    expect(extractLayoutFromSource(source)).toBe('../layouts/Custom.astro')
  })

  it('returns null when no layout field', () => {
    const source = `---
title: Hello
---

# Content`
    expect(extractLayoutFromSource(source)).toBeNull()
  })

  it('returns null when no frontmatter', () => {
    const source = `# Just markdown`
    expect(extractLayoutFromSource(source)).toBeNull()
  })

  it('extracts layout with quoted value', () => {
    const source = `---
layout: "../layouts/Main.astro"
title: Hello
---

# Content`
    expect(extractLayoutFromSource(source)).toBe('../layouts/Main.astro')
  })

  it('extracts layout with single-quoted value', () => {
    const source = `---
layout: '../layouts/Main.astro'
title: Hello
---

# Content`
    expect(extractLayoutFromSource(source)).toBe('../layouts/Main.astro')
  })
})

describe('isLayoutFromTheme', () => {
  it('returns true when layout basename matches a theme layout', () => {
    expect(isLayoutFromTheme('../layouts/Main.astro', themeLayouts)).toBe(true)
  })

  it('returns true for deep relative paths', () => {
    expect(
      isLayoutFromTheme('../../themes/my-theme/layouts/Blog.astro', themeLayouts)
    ).toBe(true)
  })

  it('returns false when layout is not in theme', () => {
    expect(isLayoutFromTheme('../layouts/Custom.astro', themeLayouts)).toBe(false)
  })

  it('returns false for empty layout ref', () => {
    expect(isLayoutFromTheme('', themeLayouts)).toBe(false)
  })

  it('returns false when theme has no layouts', () => {
    expect(isLayoutFromTheme('../layouts/Main.astro', [])).toBe(false)
  })

  it('handles layout ref without .astro extension', () => {
    expect(isLayoutFromTheme('../layouts/Main', themeLayouts)).toBe(true)
  })
})

describe('computeLayoutRef', () => {
  it('computes relative path from page to layout', () => {
    const result = computeLayoutRef(
      '/project/src/pages/index.mdx',
      '/project/src/themes/my-theme/layouts/Main.astro'
    )
    expect(result).toBe('../themes/my-theme/layouts/Main.astro')
  })

  it('computes relative path for nested page', () => {
    const result = computeLayoutRef(
      '/project/src/pages/blog/post.mdx',
      '/project/src/themes/my-theme/layouts/Blog.astro'
    )
    expect(result).toBe('../../themes/my-theme/layouts/Blog.astro')
  })

  it('computes sibling directory path', () => {
    const result = computeLayoutRef(
      '/project/src/pages/index.mdx',
      '/project/src/layouts/Custom.astro'
    )
    expect(result).toBe('../layouts/Custom.astro')
  })
})

describe('updatePageLayout', () => {
  it('updates layout in frontmatter', async () => {
    const source = `---
title: Hello
layout: ../layouts/Old.astro
---

# Content`
    const result = await updatePageLayout(source, '../themes/my-theme/layouts/New.astro')
    expect(result).toContain('layout: ../themes/my-theme/layouts/New.astro')
    expect(result).toContain('title: Hello')
    expect(result).toContain('# Content')
    expect(result).not.toContain('Old.astro')
  })

  it('adds layout when none exists', async () => {
    const source = `---
title: Hello
---

# Content`
    const result = await updatePageLayout(source, '../layouts/Main.astro')
    expect(result).toContain('layout: ../layouts/Main.astro')
    expect(result).toContain('title: Hello')
  })

  it('preserves other frontmatter fields', async () => {
    const source = `---
title: My Page
layout: ../layouts/Old.astro
description: A page
---

# Content

<ImageText image="/hero.png" text="Welcome" />`
    const result = await updatePageLayout(source, '../layouts/New.astro')
    expect(result).toContain('title: My Page')
    expect(result).toContain('description: A page')
    expect(result).toContain('layout: ../layouts/New.astro')
    expect(result).toContain('<ImageText image="/hero.png" text="Welcome" />')
  })

  it('handles source with no frontmatter', async () => {
    const source = `# Just markdown`
    const result = await updatePageLayout(source, '../layouts/Main.astro')
    expect(result).toContain('layout: ../layouts/Main.astro')
    expect(result).toContain('# Just markdown')
  })
})
