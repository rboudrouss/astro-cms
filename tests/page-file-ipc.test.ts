import { readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { readPageContent, writePageContent } from '../src/main/page-file'

describe('Page file operations', () => {
  let tempDir: string

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'page-file-test-'))
    mkdirSync(join(tempDir, 'src/pages'), { recursive: true })
  })

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('reads page content from disk', async () => {
    const filePath = join(tempDir, 'src/pages/index.mdx')
    const content = '---\ntitle: Test\n---\n\n# Hello\n'
    writeFileSync(filePath, content, 'utf-8')

    const result = await readPageContent(filePath)
    expect(result).toBe(content)
  })

  it('writes page content to disk', async () => {
    const filePath = join(tempDir, 'src/pages/about.mdx')
    const content = '---\ntitle: About\n---\n\n# About Us\n'

    await writePageContent(filePath, content)

    const written = readFileSync(filePath, 'utf-8')
    expect(written).toBe(content)
  })

  it('overwrites existing file on write', async () => {
    const filePath = join(tempDir, 'src/pages/overwrite.mdx')
    writeFileSync(filePath, 'old content', 'utf-8')

    await writePageContent(filePath, 'new content')

    const result = readFileSync(filePath, 'utf-8')
    expect(result).toBe('new content')
  })

  it('rejects reading a nonexistent file', async () => {
    const filePath = join(tempDir, 'src/pages/nonexistent.mdx')
    await expect(readPageContent(filePath)).rejects.toThrow()
  })
})
