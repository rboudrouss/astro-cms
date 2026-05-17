import { watch, type FSWatcher } from 'fs'
import { join } from 'path'
import { stat } from 'fs/promises'

export class ProjectWatcher {
  private watchers: FSWatcher[] = []
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private readonly projectPath: string
  private readonly onChange: () => void

  constructor(projectPath: string, onChange: () => void) {
    this.projectPath = projectPath
    this.onChange = onChange
  }

  start(): void {
    const dirs = [
      join(this.projectPath, 'src', 'pages'),
      join(this.projectPath, 'src', 'content')
    ]

    for (const dir of dirs) {
      this.watchDir(dir)
    }
  }

  stop(): void {
    for (const w of this.watchers) {
      w.close()
    }
    this.watchers = []
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  private async watchDir(dirPath: string): Promise<void> {
    try {
      const s = await stat(dirPath)
      if (!s.isDirectory()) return
      const w = watch(dirPath, { recursive: true }, () => {
        this.scheduleChange()
      })
      this.watchers.push(w)
    } catch {
      // Directory may not exist yet
    }
  }

  private scheduleChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.onChange()
    }, 100)
  }
}
