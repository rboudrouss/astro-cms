import { readFile, readdir, access } from 'fs/promises'
import { join, basename, resolve } from 'path'
import { Project, SyntaxKind, type PropertySignature, type ObjectLiteralExpression } from 'ts-morph'
import type {
  ThemeManifest,
  BlockManifest,
  LayoutManifest,
  PropSchema,
  PropType,
  CmsHints,
  SlotInfo,
  ThemeVariable
} from '../shared/types'

const THEME_MANIFEST_FILENAME = 'astro-cms.theme.ts'
const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/

function splitAstroFile(content: string): { frontmatter: string; template: string } {
  const match = content.match(FRONTMATTER_RE)
  if (!match) return { frontmatter: '', template: content }
  return {
    frontmatter: match[1],
    template: content.slice(match[0].length)
  }
}

function detectSlots(template: string): SlotInfo[] {
  const slots: SlotInfo[] = []
  const slotRe = /<slot\b([^/>]*?)\/?>|<slot\b([^>]*?)>/g
  let match: RegExpExecArray | null

  while ((match = slotRe.exec(template)) !== null) {
    const attrs = match[1] || match[2] || ''
    const nameMatch = attrs.match(/name\s*=\s*["']([^"']+)["']/)
    if (nameMatch) {
      slots.push({ name: nameMatch[1] })
    } else {
      const hasDefault = slots.some((s) => s.name === 'default')
      if (!hasDefault) {
        slots.push({ name: 'default' })
      }
    }
  }

  return slots
}

function tsTypeToSimple(typeText: string): PropType {
  const normalized = typeText
    .replace(/\s*\|\s*undefined/g, '')
    .replace(/undefined\s*\|\s*/g, '')
    .trim()
  if (normalized === 'string') return 'string'
  if (normalized === 'number') return 'number'
  if (normalized === 'boolean') return 'boolean'
  if (normalized.startsWith('{') || normalized === 'object' || normalized === 'Record')
    return 'object'
  return 'unknown'
}

function parseFrontmatter(frontmatter: string): { props: PropSchema[]; cmsHints: CmsHints } {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('component.ts', frontmatter)

  const propsInterface = sourceFile.getInterface('Props')
  const props: PropSchema[] = propsInterface
    ? propsInterface.getProperties().map((prop: PropertySignature) => {
        const schema: PropSchema = {
          name: prop.getName(),
          type: tsTypeToSimple(prop.getType().getText()),
          required: !prop.hasQuestionToken()
        }

        const jsDocs = prop.getJsDocs()
        if (jsDocs.length > 0) {
          const description = jsDocs[0].getDescription().trim()
          if (description) {
            schema.description = description
          }
        }

        return schema
      })
    : []

  let cmsHints: CmsHints = {}
  const cmsHintsVar = sourceFile.getVariableDeclaration('cmsHints')
  if (cmsHintsVar) {
    const initializer = cmsHintsVar.getInitializer()
    if (initializer && initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
      try {
        cmsHints = new Function(`return (${initializer.getText()})`)() as CmsHints
      } catch {
        /* invalid initializer */
      }
    }
  }

  return { props, cmsHints }
}

async function parseAstroComponent(
  filePath: string
): Promise<{
  props: PropSchema[]
  cmsHints: CmsHints
  slots: SlotInfo[]
}> {
  const content = await readFile(filePath, 'utf-8')
  const { frontmatter, template } = splitAstroFile(content)

  const { props, cmsHints } = frontmatter
    ? parseFrontmatter(frontmatter)
    : { props: [], cmsHints: {} }
  const slots = detectSlots(template)

  return { props, cmsHints, slots }
}

async function scanDirectory(dir: string): Promise<string[]> {
  try {
    await access(dir)
  } catch {
    return []
  }
  const entries = await readdir(dir)
  return entries.filter((f) => f.endsWith('.astro')).map((f) => join(dir, f))
}

function getStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  return obj
    .getProperty(name)
    ?.asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializer()
    ?.asKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue()
}

function parseThemeManifestFile(
  content: string
): { name: string; layoutsDir: string; blocksDir: string; variables: Record<string, ThemeVariable> } {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('theme.ts', content)

  const defaultExport = sourceFile.getExportAssignment((d) => !d.isExportEquals())
  if (!defaultExport) {
    throw new Error('Theme manifest must have a default export')
  }

  const callExpr = defaultExport.getExpression()
  if (!callExpr || callExpr.getKind() !== SyntaxKind.CallExpression) {
    throw new Error('Theme manifest default export must call defineTheme()')
  }

  const callExpression = callExpr.asKindOrThrow(SyntaxKind.CallExpression)
  const args = callExpression.getArguments()
  if (args.length === 0) {
    throw new Error('defineTheme() must have an argument')
  }

  const configObj = args[0]
  if (configObj.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    throw new Error('defineTheme() argument must be an object literal')
  }

  const objLiteral = configObj.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  const name = getStringProp(objLiteral, 'name')
  if (!name) throw new Error('Theme manifest must declare a name')

  const layoutsDir = getStringProp(objLiteral, 'layoutsDir') ?? './layouts'
  const blocksDir = getStringProp(objLiteral, 'blocksDir') ?? './blocks'

  let variables: Record<string, ThemeVariable> = {}
  const variablesProp = objLiteral.getProperty('variables')
  if (variablesProp) {
    const init = variablesProp
      .asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getInitializer()
    if (init) {
      try {
        variables = new Function(`return (${init.getText()})`)() as Record<string, ThemeVariable>
      } catch {
        variables = {}
      }
    }
  }

  return { name, layoutsDir, blocksDir, variables }
}

export async function parseThemeManifest(themeDir: string): Promise<ThemeManifest> {
  const manifestPath = join(themeDir, THEME_MANIFEST_FILENAME)
  const manifestContent = await readFile(manifestPath, 'utf-8')
  const { name, layoutsDir, blocksDir, variables } = parseThemeManifestFile(manifestContent)

  const resolvedBlocksDir = resolve(themeDir, blocksDir)
  const resolvedLayoutsDir = resolve(themeDir, layoutsDir)

  const blockFiles = await scanDirectory(resolvedBlocksDir)
  const layoutFiles = await scanDirectory(resolvedLayoutsDir)

  const blocks: BlockManifest[] = await Promise.all(
    blockFiles.map(async (filePath) => {
      const componentName = basename(filePath, '.astro')
      const { props, cmsHints, slots } = await parseAstroComponent(filePath)
      return {
        name: componentName,
        label: componentName,
        filePath,
        props,
        cmsHints,
        slots,
        isCompositional: slots.length > 0
      }
    })
  )

  const layouts: LayoutManifest[] = await Promise.all(
    layoutFiles.map(async (filePath) => {
      const componentName = basename(filePath, '.astro')
      const { props, cmsHints, slots } = await parseAstroComponent(filePath)
      return {
        name: componentName,
        label: componentName,
        filePath,
        props,
        cmsHints,
        slots
      }
    })
  )

  return {
    name,
    blocks: blocks.sort((a, b) => a.name.localeCompare(b.name)),
    layouts: layouts.sort((a, b) => a.name.localeCompare(b.name)),
    variables
  }
}
