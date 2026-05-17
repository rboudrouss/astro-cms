import { readFile, writeFile } from 'fs/promises'

export async function readPageContent(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8')
}

export async function writePageContent(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content, 'utf-8')
}
