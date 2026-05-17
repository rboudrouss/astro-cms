import { resolve } from 'path'
import { parseThemeManifest } from '../src/main/theme-manifest-parser'
import type { ThemeManifest } from '../src/shared/types'

const FIXTURES_DIR = resolve(__dirname, 'fixtures/test-theme')

describe('parseThemeManifest', () => {
  let manifest: ThemeManifest

  beforeAll(async () => {
    manifest = await parseThemeManifest(FIXTURES_DIR)
  })

  it('extracts theme name', () => {
    expect(manifest.name).toBe('test-theme')
  })

  it('extracts theme variables', () => {
    expect(manifest.variables).toEqual({
      mainColor: { type: 'color', default: '#000' },
      fontSize: { type: 'number', default: 16 }
    })
  })

  it('discovers all blocks', () => {
    const blockNames = manifest.blocks.map((b) => b.name).sort()
    expect(blockNames).toEqual(['ColorLigne', 'ImageText', 'Section', 'SectionB', 'YtEmbed'])
  })

  it('discovers all layouts', () => {
    const layoutNames = manifest.layouts.map((l) => l.name).sort()
    expect(layoutNames).toEqual(['Default', 'Parent'])
  })

  describe('leaf block (ImageText)', () => {
    it('has correct props inferred from interface Props', () => {
      const block = manifest.blocks.find((b) => b.name === 'ImageText')!
      expect(block.props).toEqual([
        { name: 'image', type: 'string', required: true, description: 'Image principale' },
        {
          name: 'text',
          type: 'string',
          required: true,
          description: 'Texte affiché à côté de l\'image'
        },
        {
          name: 'reversed',
          type: 'boolean',
          required: false,
          description: 'Texte à droite au lieu de gauche'
        }
      ])
    })

    it('has cmsHints extracted', () => {
      const block = manifest.blocks.find((b) => b.name === 'ImageText')!
      expect(block.cmsHints).toEqual({
        image: { format: 'image' },
        text: { format: 'richtext' }
      })
    })

    it('is not compositional (no slot)', () => {
      const block = manifest.blocks.find((b) => b.name === 'ImageText')!
      expect(block.isCompositional).toBe(false)
      expect(block.slots).toEqual([])
    })

    it('has label derived from name', () => {
      const block = manifest.blocks.find((b) => b.name === 'ImageText')!
      expect(block.label).toBe('ImageText')
    })
  })

  describe('compositional block with default slot (Section)', () => {
    it('is compositional', () => {
      const block = manifest.blocks.find((b) => b.name === 'Section')!
      expect(block.isCompositional).toBe(true)
    })

    it('has default slot', () => {
      const block = manifest.blocks.find((b) => b.name === 'Section')!
      expect(block.slots).toEqual([{ name: 'default' }])
    })

    it('has props and cmsHints', () => {
      const block = manifest.blocks.find((b) => b.name === 'Section')!
      expect(block.props).toHaveLength(2)
      expect(block.cmsHints).toEqual({
        title: { format: 'text' },
        bgColor: { format: 'color' }
      })
    })
  })

  describe('compositional block with named slots (SectionB)', () => {
    it('is compositional', () => {
      const block = manifest.blocks.find((b) => b.name === 'SectionB')!
      expect(block.isCompositional).toBe(true)
    })

    it('has named slots', () => {
      const block = manifest.blocks.find((b) => b.name === 'SectionB')!
      const slotNames = block.slots.map((s) => s.name).sort()
      expect(slotNames).toEqual(['left', 'right'])
    })

    it('has no cmsHints', () => {
      const block = manifest.blocks.find((b) => b.name === 'SectionB')!
      expect(block.cmsHints).toEqual({})
    })
  })

  describe('block without cmsHints (ColorLigne)', () => {
    it('has empty cmsHints', () => {
      const block = manifest.blocks.find((b) => b.name === 'ColorLigne')!
      expect(block.cmsHints).toEqual({})
    })

    it('infers props from interface Props', () => {
      const block = manifest.blocks.find((b) => b.name === 'ColorLigne')!
      expect(block.props).toEqual([
        { name: 'color', type: 'string', required: true },
        { name: 'height', type: 'number', required: false }
      ])
    })

    it('is not compositional', () => {
      const block = manifest.blocks.find((b) => b.name === 'ColorLigne')!
      expect(block.isCompositional).toBe(false)
    })
  })

  describe('block with extended cmsHints (YtEmbed)', () => {
    it('has cmsHints with extra properties', () => {
      const block = manifest.blocks.find((b) => b.name === 'YtEmbed')!
      expect(block.cmsHints).toEqual({
        videoId: { format: 'text', placeholder: 'dQw4w9WgXcQ' }
      })
    })
  })

  describe('layout (Default)', () => {
    it('has props with descriptions', () => {
      const layout = manifest.layouts.find((l) => l.name === 'Default')!
      expect(layout.props).toEqual([
        { name: 'title', type: 'string', required: true, description: 'Titre de la page' },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Description pour le SEO'
        }
      ])
    })

    it('has default slot', () => {
      const layout = manifest.layouts.find((l) => l.name === 'Default')!
      expect(layout.slots).toEqual([{ name: 'default' }])
    })
  })

  describe('edge cases', () => {
    it('throws on missing theme manifest file', async () => {
      await expect(parseThemeManifest('/nonexistent/path')).rejects.toThrow()
    })

    it('handles theme with empty blocks dir', async () => {
      const { mkdtemp, writeFile, mkdir } = await import('fs/promises')
      const { tmpdir } = await import('os')
      const dir = await mkdtemp(resolve(tmpdir(), 'theme-test-'))
      await mkdir(resolve(dir, 'blocks'))
      await mkdir(resolve(dir, 'layouts'))
      await writeFile(
        resolve(dir, 'astro-cms.theme.ts'),
        `import { defineTheme } from "@astro-cms/theme";
export default defineTheme({
  name: "empty-theme",
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
  variables: {},
});`
      )
      const m = await parseThemeManifest(dir)
      expect(m.name).toBe('empty-theme')
      expect(m.blocks).toEqual([])
      expect(m.layouts).toEqual([])
      const { rm } = await import('fs/promises')
      await rm(dir, { recursive: true })
    })
  })
})
