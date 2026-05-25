import simpleGit from 'simple-git'
import type { GitOps } from './git-ops'

export function createSimpleGitOps(projectPath: string): GitOps {
  const git = simpleGit(projectPath)

  return {
    async init() {
      await git.init()
    },

    async branchLocal() {
      const summary = await git.branchLocal()
      return summary.all
    },

    async currentBranch() {
      const summary = await git.branchLocal()
      return summary.current
    },

    async checkout(branch) {
      await git.checkout(branch)
    },

    async checkoutNewBranch(branch) {
      await git.checkoutLocalBranch(branch)
    },

    async add(files) {
      await git.add(files)
    },

    async commit(message) {
      const result = await git.commit(message, undefined, {
        '--author': 'astro-cms <astro-cms@local>'
      })
      return result.commit
    },

    async status() {
      const st = await git.status()
      return {
        isClean: st.isClean(),
        files: st.files.map((f) => f.path)
      }
    },

    async push(remote, branch) {
      await git.push(remote, branch)
    },

    async fetch(remote) {
      await git.fetch(remote)
    },

    async revParse(ref) {
      return git.revparse([ref])
    },

    async log(maxCount, ref?) {
      const opts: Record<string, unknown> = { maxCount }
      if (ref) {
        opts[ref] = null
      }
      const result = await git.log(opts)
      return result.all.map((e) => ({
        hash: e.hash,
        date: e.date,
        message: e.message
      }))
    }
  }
}
