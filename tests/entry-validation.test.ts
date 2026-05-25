import { describe, it, expect } from 'vitest'
import {
  parseFrontmatter,
  validateEntryFields
} from '../src/renderer/src/lib/entry-validation'
import type { CollectionSchema } from '../src/shared/types'

const blogSchema: CollectionSchema = {
  name: 'blog',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'views', type: 'number', required: false },
    { name: 'draft', type: 'boolean', required: false, default: true },
    { name: 'pubDate', type: 'date', required: true },
    { name: 'status', type: 'enum', required: true, enumValues: ['draft', 'published', 'archived'] }
  ]
}

describe('parseFrontmatter', () => {
  it('parses simple key-value frontmatter', () => {
    const content = '---\ntitle: Hello World\ndraft: false\n---\n\n# Body'
    const result = parseFrontmatter(content)
    expect(result).toEqual({ title: 'Hello World', draft: false })
  })

  it('handles values containing colons', () => {
    const content = '---\ntitle: "Time: 10:30 AM"\n---\n'
    const result = parseFrontmatter(content)
    expect(result.title).toBe('Time: 10:30 AM')
  })

  it('handles numeric values', () => {
    const content = '---\nviews: 42\nprice: 9.99\n---\n'
    const result = parseFrontmatter(content)
    expect(result.views).toBe(42)
    expect(result.price).toBe(9.99)
  })

  it('handles boolean values', () => {
    const content = '---\ndraft: true\npublished: false\n---\n'
    const result = parseFrontmatter(content)
    expect(result.draft).toBe(true)
    expect(result.published).toBe(false)
  })

  it('returns empty object when no frontmatter', () => {
    const result = parseFrontmatter('# Just markdown')
    expect(result).toEqual({})
  })

  it('handles date strings', () => {
    const content = '---\npubDate: 2026-05-17\n---\n'
    const result = parseFrontmatter(content)
    expect(result.pubDate).toBe('2026-05-17')
  })
})

describe('validateEntryFields', () => {
  it('reports missing required string fields', () => {
    const errors = validateEntryFields(blogSchema, { pubDate: '2026-05-17', status: 'draft' })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'title' })
    )
  })

  it('reports no errors when all required fields are present and valid', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      pubDate: '2026-05-17',
      status: 'draft'
    })
    expect(errors).toHaveLength(0)
  })

  it('skips optional fields when empty', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      pubDate: '2026-05-17',
      status: 'draft'
    })
    const descError = errors.find((e) => e.field === 'description')
    expect(descError).toBeUndefined()
  })

  it('validates number fields reject non-numeric values', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      views: 'not-a-number',
      pubDate: '2026-05-17',
      status: 'draft'
    })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'views' })
    )
  })

  it('accepts valid number values', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      views: 42,
      pubDate: '2026-05-17',
      status: 'draft'
    })
    const viewsError = errors.find((e) => e.field === 'views')
    expect(viewsError).toBeUndefined()
  })

  it('accepts zero as a valid number', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      views: 0,
      pubDate: '2026-05-17',
      status: 'draft'
    })
    const viewsError = errors.find((e) => e.field === 'views')
    expect(viewsError).toBeUndefined()
  })

  it('validates enum fields reject values not in enumValues', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      pubDate: '2026-05-17',
      status: 'invalid-status'
    })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'status' })
    )
  })

  it('validates date fields reject non-date strings', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      pubDate: 'not-a-date',
      status: 'draft'
    })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'pubDate' })
    )
  })

  it('accepts valid date strings', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      pubDate: '2026-05-17',
      status: 'draft'
    })
    const dateError = errors.find((e) => e.field === 'pubDate')
    expect(dateError).toBeUndefined()
  })

  it('validates boolean fields reject non-boolean values', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      draft: 'yes',
      pubDate: '2026-05-17',
      status: 'draft'
    })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'draft' })
    )
  })

  it('treats empty string as missing for required fields', () => {
    const errors = validateEntryFields(blogSchema, {
      title: '',
      pubDate: '2026-05-17',
      status: 'draft'
    })
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'title' })
    )
  })

  it('does not type-validate undefined optional fields', () => {
    const errors = validateEntryFields(blogSchema, {
      title: 'Hello',
      pubDate: '2026-05-17',
      status: 'draft',
      views: undefined
    })
    const viewsError = errors.find((e) => e.field === 'views')
    expect(viewsError).toBeUndefined()
  })
})
