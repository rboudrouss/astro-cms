import { watch, type FSWatcher } from 'chokidar'
import { resolve, dirname } from 'path'
import { readFile } from 'fs/promises'
import { parseThemeManifest } from './theme-manifest-parser'
import type { ThemeManifest } from '../shared/types'

const THEME_IMPORT_RE = /import\s+\w+\s+from\s+['"](\.[^'"]*astro-cms\.theme)['"]/

async function resolveThemeDir(projectPath: string): Promise<string | null> {
  try {
    const configContent = await readFile(resolve(projectPath, 'astro-cms.config.ts'), 'utf-8')
    const match = configContent.match(THEME_IMPORT_RE)
    if (!match) return null
    let importPath = match[1]
    if (!importPath.endsWith('.ts')) importPath += '.ts'
    return dirname(resolve(projectPath, importPath))
  } catch {
    return null
  }
}

export class ThemeHotReloader {
  private watcher: FSWatcher | null = null
  private projectPath: string
  private themeDir: string | null = null
  private onUpdate: (manifest: ThemeManifest) => void

  constructor(projectPath: string, onUpdate: (manifest: ThemeManifest) => void) {
    this.projectPath = projectPath
    this.onUpdate = onUpdate
  }

  async start(): Promise<ThemeManifest | null> {
    this.themeDir = await resolveThemeDir(this.projectPath)
    if (!this.themeDir) return null

    const manifest = await parseThemeManifest(this.themeDir)

    this.watcher = watch(this.themeDir, {
      ignoreInitial: true,
      ignored: /(^|[/\\])\../,
      usePolling: false
    })

    await new Promise<void>((resolve) => {
      this.watcher!.on('ready', () => resolve())
    })

    this.watcher.on('change', () => this.rebuild())
    this.watcher.on('add', () => this.rebuild())
    this.watcher.on('unlink', () => this.rebuild())

    return manifest
  }

  private async rebuild(): Promise<void> {
    if (!this.themeDir) return
    try {
      const manifest = await parseThemeManifest(this.themeDir)
      this.onUpdate(manifest)
    } catch {
      // Theme in invalid state during edit — ignore until next save
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
  }
}
