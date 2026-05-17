import { readFile, access } from 'fs/promises'
import { join, basename } from 'path'
import type { ValidationResult } from '../shared/types'

const CONFIG_FILENAME = 'astro-cms.config.ts'
const THEME_FILENAME = 'astro-cms.theme.ts'

const THEME_IMPORT_RE = /import\s+\w+\s+from\s+['"](\.[^'"]*astro-cms\.theme)['"]/

const THEME_NAME_RE = /name\s*:\s*['"]([^'"]+)['"]/

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function extractThemeImportPath(configContent: string): string | null {
  const match = configContent.match(THEME_IMPORT_RE)
  if (!match) return null
  let importPath = match[1]
  if (!importPath.endsWith('.ts')) importPath += '.ts'
  return importPath
}

function extractThemeName(themeContent: string): string | null {
  const match = themeContent.match(THEME_NAME_RE)
  return match?.[1] ?? null
}

export async function validateProject(dirPath: string): Promise<ValidationResult> {
  const configPath = join(dirPath, CONFIG_FILENAME)
  if (!(await fileExists(configPath))) {
    return {
      valid: false,
      errors: [
        {
          code: 'CONFIG_MISSING',
          message: `Le fichier ${CONFIG_FILENAME} est introuvable à la racine du projet.`
        }
      ]
    }
  }

  const configContent = await readFile(configPath, 'utf-8')
  const themeImportPath = extractThemeImportPath(configContent)

  if (!themeImportPath) {
    return {
      valid: false,
      errors: [
        {
          code: 'THEME_NOT_DECLARED',
          message: `Aucun import de thème trouvé dans ${CONFIG_FILENAME}. Le fichier doit importer un fichier ${THEME_FILENAME}.`
        }
      ]
    }
  }

  const resolvedThemePath = join(dirPath, themeImportPath)
  if (!(await fileExists(resolvedThemePath))) {
    return {
      valid: false,
      errors: [
        {
          code: 'THEME_NOT_FOUND',
          message: `Le fichier thème ${themeImportPath} référencé dans ${CONFIG_FILENAME} est introuvable.`
        }
      ]
    }
  }

  const themeContent = await readFile(resolvedThemePath, 'utf-8')
  const themeName = extractThemeName(themeContent)

  if (!themeName) {
    return {
      valid: false,
      errors: [
        {
          code: 'THEME_NAME_MISSING',
          message: `Le fichier thème ne déclare pas de champ "name" dans defineTheme().`
        }
      ]
    }
  }

  return {
    valid: true,
    project: {
      name: basename(dirPath),
      path: dirPath,
      themeName
    }
  }
}
