import type { Root } from 'mdast'

export type ContentAST = {
  frontmatter: Record<string, unknown>
  body: Root
}

export type ValidationError = {
  code: 'CONFIG_MISSING' | 'THEME_NOT_DECLARED' | 'THEME_NOT_FOUND' | 'THEME_NAME_MISSING'
  message: string
}

export type ProjectInfo = {
  name: string
  path: string
  themeName: string
}

export type ValidationResult =
  | { valid: true; project: ProjectInfo }
  | { valid: false; errors: ValidationError[] }

export type OpenProjectResult =
  | { status: 'cancelled' }
  | { status: 'valid'; project: ProjectInfo }
  | { status: 'invalid'; errors: ValidationError[] }

export type TemplateInfo = {
  id: string
  name: string
  description: string
  themeName: string
}

export type NewProjectOptions = {
  templateId: string
  projectName: string
  parentDir: string
  initGit: boolean
}

export type NewProjectResult =
  | { status: 'success'; project: ProjectInfo }
  | { status: 'error'; message: string }
  | { status: 'cancelled' }

export type PackageManager = 'pnpm' | 'npm' | 'yarn'

export type DepsCheckResult =
  | { needed: false }
  | { needed: true; packageManager: PackageManager }

export type DepsInstallResult =
  | { success: true; packageManager: PackageManager }
  | { success: false; error: string; packageManager: PackageManager }

export type PropType = 'string' | 'number' | 'boolean' | 'object' | 'unknown'

export type PropSchema = {
  name: string
  type: PropType
  required: boolean
  description?: string
  default?: unknown
}

export type CmsHints = Record<string, { format?: string; [key: string]: unknown }>

export type SlotInfo = {
  name: string
}

export type BlockManifest = {
  name: string
  label: string
  filePath: string
  props: PropSchema[]
  cmsHints: CmsHints
  slots: SlotInfo[]
  isCompositional: boolean
}

export type LayoutManifest = {
  name: string
  label: string
  filePath: string
  props: PropSchema[]
  cmsHints: CmsHints
  slots: SlotInfo[]
}

export type ThemeVariable = {
  type: string
  default: unknown
}

export type ThemeManifest = {
  name: string
  blocks: BlockManifest[]
  layouts: LayoutManifest[]
  variables: Record<string, ThemeVariable>
}

export type PageNode = {
  type: 'page'
  name: string
  relativePath: string
  fullPath: string
}

export type EntryNode = {
  type: 'entry'
  name: string
  relativePath: string
  fullPath: string
}

export type CollectionNode = {
  type: 'collection'
  name: string
  entries: EntryNode[]
}

export type ProjectTree = {
  pages: PageNode[]
  collections: CollectionNode[]
}

export type SidebarItem =
  | PageNode
  | EntryNode

export type BlockSelection = {
  blockId: string
  blockName: string
  blockPath: string
}

export type BlockSelectionMessage = BlockSelection & {
  type: 'astro-cms:block-selected'
}

export type DevServerState = 'starting' | 'running' | 'error' | 'stopped'

export type DevServerStatus = {
  state: DevServerState
  url?: string
  port?: number
  error?: string
}

export const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type CreatePageOptions = {
  projectPath: string
  directory: string
  slug: string
  layoutPath: string
}

export type CreatePageResult =
  | { success: true; filePath: string }
  | { success: false; error: string }

export type InternalLinkReference = {
  filePath: string
  line: number
  content: string
}
