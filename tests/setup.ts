import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'api', {
  value: {
    openProject: vi.fn().mockResolvedValue(null),
    cloneProject: vi.fn().mockResolvedValue(null),
    newProject: vi.fn().mockResolvedValue(null),
    getRecentProjects: vi.fn().mockResolvedValue([])
  }
})
