export function wrapBlockTemplate(source: string, blockName: string, blockPath: string): string {
  const fencePattern = /^---\n[\s\S]*?\n---\n/
  const match = source.match(fencePattern)

  const frontmatter = match ? match[0] : ''
  const template = match ? source.slice(match[0].length) : source
  const trimmedTemplate = template.replace(/^\n+/, '')

  const wrapper =
    `<div data-block-id="${blockName}" data-block-name="${blockName}" data-block-path="${blockPath}">\n` +
    trimmedTemplate +
    '\n</div>'

  return frontmatter ? frontmatter + '\n' + wrapper : wrapper
}

export function generateEditModeScript(): string {
  return `
(function() {
  let selectedEl = null;

  const style = document.createElement('style');
  style.textContent = \`
    [data-block-id] { cursor: pointer; transition: outline 0.15s ease; }
    [data-block-id].astro-cms-hover { outline: 2px dashed rgba(59,130,246,0.5); outline-offset: 2px; }
    [data-block-id].astro-cms-selected { outline: 2px solid rgb(59,130,246); outline-offset: 2px; }
  \`;
  document.head.appendChild(style);

  document.addEventListener('mouseenter', function(e) {
    const block = e.target.closest('[data-block-id]');
    if (block && !block.classList.contains('astro-cms-selected')) {
      block.classList.add('astro-cms-hover');
    }
  }, true);

  document.addEventListener('mouseleave', function(e) {
    const block = e.target.closest('[data-block-id]');
    if (block) {
      block.classList.remove('astro-cms-hover');
    }
  }, true);

  var varStyle = document.createElement('style');
  varStyle.id = 'astro-cms-variables';
  document.head.appendChild(varStyle);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'astro-cms:variables-updated' && typeof e.data.css === 'string') {
      varStyle.textContent = e.data.css;
    }
  });

  const TEXT_TAGS = ['H1','H2','H3','H4','H5','H6','P','BLOCKQUOTE'];

  function getTextElement(target) {
    let el = target;
    while (el && el !== document.body) {
      if (TEXT_TAGS.indexOf(el.tagName) !== -1) return el;
      el = el.parentElement;
    }
    return null;
  }

  function getStyleSnapshot(el) {
    const cs = window.getComputedStyle(el);
    return {
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      color: cs.color,
      lineHeight: cs.lineHeight,
      textAlign: cs.textAlign,
      letterSpacing: cs.letterSpacing,
      textDecoration: cs.textDecoration,
      padding: cs.padding,
      margin: cs.margin
    };
  }

  document.addEventListener('click', function(e) {
    const block = e.target.closest('[data-block-id]');

    if (block) {
      e.preventDefault();
      e.stopPropagation();

      if (selectedEl) {
        selectedEl.classList.remove('astro-cms-selected');
      }

      block.classList.remove('astro-cms-hover');
      block.classList.add('astro-cms-selected');
      selectedEl = block;

      parent.postMessage({
        type: 'astro-cms:block-selected',
        blockId: block.getAttribute('data-block-id'),
        blockName: block.getAttribute('data-block-name'),
        blockPath: block.getAttribute('data-block-path')
      }, '*');
      return;
    }

    const textEl = getTextElement(e.target);
    if (!textEl) return;

    e.preventDefault();
    e.stopPropagation();

    if (selectedEl) {
      selectedEl.classList.remove('astro-cms-selected');
    }

    textEl.classList.add('astro-cms-selected');
    selectedEl = textEl;

    const rect = textEl.getBoundingClientRect();
    parent.postMessage({
      type: 'astro-cms:text-selected',
      tagName: textEl.tagName.toLowerCase(),
      textContent: textEl.textContent,
      innerHTML: textEl.innerHTML,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      computedStyles: getStyleSnapshot(textEl)
    }, '*');
  }, true);
})();
`.trim()
}
