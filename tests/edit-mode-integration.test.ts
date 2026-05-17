import { describe, it, expect } from 'vitest'
import { wrapBlockTemplate, generateEditModeScript } from '../src/main/edit-mode-integration'

describe('wrapBlockTemplate', () => {
  it('wraps a simple block template with data-block-id div', () => {
    const source = `---
interface Props {
  image: string;
  text: string;
}
const { image, text } = Astro.props;
---

<div class="image-text">
  <img src={image} alt="" />
  <p>{text}</p>
</div>`

    const result = wrapBlockTemplate(source, 'ImageText', 'blocks/ImageText.astro')

    expect(result).toContain('data-block-id="ImageText"')
    expect(result).toContain('data-block-path="blocks/ImageText.astro"')
    expect(result).toContain('data-block-name="ImageText"')
    expect(result).toContain('<div class="image-text">')
    expect(result).toContain('</div>\n</div>')
  })

  it('wraps a single-element block (no outer div)', () => {
    const source = `---
interface Props {
  color: string;
  height?: number;
}
const { color, height = 2 } = Astro.props;
---

<hr style={\`border-color: \${color}\`} />`

    const result = wrapBlockTemplate(source, 'ColorLigne', 'blocks/ColorLigne.astro')

    expect(result).toContain('data-block-id="ColorLigne"')
    expect(result).toContain('<hr style=')
  })

  it('wraps a compositional block with slot', () => {
    const source = `---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<section>
  <h2>{title}</h2>
  <slot />
</section>`

    const result = wrapBlockTemplate(source, 'Section', 'blocks/Section.astro')

    expect(result).toContain('data-block-id="Section"')
    expect(result).toContain('<slot />')
  })

  it('preserves the frontmatter unchanged', () => {
    const source = `---
interface Props {
  text: string;
}
const { text } = Astro.props;
---

<p>{text}</p>`

    const result = wrapBlockTemplate(source, 'TextBlock', 'blocks/TextBlock.astro')

    const frontmatter = result.split('---')[1]
    expect(frontmatter).toContain('interface Props')
    expect(frontmatter).toContain('const { text } = Astro.props')
  })

  it('handles blocks with no frontmatter gracefully', () => {
    const source = `<p>Static content</p>`

    const result = wrapBlockTemplate(source, 'Static', 'blocks/Static.astro')

    expect(result).toContain('data-block-id="Static"')
    expect(result).toContain('<p>Static content</p>')
  })

  it('handles multi-line template with multiple root elements', () => {
    const source = `---
const { title, subtitle } = Astro.props;
---

<h1>{title}</h1>
<p>{subtitle}</p>`

    const result = wrapBlockTemplate(source, 'Hero', 'blocks/Hero.astro')

    expect(result).toContain('data-block-id="Hero"')
    expect(result).toContain('<h1>{title}</h1>')
    expect(result).toContain('<p>{subtitle}</p>')
  })
})

describe('generateEditModeScript', () => {
  it('returns a string containing a click event listener', () => {
    const script = generateEditModeScript()

    expect(script).toContain('addEventListener')
    expect(script).toContain('click')
  })

  it('posts a message to the parent window on block click', () => {
    const script = generateEditModeScript()

    expect(script).toContain('parent.postMessage')
    expect(script).toContain('astro-cms:block-selected')
  })

  it('uses data-block-id to identify the clicked block', () => {
    const script = generateEditModeScript()

    expect(script).toContain('data-block-id')
    expect(script).toContain('closest')
  })

  it('includes hover highlight styles', () => {
    const script = generateEditModeScript()

    expect(script).toContain('outline')
    expect(script).toContain('mouseenter')
  })

  it('includes selected state styling', () => {
    const script = generateEditModeScript()

    expect(script).toContain('astro-cms-selected')
  })
})
