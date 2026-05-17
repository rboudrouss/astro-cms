import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'api', {
  value: {
    openProject: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    cloneProject: vi.fn().mockResolvedValue(null),
    newProject: vi.fn().mockResolvedValue(null),
    getRecentProjects: vi.fn().mockResolvedValue([]),
    getLocale: vi.fn().mockResolvedValue('fr'),
    validateProject: vi.fn().mockResolvedValue({ valid: true, projectPath: '', issues: [] }),
    onUpdateDownloaded: vi.fn().mockReturnValue(vi.fn()),
    installAndRestart: vi.fn().mockResolvedValue(undefined),
    getThemeManifest: vi.fn().mockResolvedValue(null),
    onThemeManifestUpdated: vi.fn().mockReturnValue(vi.fn())
  },
  writable: true,
  configurable: true
})
