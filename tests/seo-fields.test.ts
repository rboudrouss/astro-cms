import { describe, it, expect } from 'vitest'
import {
  detectSeoFields,
  extractSeoValues,
  seoValuesToFields,
  validateSeoField,
  hasSeoFields,
  SEO_LIMITS
} from '../src/shared/seo-fields'

describe('detectSeoFields', () => {
  describe('name heuristic detection', () => {
    it('detects "title" field', () => {
      const result = detectSeoFields({ title: 'Hello', layout: 'Base.astro' })
      expect(result.title).toBe('title')
    })

    it('detects "description" field', () => {
      const result = detectSeoFields({ description: 'A page about stuff' })
      expect(result.description).toBe('description')
    })

    it('detects "ogImage" field', () => {
      const result = detectSeoFields({ ogImage: '/images/og.png' })
      expect(result.ogImage).toBe('ogImage')
    })

    it('detects "og_image" variant', () => {
      const result = detectSeoFields({ og_image: '/images/og.png' })
      expect(result.ogImage).toBe('og_image')
    })

    it('detects "socialImage" variant', () => {
      const result = detectSeoFields({ socialImage: '/img.png' })
      expect(result.ogImage).toBe('socialImage')
    })

    it('detects "seoTitle" variant', () => {
      const result = detectSeoFields({ seoTitle: 'My Title' })
      expect(result.title).toBe('seoTitle')
    })

    it('detects "metaTitle" variant', () => {
      const result = detectSeoFields({ metaTitle: 'My Title' })
      expect(result.title).toBe('metaTitle')
    })

    it('detects "metaDescription" variant', () => {
      const result = detectSeoFields({ metaDescription: 'My desc' })
      expect(result.description).toBe('metaDescription')
    })

    it('detects "openGraphImage" variant', () => {
      const result = detectSeoFields({ openGraphImage: '/img.png' })
      expect(result.ogImage).toBe('openGraphImage')
    })

    it('detects all three fields at once', () => {
      const result = detectSeoFields({
        title: 'Hello',
        description: 'A page',
        ogImage: '/img.png',
        layout: 'Base.astro'
      })
      expect(result.title).toBe('title')
      expect(result.description).toBe('description')
      expect(result.ogImage).toBe('ogImage')
    })

    it('is case-insensitive for matching', () => {
      const result = detectSeoFields({ Title: 'Hello', Description: 'Desc' })
      expect(result.title).toBe('Title')
      expect(result.description).toBe('Description')
    })
  })

  describe('cmsHints detection', () => {
    it('detects title via cmsHints seo property', () => {
      const result = detectSeoFields(
        { myCustomTitle: 'Hello' },
        { myCustomTitle: { seo: 'title' } }
      )
      expect(result.title).toBe('myCustomTitle')
    })

    it('detects description via cmsHints seo property', () => {
      const result = detectSeoFields(
        { desc: 'Some description' },
        { desc: { seo: 'description' } }
      )
      expect(result.description).toBe('desc')
    })

    it('detects ogImage via cmsHints seo property', () => {
      const result = detectSeoFields(
        { banner: '/img.png' },
        { banner: { seo: 'og-image' } }
      )
      expect(result.ogImage).toBe('banner')
    })

    it('cmsHints takes priority over name heuristic', () => {
      const result = detectSeoFields(
        { title: 'Wrong', realTitle: 'Right' },
        { realTitle: { seo: 'title' } }
      )
      expect(result.title).toBe('realTitle')
    })
  })

  describe('no SEO fields', () => {
    it('returns empty mapping when no SEO fields found', () => {
      const result = detectSeoFields({ layout: 'Base.astro', color: 'red' })
      expect(result).toEqual({})
    })

    it('returns empty mapping for empty frontmatter', () => {
      const result = detectSeoFields({})
      expect(result).toEqual({})
    })
  })
})

