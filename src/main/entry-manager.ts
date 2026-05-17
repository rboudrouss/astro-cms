import { readFile, writeFile, mkdir, unlink, access } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import type { CreateEntryResult } from '../shared/types'

const yamlEngine = {
  parse: (str: string): object => yaml.load(str, { schema: yaml.JSON_SCHEMA }) as object,
  stringify: (obj: object): string => yaml.dump(obj, { schema: yaml.JSON_SCHEMA }).trim()
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function createEntry(
  projectPath: string,
  collectionName: string,
  slug: string,
  frontmatter: Record<string, unknown>
): Promise<CreateEntryResult> {
  const collectionDir = join(projectPath, 'src', 'content', collectionName)
  const filePath = join(collectionDir, `${slug}.mdx`)

  if (await fileExists(filePath)) {
    return { status: 'error', message: `Entry "${slug}" already exists in collection "${collectionName}"` }
  }

  await mkdir(collectionDir, { recursive: true })

  const content = matter.stringify('\n', frontmatter, { engines: { yaml: yamlEngine } })
  await writeFile(filePath, content, 'utf-8')

  return {
    status: 'success',
    entry: {
      type: 'entry',
      name: slug,
      relativePath: `${slug}.mdx`,
      fullPath: filePath
    }
  }
}

export async function deleteEntry(filePath: string): Promise<void> {
  await unlink(filePath)
}

export async function updateEntryFrontmatter(
  filePath: string,
  frontmatter: Record<string, unknown>
): Promise<void> {
  const source = await readFile(filePath, 'utf-8')
  const { content } = matter(source, { engines: { yaml: yamlEngine } })
  const updated = matter.stringify('\n' + content, frontmatter, { engines: { yaml: yamlEngine } })
  await writeFile(filePath, updated, 'utf-8')
}
