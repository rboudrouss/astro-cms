import matter from 'gray-matter'
import yaml from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkMdx from 'remark-mdx'
import type { Root, Heading, Paragraph, Blockquote, PhrasingContent } from 'mdast'

export type TextNodeInfo = {
  index: number
  type: 'heading' | 'paragraph' | 'blockquote'
  depth?: number
  content: string
  textContent: string
  position: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
}

const yamlEngine = {
  parse: (str: string): object => yaml.load(str, { schema: yaml.JSON_SCHEMA }) as object,
  stringify: (obj: object): string => yaml.dump(obj, { schema: yaml.JSON_SCHEMA }).trim()
}

const parser = unified().use(remarkParse).use(remarkMdx)
const serializer = unified()
  .use(remarkStringify, { bullet: '-', rule: '-' })
  .use(remarkMdx)

function extractPlainText(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.value
      if ('children' in n) return extractPlainText(n.children as PhrasingContent[])
      return ''
    })
    .join('')
}

function serializeNode(node: Heading | Paragraph | Blockquote): string {
  const tree: Root = { type: 'root', children: [node] }
  return serializer.stringify(tree).trimEnd()
}

export async function extractTextNodes(source: string): Promise<TextNodeInfo[]> {
  const { content } = matter(source, { engines: { yaml: yamlEngine } })
  const body = parser.parse(content)
  const nodes: TextNodeInfo[] = []
  let index = 0

  for (const node of body.children) {
    if (node.type === 'heading') {
      const heading = node as Heading
      nodes.push({
        index: index++,
        type: 'heading',
        depth: heading.depth,
        content: serializeNode(heading),
        textContent: extractPlainText(heading.children),
        position: node.position! as TextNodeInfo['position']
      })
    } else if (node.type === 'paragraph') {
      const para = node as Paragraph
      nodes.push({
        index: index++,
        type: 'paragraph',
        content: serializeNode(para),
        textContent: extractPlainText(para.children),
        position: node.position! as TextNodeInfo['position']
      })
    } else if (node.type === 'blockquote') {
      const bq = node as Blockquote
      const innerText = bq.children
        .filter((c): c is Paragraph => c.type === 'paragraph')
        .map((p) => extractPlainText(p.children))
        .join('\n')
      nodes.push({
        index: index++,
        type: 'blockquote',
        content: serializeNode(bq),
        textContent: innerText,
        position: node.position! as TextNodeInfo['position']
      })
    }
  }

  return nodes
}

export async function updateTextContent(
  source: string,
  nodeIndex: number,
  newMarkdown: string
): Promise<string> {
  const { content } = matter(source, { engines: { yaml: yamlEngine } })
  const nodes = await extractTextNodes(source)
  const target = nodes.find((n) => n.index === nodeIndex)
  if (!target) return source

  const contentStart = source.length - content.length
  const start = contentStart + target.position.start.offset
  const end = contentStart + target.position.end.offset

  return source.slice(0, start) + newMarkdown + source.slice(end)
}
