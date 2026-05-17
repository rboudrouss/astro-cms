import { resolve } from 'path'
import { mkdtemp, writeFile, mkdir, rm, cp } from 'fs/promises'
import { tmpdir } from 'os'
import { ThemeHotReloader } from '../src/main/theme-hot-reloader'
import type { ThemeManifest } from '../src/shared/types'

const FIXTURES_DIR = resolve(__dirname, 'fixtures/test-theme')

async function createTempProject(): Promise<string> {
  const dir = await mkdtemp(resolve(tmpdir(), 'hot-reload-test-'))

  await mkdir(resolve(dir, 'src/themes/my-theme/blocks'), { recursive: true })
  await mkdir(resolve(dir, 'src/themes/my-theme/layouts'), { recursive: true })

  await cp(resolve(FIXTURES_DIR, 'astro-cms.theme.ts'), resolve(dir, 'src/themes/my-theme/astro-cms.theme.ts'))
  await cp(resolve(FIXTURES_DIR, 'blocks/ImageText.astro'), resolve(dir, 'src/themes/my-theme/blocks/ImageText.astro'))
  await cp(resolve(FIXTURES_DIR, 'layouts/Default.astro'), resolve(dir, 'src/themes/my-theme/layouts/Default.astro'))

  await writeFile(
    resolve(dir, 'astro-cms.config.ts'),
    `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/my-theme/astro-cms.theme";
export default defineProject({ theme: myTheme });`
  )

  return dir
}

describe('ThemeHotReloader', () => {
  let projectDir: string

  beforeEach(async () => {
    projectDir = await createTempProject()
  })

  afterEach(async () => {
    await rm(projectDir, { recursive: true })
  })

  it('returns initial manifest on start', async () => {
    const reloader = new ThemeHotReloader(projectDir, vi.fn())
    const manifest = await reloader.start()
    expect(manifest).not.toBeNull()
    expect(manifest!.name).toBe('test-theme')
    expect(manifest!.blocks).toHaveLength(1)
    expect(manifest!.blocks[0].name).toBe('ImageText')
    expect(manifest!.layouts).toHaveLength(1)
    await reloader.stop()
  })

  it('calls onUpdate when a block file changes', async () => {
    const onUpdate = vi.fn()
    const reloader = new ThemeHotReloader(projectDir, onUpdate)
    await reloader.start()

    await writeFile(
      resolve(projectDir, 'src/themes/my-theme/blocks/NewBlock.astro'),
      `---
interface Props {
  label: string;
}
const { label } = Astro.props;
---
<div>{label}</div>`
    )

    await vi.waitFor(
      () => {
        expect(onUpdate).toHaveBeenCalled()
      },
      { timeout: 5000, interval: 100 }
    )

    const updatedManifest: ThemeManifest = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
    const blockNames = updatedManifest.blocks.map((b) => b.name).sort()
    expect(blockNames).toContain('NewBlock')

    await reloader.stop()
  }, 10000)

  it('stops watching after stop()', async () => {
    const onUpdate = vi.fn()
    const reloader = new ThemeHotReloader(projectDir, onUpdate)
    await reloader.start()
    await reloader.stop()

    await writeFile(
      resolve(projectDir, 'src/themes/my-theme/blocks/AfterStop.astro'),
      `---\ninterface Props { x: string; }\n---\n<p>test</p>`
    )

    await new Promise((r) => setTimeout(r, 500))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('returns null for invalid project', async () => {
    const reloader = new ThemeHotReloader('/nonexistent', vi.fn())
    const manifest = await reloader.start()
    expect(manifest).toBeNull()
  })
})
