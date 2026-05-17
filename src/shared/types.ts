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
