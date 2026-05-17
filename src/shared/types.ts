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
