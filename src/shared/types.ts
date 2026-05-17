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
