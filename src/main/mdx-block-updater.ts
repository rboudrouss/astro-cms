import { parseMdx, writeMdx } from './mdx-parser'
import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxAttribute, MdxJsxAttributeValueExpression } from 'mdast-util-mdx-jsx'

function findBlock(nodes: Root['children'], blockName: string): MdxJsxFlowElement | null {
  for (const node of nodes) {
    if (node.type === 'mdxJsxFlowElement') {
      const jsx = node as MdxJsxFlowElement
      if (jsx.name === blockName) return jsx
      const nested = findBlock(jsx.children as Root['children'], blockName)
      if (nested) return nested
    }
  }
  return null
}

function readAttrValue(attr: MdxJsxAttribute): unknown {
  if (attr.value == null) return true
  if (typeof attr.value === 'string') return attr.value
  const raw = attr.value.value
  if (raw === 'true') return true
  if (raw === 'false') return false
  const num = Number(raw)
  if (!isNaN(num)) return num
  return raw
}

function makeAttr(name: string, value: unknown): MdxJsxAttribute {
  if (value === true) {
    return { type: 'mdxJsxAttribute', name, value: null }
  }
  if (typeof value === 'string') {
    return { type: 'mdxJsxAttribute', name, value }
  }
  return {
    type: 'mdxJsxAttribute',
    name,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: String(value),
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'Literal',
              value,
              raw: String(value)
            }
          }],
          comments: []
        }
      }
    } as MdxJsxAttributeValueExpression
  }
}

export async function extractBlockProps(
  source: string,
  blockName: string
): Promise<Record<string, unknown> | null> {
  const ast = await parseMdx(source)
  const block = findBlock(ast.body.children, blockName)
  if (!block) return null

  const props: Record<string, unknown> = {}
  for (const attr of block.attributes) {
    if (attr.type === 'mdxJsxAttribute') {
      props[attr.name] = readAttrValue(attr)
    }
  }
  return props
}

export async function updateBlockProps(
  source: string,
  blockName: string,
  props: Record<string, unknown>
): Promise<string> {
  const ast = await parseMdx(source)
  const block = findBlock(ast.body.children, blockName)
  if (!block) return source

  const newAttrs: MdxJsxAttribute[] = []
  for (const [name, value] of Object.entries(props)) {
    if (value === false || value === undefined || value === null) continue
    newAttrs.push(makeAttr(name, value))
  }
  block.attributes = newAttrs

  return writeMdx(ast)
}
