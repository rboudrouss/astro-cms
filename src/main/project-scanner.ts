import { readdir, stat } from 'fs/promises'
import { join, parse } from 'path'
import type { PageNode, EntryNode, CollectionNode, ProjectTree } from '../shared/types'

const CONTENT_EXTENSIONS = new Set(['.md', '.mdx'])

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const s = await stat(dirPath)
    return s.isDirectory()
  } catch {
    return false
  }
}

async function scanPages(pagesDir: string): Promise<PageNode[]> {
  if (!(await dirExists(pagesDir))) return []

  const entries = await readdir(pagesDir, { withFileTypes: true })
  const pages: PageNode[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const parsed = parse(entry.name)
    if (!CONTENT_EXTENSIONS.has(parsed.ext)) continue

    pages.push({
      type: 'page',
      name: parsed.name,
      relativePath: entry.name,
      fullPath: join(pagesDir, entry.name)
    })
  }

  return pages.sort((a, b) => a.name.localeCompare(b.name))
}

async function scanCollection(collectionDir: string, collectionName: string): Promise<CollectionNode> {
  const entries: EntryNode[] = []
  const dirEntries = await readdir(collectionDir, { withFileTypes: true })

  for (const entry of dirEntries) {
    if (!entry.isFile()) continue
    const parsed = parse(entry.name)
    if (!CONTENT_EXTENSIONS.has(parsed.ext)) continue

    entries.push({
      type: 'entry',
      name: parsed.name,
      relativePath: entry.name,
      fullPath: join(collectionDir, entry.name)
    })
  }

  entries.sort((a, b) => a.name.localeCompare(b.name))

  return { type: 'collection', name: collectionName, entries }
}

async function scanCollections(contentDir: string): Promise<CollectionNode[]> {
  if (!(await dirExists(contentDir))) return []

  const entries = await readdir(contentDir, { withFileTypes: true })
  const collections: CollectionNode[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const collection = await scanCollection(join(contentDir, entry.name), entry.name)
    collections.push(collection)
  }

  return collections.sort((a, b) => a.name.localeCompare(b.name))
}

export async function scanProjectTree(projectPath: string): Promise<ProjectTree> {
  const pagesDir = join(projectPath, 'src', 'pages')
  const contentDir = join(projectPath, 'src', 'content')

  const [pages, collections] = await Promise.all([
    scanPages(pagesDir),
    scanCollections(contentDir)
  ])

  return { pages, collections }
}
