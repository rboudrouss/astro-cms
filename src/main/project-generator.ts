import { mkdir, writeFile, access } from 'fs/promises'
import { join, dirname } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { NewProjectOptions, NewProjectResult } from '../shared/types'
import { getTemplateDefinition } from './templates'

const execFileAsync = promisify(execFile)

export async function generateProject(options: NewProjectOptions): Promise<NewProjectResult> {
  const { templateId, projectName, parentDir, initGit } = options

  const template = getTemplateDefinition(templateId)
  if (!template) {
    return { status: 'error', message: `Template inconnu : "${templateId}"` }
  }

  const projectDir = join(parentDir, projectName)

  try {
    await access(projectDir)
    return { status: 'error', message: `Le dossier "${projectName}" existe déjà dans ${parentDir}` }
  } catch {
    // Directory doesn't exist — good
  }

  const files = template.files(projectName, template.themeName)

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(projectDir, relativePath)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, content, 'utf-8')
  }

  if (initGit) {
    try {
      await execFileAsync('git', ['init'], { cwd: projectDir })
      await execFileAsync('git', ['add', '.'], { cwd: projectDir })
      await execFileAsync('git', ['commit', '-m', 'Initial commit from astro-cms'], {
        cwd: projectDir,
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: 'astro-cms',
          GIT_AUTHOR_EMAIL: 'astro-cms@local',
          GIT_COMMITTER_NAME: 'astro-cms',
          GIT_COMMITTER_EMAIL: 'astro-cms@local'
        }
      })
    } catch {
      // Git init is best-effort — project is still usable without it
    }
  }

  return {
    status: 'success',
    project: {
      name: projectName,
      path: projectDir,
      themeName: template.themeName
    }
  }
}
