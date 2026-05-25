import { describe, it, expect } from 'vitest'
import { generateEditModeScript } from '../src/main/edit-mode-integration'

describe('generateEditModeScript - text element selection', () => {
  it('detects clicks on text elements (h1-h6, p, blockquote)', () => {
    const script = generateEditModeScript()
    expect(script).toContain('astro-cms:text-selected')
  })

  it('sends tagName of the clicked text element', () => {
    const script = generateEditModeScript()
    expect(script).toContain('tagName')
  })

  it('sends textContent of the clicked element', () => {
    const script = generateEditModeScript()
    expect(script).toContain('textContent')
  })

  it('sends bounding rect for overlay positioning', () => {
    const script = generateEditModeScript()
    expect(script).toContain('getBoundingClientRect')
  })

  it('sends computed styles for style inheritance', () => {
    const script = generateEditModeScript()
    expect(script).toContain('getComputedStyle')
  })

  it('only triggers text selection for elements NOT inside a block wrapper', () => {
    const script = generateEditModeScript()
    expect(script).toContain('data-block-id')
    expect(script).toContain('closest')
  })

  it('includes text element selectors for h1-h6, p, blockquote', () => {
    const script = generateEditModeScript()
    for (const tag of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'BLOCKQUOTE']) {
      expect(script).toContain(tag)
    }
  })
})
