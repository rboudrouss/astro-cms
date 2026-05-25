import '@testing-library/jest-dom/vitest'
import { DEFAULT_GIT_STATUS } from '../src/shared/git-types'

// ProseMirror / TipTap needs DOM measurement APIs that jsdom doesn't implement
Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as DOMRectList
Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) })
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}

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
    getPageBlocks: vi.fn().mockResolvedValue([]),
    insertBlock: vi.fn().mockResolvedValue(''),
    deleteBlock: vi.fn().mockResolvedValue(''),
    reorderBlocks: vi.fn().mockResolvedValue(''),
    getTextNodes: vi.fn().mockResolvedValue([]),
    updateTextContent: vi.fn().mockResolvedValue(''),
    saveInlineEdit: vi.fn().mockResolvedValue(''),
    getPageFrontmatter: vi.fn().mockResolvedValue({}),
    updatePageFrontmatter: vi.fn().mockResolvedValue(''),
    startDevServer: vi.fn().mockResolvedValue(undefined),
    stopDevServer: vi.fn().mockResolvedValue(undefined),
    restartDevServer: vi.fn().mockResolvedValue(undefined),
    onDevServerStatusChanged: vi.fn().mockReturnValue(vi.fn()),
    onDevServerOutput: vi.fn().mockReturnValue(vi.fn()),
    getVariableOverrides: vi.fn().mockResolvedValue({}),
    setVariableOverrides: vi.fn().mockResolvedValue(undefined),
    getPageVariableOverrides: vi.fn().mockResolvedValue({}),
    setPageVariableOverrides: vi.fn().mockResolvedValue(undefined),
    initGitWorkflow: vi.fn().mockResolvedValue({
      ...DEFAULT_GIT_STATUS,
      currentBranch: 'astro-cms-work'
    }),
    gitAutoSave: vi.fn().mockResolvedValue(undefined),
    gitSave: vi.fn().mockResolvedValue(undefined),
    gitGetStatus: vi.fn().mockResolvedValue(null),
    onGitStatusChanged: vi.fn().mockReturnValue(vi.fn()),
    scanAssets: vi.fn().mockResolvedValue([]),
    uploadAsset: vi.fn().mockResolvedValue('uploaded.png'),
    selectImageFile: vi.fn().mockResolvedValue(null),
    getCollectionSchema: vi.fn().mockResolvedValue(null),
    createEntry: vi.fn().mockResolvedValue({ status: 'success', entry: { type: 'entry', name: 'new', relativePath: 'new.mdx', fullPath: '/tmp/new.mdx' } }),
    deleteEntry: vi.fn().mockResolvedValue(undefined),
    updateEntryFrontmatter: vi.fn().mockResolvedValue(undefined)
  },
  writable: true,
  configurable: true
})
