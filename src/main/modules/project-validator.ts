import { access, readFile, stat } from 'fs/promises'
import { join } from 'path'
import type { ValidationIssue, ValidationReport } from '../../shared/validation'

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    const s = await stat(p)
    return s.isDirectory()
  } catch {
    return false
  }
}

export async function validateProject(projectPath: string): Promise<ValidationReport> {
  const issues: ValidationIssue[] = []

  if (!(await exists(projectPath))) {
    return {
      valid: false,
      projectPath,
      issues: [
        { severity: 'error', code: 'PATH_NOT_FOUND', message: 'Path does not exist', path: projectPath }
      ]
    }
  }

  if (!(await isDirectory(projectPath))) {
    return {
      valid: false,
      projectPath,
      issues: [
        {
          severity: 'error',
          code: 'PATH_NOT_DIRECTORY',
          message: 'Path is not a directory',
          path: projectPath
        }
      ]
    }
  }

  const configPath = join(projectPath, 'astro-cms.config.ts')
  if (!(await exists(configPath))) {
    issues.push({
      severity: 'error',
      code: 'CONFIG_MISSING',
      message: 'astro-cms.config.ts not found at project root',
      path: configPath
    })
  }

  const pkgPath = join(projectPath, 'package.json')
  if (!(await exists(pkgPath))) {
    issues.push({
      severity: 'error',
      code: 'PACKAGE_JSON_MISSING',
      message: 'package.json not found at project root',
      path: pkgPath
    })
  } else {
    let pkg: Record<string, unknown>
    try {
      const raw = await readFile(pkgPath, 'utf-8')
      pkg = JSON.parse(raw) as Record<string, unknown>
    } catch {
      issues.push({
        severity: 'error',
        code: 'PACKAGE_JSON_INVALID',
        message: 'package.json is not valid JSON',
        path: pkgPath
      })
      return { valid: false, projectPath, issues }
    }

    const deps = (pkg.dependencies ?? {}) as Record<string, string>
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>
    if (!deps['astro'] && !devDeps['astro']) {
      issues.push({
        severity: 'error',
        code: 'ASTRO_NOT_DEPENDENCY',
        message: 'astro is not listed in dependencies or devDependencies',
        path: pkgPath
      })
    }
  }

  const srcDir = join(projectPath, 'src')
  if (!(await isDirectory(srcDir))) {
    issues.push({
      severity: 'error',
      code: 'SRC_DIR_MISSING',
      message: 'src/ directory not found',
      path: srcDir
    })
  } else {
    const optionalSubdirs = ['pages', 'content', 'themes'] as const
    for (const name of optionalSubdirs) {
      const dirPath = join(srcDir, name)
      if (!(await isDirectory(dirPath))) {
        issues.push({
          severity: 'warning',
          code: `${name.toUpperCase()}_DIR_MISSING`,
          message: `src/${name}/ directory not found`,
          path: dirPath
        })
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error')
  return { valid: !hasErrors, projectPath, issues }
}
