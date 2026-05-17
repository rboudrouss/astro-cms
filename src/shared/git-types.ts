export type GitConfig = {
  workingBranch: string
  productionBranch: string
  remote: string
}

export const DEFAULT_GIT_CONFIG: GitConfig = {
  workingBranch: 'astro-cms-work',
  productionBranch: 'main',
  remote: 'origin'
}

export type GitWorkflowState = 'idle' | 'committing' | 'pushing' | 'error'

export type DivergenceInfo = {
  diverged: boolean
  ahead: number
  behind: number
}

export type GitWorkflowStatus = {
  state: GitWorkflowState
  currentBranch: string | null
  lastCommitHash: string | null
  lastCommitTime: string | null
  divergence: DivergenceInfo | null
  error: string | null
}
