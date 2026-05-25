import '@testing-library/jest-dom/vitest'
import { DEFAULT_GIT_STATUS } from '../src/shared/git-types'

Object.defineProperty(window, 'api', {
  value: {
    openProject: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    cloneProject: vi.fn().mockResolvedValue(null),
    getTemplates: vi.fn().mockResolvedValue([]),
    selectDirectory: vi.fn().mockResolvedValue(null),
    newProject: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    getRecentProjects: vi.fn().mockResolvedValue([]),
    getLocale: vi.fn().mockResolvedValue('fr'),
    validateProject: vi.fn().mockResolvedValue({ valid: true, projectPath: '', issues: [] }),
    scanProject: vi.fn().mockResolvedValue({ pages: [], collections: [] }),
    watchProject: vi.fn().mockResolvedValue(undefined),
    unwatchProject: vi.fn().mockResolvedValue(undefined),
    onProjectTreeChanged: vi.fn().mockReturnValue(vi.fn()),
    onUpdateDownloaded: vi.fn().mockReturnValue(vi.fn()),
    installAndRestart: vi.fn().mockResolvedValue(undefined),
    checkDepsNeeded: vi.fn().mockResolvedValue({ needed: false }),
    installDeps: vi.fn().mockResolvedValue({ success: true, packageManager: 'npm' }),
    onDepsInstallOutput: vi.fn().mockReturnValue(vi.fn()),
    getThemeManifest: vi.fn().mockResolvedValue(null),
    onThemeManifestUpdated: vi.fn().mockReturnValue(vi.fn()),
    readPageContent: vi.fn().mockResolvedValue(''),
    writePageContent: vi.fn().mockResolvedValue(undefined),
    updateBlockProps: vi.fn().mockResolvedValue(''),
    getBlockProps: vi.fn().mockResolvedValue(null),
    startDevServer: vi.fn().mockResolvedValue(undefined),
    stopDevServer: vi.fn().mockResolvedValue(undefined),
    restartDevServer: vi.fn().mockResolvedValue(undefined),
    onDevServerStatusChanged: vi.fn().mockReturnValue(vi.fn()),
    onDevServerOutput: vi.fn().mockReturnValue(vi.fn()),
    initGitWorkflow: vi.fn().mockResolvedValue({
      ...DEFAULT_GIT_STATUS,
      currentBranch: 'astro-cms-work'
    }),
    gitAutoSave: vi.fn().mockResolvedValue(undefined),
    gitSave: vi.fn().mockResolvedValue(undefined),
    gitGetStatus: vi.fn().mockResolvedValue(null),
    onGitStatusChanged: vi.fn().mockReturnValue(vi.fn())
  },
  writable: true,
  configurable: true
})
