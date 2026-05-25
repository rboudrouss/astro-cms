import { writeFile, rename, unlink, readdir, readFile, mkdir, access } from 'fs/promises'
import { join, dirname, relative, parse } from 'path'
import { VALID_SLUG, type CreatePageOptions, type CreatePageResult, type InternalLinkReference } from '../shared/types'

function validateSlug(slug: string): string | null {
  if (!slug) return 'Slug cannot be empty'
  if (!VALID_SLUG.test(slug)) return 'Slug must contain only lowercase letters, numbers, and hyphens'
  return null
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function createPage(options: CreatePageOptions): Promise<CreatePageResult> {
  const { projectPath, directory, slug, layoutPath } = options

  const slugError = validateSlug(slug)
  if (slugError) return { success: false, error: slugError }

  const pagesDir = join(projectPath, 'src', 'pages')
  const targetDir = directory ? join(pagesDir, directory) : pagesDir
  const filePath = join(targetDir, `${slug}.mdx`)

  if (await fileExists(filePath)) {
    return { success: false, error: `File already exists: ${slug}.mdx` }
  }

  await mkdir(targetDir, { recursive: true })

  const relativeLayoutPath = relative(targetDir, layoutPath)
  const normalizedLayoutPath = relativeLayoutPath.startsWith('.')
    ? relativeLayoutPath
    : `./${relativeLayoutPath}`

  const content = `---\nlayout: ${normalizedLayoutPath}\ntitle: ""\n---\n`

  await writeFile(filePath, content, 'utf-8')

  return { success: true, filePath }
}

export async function renamePage(filePath: string, newSlug: string): Promise<string> {
  const slugError = validateSlug(newSlug)
  if (slugError) throw new Error(slugError)

  const dir = dirname(filePath)
  const newPath = join(dir, `${newSlug}.mdx`)

  if (await fileExists(newPath)) {
    throw new Error(`File already exists: ${newSlug}.mdx`)
  }

  await rename(filePath, newPath)
  return newPath
}

export async function deletePage(filePath: string): Promise<void> {
  await unlink(filePath)
}

const CONTENT_EXTENSIONS = new Set(['.md', '.mdx'])

async function collectFiles(dir: string): Promise<string[]> {
  const result: string[] = []

  let dirEntries
  try {
    dirEntries = await readdir(dir, { withFileTypes: true })
  } catch {
    return result
  }

  for (const entry of dirEntries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...(await collectFiles(fullPath)))
    } else if (entry.isFile() && CONTENT_EXTENSIONS.has(parse(entry.name).ext)) {
      result.push(fullPath)
    }
  }

  return result
}

export async function findInternalLinks(
  projectPath: string,
  slug: string
): Promise<InternalLinkReference[]> {
  const pagesDir = join(projectPath, 'src', 'pages')
  const files = await collectFiles(pagesDir)
  const results: InternalLinkReference[] = []

  const pattern = new RegExp(`(\\(|href=["'])/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/"')#\\s]|$)`)

  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({ filePath: file, line: i + 1, content: lines[i].trim() })
      }
    }
  }

  return results
}

async function collectDirectories(baseDir: string, current: string): Promise<string[]> {
  const result: string[] = []
  const fullPath = current ? join(baseDir, current) : baseDir

  let dirEntries
  try {
    dirEntries = await readdir(fullPath, { withFileTypes: true })
  } catch {
    return result
  }

  for (const entry of dirEntries) {
    if (!entry.isDirectory()) continue
    const rel = current ? `${current}/${entry.name}` : entry.name
    result.push(rel)
    result.push(...(await collectDirectories(baseDir, rel)))
  }

  return result
}

export async function listPageDirectories(projectPath: string): Promise<string[]> {
  const pagesDir = join(projectPath, 'src', 'pages')
  const subdirs = await collectDirectories(pagesDir, '')
  return ['', ...subdirs.sort()]
}
