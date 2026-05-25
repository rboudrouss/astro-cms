import { readdir, stat, copyFile, mkdir } from 'fs/promises'
import type { Dirent } from 'fs'
import { join, extname, basename } from 'path'
import type { AssetInfo } from '../shared/types'

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']

const IMAGE_EXTENSION_SET = new Set(IMAGE_EXTENSIONS.map((e) => `.${e}`))

export async function scanAssets(uploadsDir: string): Promise<AssetInfo[]> {
  let entries: Dirent[]
  try {
    entries = await readdir(uploadsDir, { withFileTypes: true, encoding: 'utf-8' })
  } catch {
    return []
  }

  const assets: AssetInfo[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const name = String(entry.name)
    if (!IMAGE_EXTENSION_SET.has(extname(name).toLowerCase())) continue

    const fullPath = join(uploadsDir, name)
    const stats = await stat(fullPath)

    assets.push({
      name,
      relativePath: name,
      fullPath,
      size: stats.size
    })
  }

  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

export async function uploadAsset(sourcePath: string, uploadsDir: string): Promise<string> {
  await mkdir(uploadsDir, { recursive: true })

  const originalName = basename(sourcePath)
  const ext = extname(originalName)
  const stem = originalName.slice(0, -ext.length)

  let targetName = originalName
  let suffix = 0

  while (await fileExists(join(uploadsDir, targetName))) {
    suffix++
    targetName = `${stem}-${suffix}${ext}`
  }

  await copyFile(sourcePath, join(uploadsDir, targetName))
  return targetName
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
