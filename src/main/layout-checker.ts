import { dirname, relative } from 'path'
import { parseMdx, writeMdx } from './mdx-parser'

export { extractLayoutFromSource, isLayoutFromTheme } from '../shared/layout-utils'

export function computeLayoutRef(pageFilePath: string, layoutAbsPath: string): string {
  const pageDir = dirname(pageFilePath)
  return relative(pageDir, layoutAbsPath)
}

export async function updatePageLayout(source: string, newLayoutRef: string): Promise<string> {
  const ast = await parseMdx(source)
  ast.frontmatter.layout = newLayoutRef
  return writeMdx(ast)
}
