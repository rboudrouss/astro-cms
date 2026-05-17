import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { scanAssets, uploadAsset } from '../src/main/asset-manager'

describe('asset-manager', () => {
  let tempDir: string
  let uploadsDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'asset-test-'))
    uploadsDir = join(tempDir, 'src', 'assets', 'uploads')
    mkdirSync(uploadsDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('scanAssets', () => {
    it('returns empty array for empty directory', async () => {
      const result = await scanAssets(uploadsDir)
      expect(result).toEqual([])
    })

    it('lists image files in the directory', async () => {
      writeFileSync(join(uploadsDir, 'hero.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
      writeFileSync(join(uploadsDir, 'photo.jpg'), Buffer.from([0xff, 0xd8, 0xff]))

      const result = await scanAssets(uploadsDir)
      expect(result).toHaveLength(2)
      expect(result.map((a) => a.name)).toEqual(expect.arrayContaining(['hero.png', 'photo.jpg']))
    })

    it('includes supported image extensions', async () => {
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']
      for (const ext of extensions) {
        writeFileSync(join(uploadsDir, `img.${ext}`), 'data')
      }

      const result = await scanAssets(uploadsDir)
      expect(result).toHaveLength(extensions.length)
    })

    it('ignores non-image files', async () => {
      writeFileSync(join(uploadsDir, 'readme.txt'), 'text')
      writeFileSync(join(uploadsDir, 'data.json'), '{}')
      writeFileSync(join(uploadsDir, 'hero.png'), 'png')

      const result = await scanAssets(uploadsDir)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('hero.png')
    })

    it('ignores subdirectories', async () => {
      mkdirSync(join(uploadsDir, 'subdir'))
      writeFileSync(join(uploadsDir, 'hero.png'), 'png')

      const result = await scanAssets(uploadsDir)
      expect(result).toHaveLength(1)
    })

    it('returns file size for each asset', async () => {
      const data = Buffer.alloc(1024)
      writeFileSync(join(uploadsDir, 'big.png'), data)

      const result = await scanAssets(uploadsDir)
      expect(result[0].size).toBe(1024)
    })

    it('returns relative path for each asset', async () => {
      writeFileSync(join(uploadsDir, 'hero.png'), 'data')

      const result = await scanAssets(uploadsDir)
      expect(result[0].relativePath).toBe('hero.png')
    })

    it('returns empty array when directory does not exist', async () => {
      const result = await scanAssets(join(tempDir, 'nonexistent'))
      expect(result).toEqual([])
    })

    it('sorts results alphabetically by name', async () => {
      writeFileSync(join(uploadsDir, 'charlie.png'), 'c')
      writeFileSync(join(uploadsDir, 'alpha.png'), 'a')
      writeFileSync(join(uploadsDir, 'bravo.jpg'), 'b')

      const result = await scanAssets(uploadsDir)
      expect(result.map((a) => a.name)).toEqual(['alpha.png', 'bravo.jpg', 'charlie.png'])
    })
  })

  describe('uploadAsset', () => {
    it('copies file to uploads directory', async () => {
      const sourceFile = join(tempDir, 'source.png')
      writeFileSync(sourceFile, 'image-data')

      const relativePath = await uploadAsset(sourceFile, uploadsDir)

      expect(relativePath).toBe('source.png')
      expect(readFileSync(join(uploadsDir, 'source.png'), 'utf-8')).toBe('image-data')
    })

    it('preserves original file name', async () => {
      const sourceFile = join(tempDir, 'my-photo.jpg')
      writeFileSync(sourceFile, 'jpg-data')

      const relativePath = await uploadAsset(sourceFile, uploadsDir)
      expect(relativePath).toBe('my-photo.jpg')
    })

    it('creates uploads directory if it does not exist', async () => {
      const newUploadsDir = join(tempDir, 'new', 'uploads')
      const sourceFile = join(tempDir, 'img.png')
      writeFileSync(sourceFile, 'data')

      await uploadAsset(sourceFile, newUploadsDir)

      expect(existsSync(join(newUploadsDir, 'img.png'))).toBe(true)
    })

    it('adds numeric suffix when file already exists', async () => {
      writeFileSync(join(uploadsDir, 'hero.png'), 'original')
      const sourceFile = join(tempDir, 'hero.png')
      writeFileSync(sourceFile, 'new-data')

      const relativePath = await uploadAsset(sourceFile, uploadsDir)

      expect(relativePath).toBe('hero-1.png')
      expect(readFileSync(join(uploadsDir, 'hero.png'), 'utf-8')).toBe('original')
      expect(readFileSync(join(uploadsDir, 'hero-1.png'), 'utf-8')).toBe('new-data')
    })

    it('increments suffix when multiple duplicates exist', async () => {
      writeFileSync(join(uploadsDir, 'hero.png'), 'v1')
      writeFileSync(join(uploadsDir, 'hero-1.png'), 'v2')
      const sourceFile = join(tempDir, 'hero.png')
      writeFileSync(sourceFile, 'v3')

      const relativePath = await uploadAsset(sourceFile, uploadsDir)
      expect(relativePath).toBe('hero-2.png')
    })

    it('preserves binary file content', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const sourceFile = join(tempDir, 'binary.png')
      writeFileSync(sourceFile, binaryData)

      await uploadAsset(sourceFile, uploadsDir)

      const copied = readFileSync(join(uploadsDir, 'binary.png'))
      expect(copied).toEqual(binaryData)
    })
  })
})
