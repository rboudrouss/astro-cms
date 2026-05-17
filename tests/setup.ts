import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'api', {
  value: {
    openProject: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    cloneProject: vi.fn().mockResolvedValue(null),
    newProject: vi.fn().mockResolvedValue(null),
    getRecentProjects: vi.fn().mockResolvedValue([]),
    getLocale: vi.fn().mockResolvedValue('fr'),
    validateProject: vi.fn().mockResolvedValue({ valid: true, projectPath: '', issues: [] }),
    scanProject: vi.fn().mockResolvedValue({ pages: [], collections: [] }),
    watchProject: vi.fn().mockResolvedValue(undefined),
    unwatchProject: vi.fn().mockResolvedValue(undefined),
    onProjectTreeChanged: vi.fn().mockReturnValue(vi.fn()),
    onUpdateDownloaded: vi.fn().mockReturnValue(vi.fn()),
    installAndRestart: vi.fn().mockResolvedValue(undefined)
  },
  writable: true,
  configurable: true
})
