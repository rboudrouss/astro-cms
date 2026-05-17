import { readFileSync } from 'fs'
import { join } from 'path'
import { parseMdx, writeMdx } from '../src/main/mdx-parser'

const FIXTURES_DIR = join(__dirname, 'fixtures/mdx')

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf-8')
}

describe('MDX AST Parser/Writer', () => {
  describe('parseMdx', () => {
    it('parses simple frontmatter', async () => {
      const input = readFixture('simple-frontmatter.mdx')
      const ast = await parseMdx(input)

      expect(ast.frontmatter).toEqual({
        title: 'Hello World',
        layout: '../layouts/Main.astro'
      })
      expect(ast.body.type).toBe('root')
      expect(ast.body.children.length).toBeGreaterThan(0)
    })

    it('parses complex frontmatter with nested objects and arrays', async () => {
      const input = readFixture('complex-frontmatter.mdx')
      const ast = await parseMdx(input)

      expect(ast.frontmatter.title).toBe('Complex Page')
      expect(ast.frontmatter.tags).toEqual(['astro', 'cms', 'wysiwyg'])
      expect(ast.frontmatter.draft).toBe(false)
      expect(ast.frontmatter.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })

    it('parses pure markdown body', async () => {
      const input = readFixture('pure-markdown.mdx')
      const ast = await parseMdx(input)

      const types = ast.body.children.map((c) => c.type)
      expect(types).toContain('heading')
      expect(types).toContain('paragraph')
      expect(types).toContain('list')
      expect(types).toContain('blockquote')
      expect(types).toContain('code')
      expect(types).toContain('thematicBreak')
    })

    it('parses body with JSX blocks', async () => {
      const input = readFixture('with-blocks.mdx')
      const ast = await parseMdx(input)

      const jsxNodes = ast.body.children.filter(
        (c) => c.type === 'mdxJsxFlowElement'
      )
      expect(jsxNodes.length).toBe(2)

      const imageText = jsxNodes[0] as { name: string; attributes: Array<{ name: string; value: unknown }> }
      expect(imageText.name).toBe('ImageText')
      expect(imageText.attributes).toContainEqual(
        expect.objectContaining({ name: 'image', value: '/hero.png' })
      )

      const colorLigne = jsxNodes[1] as { name: string }
      expect(colorLigne.name).toBe('ColorLigne')
    })

    it('parses named slots', async () => {
      const input = readFixture('named-slots.mdx')
      const ast = await parseMdx(input)

      const section = ast.body.children.find(
        (c) => c.type === 'mdxJsxFlowElement'
      ) as { name: string; children: Array<{ type: string; name?: string }> }

      expect(section).toBeDefined()
      expect(section.name).toBe('Section')

      const fragments = section.children.filter(
        (c) => c.type === 'mdxJsxFlowElement' && c.name === 'Fragment'
      )
      expect(fragments.length).toBe(2)
    })

    it('parses nested components', async () => {
      const input = readFixture('nested-components.mdx')
      const ast = await parseMdx(input)

      const section = ast.body.children.find(
        (c) => c.type === 'mdxJsxFlowElement'
      ) as { name: string; children: Array<{ type: string; name?: string; children?: unknown[] }> }

      expect(section.name).toBe('Section')

      const sectionB = section.children.find(
        (c) => c.type === 'mdxJsxFlowElement' && c.name === 'SectionB'
      ) as { children: Array<{ type: string; name?: string }> }

      expect(sectionB).toBeDefined()

      const nestedBlocks = sectionB.children.filter(
        (c) => c.type === 'mdxJsxFlowElement'
      )
      expect(nestedBlocks.length).toBe(2)
    })

    it('handles files without frontmatter', async () => {
      const input = readFixture('no-frontmatter.mdx')
      const ast = await parseMdx(input)

      expect(ast.frontmatter).toEqual({})
      expect(ast.body.children.length).toBeGreaterThan(0)
    })
  })

  describe('writeMdx', () => {
    it('writes frontmatter and body back to MDX string', async () => {
      const input = readFixture('simple-frontmatter.mdx')
      const ast = await parseMdx(input)
      const output = await writeMdx(ast)

      expect(output).toContain('---')
      expect(output).toContain('title: Hello World')
      expect(output).toContain('# Welcome')
    })

    it('writes files without frontmatter', async () => {
      const input = readFixture('no-frontmatter.mdx')
      const ast = await parseMdx(input)
      const output = await writeMdx(ast)

      expect(output).not.toContain('---')
      expect(output).toContain('# No Frontmatter')
    })
  })

  describe('round-trip: write(parse(file)) === file', () => {
    const fixtures = [
      'simple-frontmatter.mdx',
      'complex-frontmatter.mdx',
      'pure-markdown.mdx',
      'with-blocks.mdx',
      'named-slots.mdx',
      'nested-components.mdx',
      'no-frontmatter.mdx'
    ]

    it.each(fixtures)('round-trips %s', async (fixture) => {
      const input = readFixture(fixture)
      const ast = await parseMdx(input)
      const output = await writeMdx(ast)
      expect(output).toBe(input)
    })
  })
})
