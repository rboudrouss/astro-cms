import { describe, it, expect } from 'vitest'
import { parseCollectionSchema } from '../src/main/collection-schema-parser'

describe('parseCollectionSchema', () => {
  it('extracts string fields from z.object', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')
    expect(schema).not.toBeNull()
    expect(schema!.name).toBe('blog')
    expect(schema!.fields).toHaveLength(1)
    expect(schema!.fields[0]).toEqual({
      name: 'title',
      type: 'string',
      required: true
    })
  })

  it('extracts multiple field types', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    views: z.number(),
    draft: z.boolean(),
    pubDate: z.date(),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields).toHaveLength(4)
    expect(schema.fields[0]).toMatchObject({ name: 'title', type: 'string', required: true })
    expect(schema.fields[1]).toMatchObject({ name: 'views', type: 'number', required: true })
    expect(schema.fields[2]).toMatchObject({ name: 'draft', type: 'boolean', required: true })
    expect(schema.fields[3]).toMatchObject({ name: 'pubDate', type: 'date', required: true })
  })

  it('detects optional fields', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    heroImage: z.string().optional(),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields[0]).toMatchObject({ name: 'title', required: true })
    expect(schema.fields[1]).toMatchObject({ name: 'heroImage', required: false })
  })

  it('extracts default values', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    draft: z.boolean().default(false),
    category: z.string().default("general"),
    count: z.number().default(0),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields[0]).toMatchObject({ name: 'draft', required: false, default: false })
    expect(schema.fields[1]).toMatchObject({ name: 'category', required: false, default: 'general' })
    expect(schema.fields[2]).toMatchObject({ name: 'count', required: false, default: 0 })
  })

  it('extracts enum fields', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    status: z.enum(["draft", "published", "archived"]),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields[0]).toMatchObject({
      name: 'status',
      type: 'enum',
      required: true,
      enumValues: ['draft', 'published', 'archived']
    })
  })

  it('extracts description from .describe()', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    title: z.string().describe("The post title"),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields[0]).toMatchObject({ name: 'title', description: 'The post title' })
  })

  it('handles chained modifiers (optional + default + describe)', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    tags: z.string().default("none").describe("Comma-separated tags").optional(),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields[0]).toMatchObject({
      name: 'tags',
      type: 'string',
      required: false,
      default: 'none',
      description: 'Comma-separated tags'
    })
  })

  it('returns null for unknown collection', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'events')
    expect(schema).toBeNull()
  })

  it('handles multiple collections', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
  })
});
const events = defineCollection({
  schema: z.object({
    date: z.date(),
    location: z.string(),
  })
});
export const collections = { blog, events };
`
    const blogSchema = parseCollectionSchema(source, 'blog')!
    expect(blogSchema.fields).toHaveLength(1)
    expect(blogSchema.fields[0].name).toBe('title')

    const eventsSchema = parseCollectionSchema(source, 'events')!
    expect(eventsSchema.fields).toHaveLength(2)
    expect(eventsSchema.fields[0].name).toBe('date')
    expect(eventsSchema.fields[1].name).toBe('location')
  })

  it('returns null when no collections export exists', () => {
    const source = `const x = 42;`
    const schema = parseCollectionSchema(source, 'blog')
    expect(schema).toBeNull()
  })

  it('handles coerce.date()', () => {
    const source = `
import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
  schema: z.object({
    pubDate: z.coerce.date(),
  })
});
export const collections = { blog };
`
    const schema = parseCollectionSchema(source, 'blog')!
    expect(schema.fields[0]).toMatchObject({ name: 'pubDate', type: 'date' })
  })
})
