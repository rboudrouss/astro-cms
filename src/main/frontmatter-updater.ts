import { parseMdx, writeMdx } from './mdx-parser'

export async function extractFrontmatter(source: string): Promise<Record<string, unknown>> {
  const ast = await parseMdx(source)
  return ast.frontmatter
}

export async function updateFrontmatter(
  source: string,
  fields: Record<string, unknown>
): Promise<string> {
  const ast = await parseMdx(source)
  ast.frontmatter = { ...ast.frontmatter, ...fields }
  return writeMdx(ast)
}
