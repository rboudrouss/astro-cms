import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { RecentProject } from '../shared/ipc'

const MAX_RECENT = 10

export class RecentProjectsStore {
  private filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async load(): Promise<RecentProject[]> {
    try {
      const data = await readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  async add(project: { path: string; name: string }): Promise<RecentProject[]> {
    const projects = await this.load()
    const now = new Date().toISOString()
    const filtered = projects.filter((p) => p.path !== project.path)
    const updated = [{ path: project.path, name: project.name, lastOpened: now }, ...filtered].slice(
      0,
      MAX_RECENT
    )
    await mkdir(dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(updated, null, 2))
    return updated
  }
}
