import { parseMdx, writeMdx } from './mdx-parser'
import type { Root } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxAttribute, MdxJsxAttributeValueExpression } from 'mdast-util-mdx-jsx'

export type BlockInstance = {
  id: string
  blockName: string
  props: Record<string, unknown>
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

function collectJsxIndices(children: Root['children']): number[] {
  const indices: number[] = []
  for (let i = 0; i < children.length; i++) {
    if (children[i].type === 'mdxJsxFlowElement') {
      indices.push(i)
    }
  }
  return indices
}

export async function extractBlocks(source: string): Promise<BlockInstance[]> {
  const ast = await parseMdx(source)
  const blocks: BlockInstance[] = []
  let idx = 0
  for (const node of ast.body.children) {
    if (node.type === 'mdxJsxFlowElement') {
      const jsx = node as MdxJsxFlowElement
      const props: Record<string, unknown> = {}
      for (const attr of jsx.attributes) {
        if (attr.type === 'mdxJsxAttribute') {
          props[attr.name] = readAttrValue(attr)
        }
      }
      blocks.push({ id: `block-${idx}`, blockName: jsx.name ?? '', props })
      idx++
    }
  }
  return blocks
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
            expression: { type: 'Literal', value, raw: String(value) }
          }],
          comments: []
        }
      }
    } as MdxJsxAttributeValueExpression
  }
}

function buildJsxNode(blockName: string, props: Record<string, unknown>): MdxJsxFlowElement {
  const attributes: MdxJsxAttribute[] = []
  for (const [name, value] of Object.entries(props)) {
    if (value === false || value === undefined || value === null) continue
    attributes.push(makeAttr(name, value))
  }
  return {
    type: 'mdxJsxFlowElement',
    name: blockName,
    attributes,
    children: []
  } as MdxJsxFlowElement
}

export async function insertBlockMdx(
  source: string,
  blockName: string,
  props: Record<string, unknown>,
  position: number
): Promise<string> {
  const ast = await parseMdx(source)
  const jsxIndices = collectJsxIndices(ast.body.children)
  const newNode = buildJsxNode(blockName, props)

  let insertAt: number
  if (jsxIndices.length === 0 || position >= jsxIndices.length) {
    insertAt = ast.body.children.length
  } else {
    insertAt = jsxIndices[Math.min(position, jsxIndices.length - 1)]
  }

  ast.body.children.splice(insertAt, 0, newNode as unknown as Root['children'][number])
  return writeMdx(ast)
}

export async function deleteBlockMdx(source: string, blockIndex: number): Promise<string> {
  const ast = await parseMdx(source)
  const jsxIndices = collectJsxIndices(ast.body.children)
  if (blockIndex < 0 || blockIndex >= jsxIndices.length) return source

  ast.body.children.splice(jsxIndices[blockIndex], 1)
  return writeMdx(ast)
}

export async function reorderBlockMdx(
  source: string,
  fromIndex: number,
  toIndex: number
): Promise<string> {
  if (fromIndex === toIndex) return source
  const ast = await parseMdx(source)
  const jsxIndices = collectJsxIndices(ast.body.children)
  if (fromIndex < 0 || fromIndex >= jsxIndices.length) return source
  if (toIndex < 0 || toIndex >= jsxIndices.length) return source

  const fromAstIdx = jsxIndices[fromIndex]
  const toAstIdx = jsxIndices[toIndex]

  const [movedNode] = ast.body.children.splice(fromAstIdx, 1)
  const adjustedTo = fromAstIdx < toAstIdx ? toAstIdx - 1 : toAstIdx
  const insertAfter = fromIndex < toIndex
  ast.body.children.splice(insertAfter ? adjustedTo + 1 : adjustedTo, 0, movedNode)

  return writeMdx(ast)
}
