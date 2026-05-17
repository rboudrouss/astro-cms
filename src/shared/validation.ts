export type ValidationSeverity = 'error' | 'warning'

export type ValidationIssue = {
  severity: ValidationSeverity
  code: string
  message: string
  path?: string
}

export type ValidationReport = {
  valid: boolean
  projectPath: string
  issues: ValidationIssue[]
}
