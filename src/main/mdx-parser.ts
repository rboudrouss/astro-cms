import matter from 'gray-matter'
import yaml from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkMdx from 'remark-mdx'
import type { ContentAST } from '../shared/types'

const yamlEngine = {
  parse: (str: string): object => yaml.load(str, { schema: yaml.JSON_SCHEMA }) as object,
  stringify: (obj: object): string => yaml.dump(obj, { schema: yaml.JSON_SCHEMA }).trim()
}

const parser = unified().use(remarkParse).use(remarkMdx)
const serializer = unified()
  .use(remarkStringify, { bullet: '-', rule: '-' })
  .use(remarkMdx)

export async function parseMdx(source: string): Promise<ContentAST> {
  const { data, content } = matter(source, { engines: { yaml: yamlEngine } })
  const body = parser.parse(content)
  return { frontmatter: data, body }
}

export async function writeMdx(ast: ContentAST): Promise<string> {
  const body = serializer.stringify(ast.body)
  const hasFrontmatter = Object.keys(ast.frontmatter).length > 0
  if (!hasFrontmatter) {
    return body
  }
  return matter.stringify('\n' + body, ast.frontmatter, { engines: { yaml: yamlEngine } })
}