describe('extractSeoValues', () => {
  it('extracts values for mapped fields', () => {
    const frontmatter = { title: 'My Title', description: 'My desc', layout: 'Base' }
    const mapping = { title: 'title', description: 'description' } as const
    const values = extractSeoValues(frontmatter, mapping)
    expect(values).toEqual({ title: 'My Title', description: 'My desc' })
  })

  it('coerces non-string values to string', () => {
    const frontmatter = { title: 42 }
    const mapping = { title: 'title' } as const
    const values = extractSeoValues(frontmatter, mapping)
    expect(values).toEqual({ title: '42' })
  })

  it('returns empty string for undefined fields', () => {
    const frontmatter = { layout: 'Base' }
    const mapping = { title: 'title' } as const
    const values = extractSeoValues(frontmatter, mapping)
    expect(values).toEqual({ title: '' })
  })

  it('returns only mapped roles', () => {
    const frontmatter = { title: 'T', ogImage: '/img.png' }
    const mapping = { title: 'title', ogImage: 'ogImage' } as const
    const values = extractSeoValues(frontmatter, mapping)
    expect(values.description).toBeUndefined()
    expect(values.title).toBe('T')
    expect(values.ogImage).toBe('/img.png')
  })
})

describe('validateSeoField', () => {
  it('returns no warnings for good title length', () => {
    const value = 'A'.repeat(65)
    const warnings = validateSeoField('title', value)
    expect(warnings).toEqual([])
  })

  it('warns when title exceeds max', () => {
    const value = 'A'.repeat(SEO_LIMITS.title.max + 1)
    const warnings = validateSeoField('title', value)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].severity).toBe('warning')
    expect(warnings[0].role).toBe('title')
  })

  it('shows info when title is too short', () => {
    const value = 'Hi'
    const warnings = validateSeoField('title', value)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].severity).toBe('info')
    expect(warnings[0].role).toBe('title')
  })

  it('returns no warnings for empty title', () => {
    const warnings = validateSeoField('title', '')
    expect(warnings).toEqual([])
  })

  it('returns no warnings for good description length', () => {
    const value = 'A'.repeat(155)
    const warnings = validateSeoField('description', value)
    expect(warnings).toEqual([])
  })

  it('warns when description exceeds max', () => {
    const value = 'A'.repeat(SEO_LIMITS.description.max + 1)
    const warnings = validateSeoField('description', value)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].severity).toBe('warning')
  })

  it('shows info when description is too short', () => {
    const value = 'Short desc'
    const warnings = validateSeoField('description', value)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].severity).toBe('info')
  })

  it('returns no warnings for ogImage', () => {
    const warnings = validateSeoField('ogImage', '/img.png')
    expect(warnings).toEqual([])
  })
})

describe('seoValuesToFields', () => {
  it('converts role-keyed values back to field-name-keyed entries', () => {
    const mapping = { title: 'myTitle', description: 'desc' } as const
    const values = { title: 'Hello', description: 'World' }
    expect(seoValuesToFields(values, mapping)).toEqual({ myTitle: 'Hello', desc: 'World' })
  })

  it('skips roles not present in values', () => {
    const mapping = { title: 'title', description: 'description' } as const
    const values = { title: 'Only title' }
    expect(seoValuesToFields(values, mapping)).toEqual({ title: 'Only title' })
  })

  it('includes empty strings', () => {
    const mapping = { title: 'title' } as const
    const values = { title: '' }
    expect(seoValuesToFields(values, mapping)).toEqual({ title: '' })
  })

  it('returns empty object for empty mapping', () => {
    expect(seoValuesToFields({ title: 'Hello' }, {})).toEqual({})
  })
})

describe('hasSeoFields', () => {
  it('returns true when at least one SEO field is mapped', () => {
    expect(hasSeoFields({ title: 'title' })).toBe(true)
  })

  it('returns false when mapping is empty', () => {
    expect(hasSeoFields({})).toBe(false)
  })

  it('returns true with only ogImage', () => {
    expect(hasSeoFields({ ogImage: 'ogImage' })).toBe(true)
  })
})
