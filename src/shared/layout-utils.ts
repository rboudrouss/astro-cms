export function extractLayoutFromSource(source: string): string | null {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return null
  const frontmatter = match[1]
  const layoutMatch = frontmatter.match(/^layout:\s*['"]?([^'"\n]+?)['"]?\s*$/m)
  return layoutMatch ? layoutMatch[1] : null
}

export function isLayoutFromTheme(
  layoutRef: string,
  themeLayouts: { name: string }[]
): boolean {
  if (!layoutRef) return false
  const parts = layoutRef.split('/')
  const filename = parts[parts.length - 1] || ''
  const layoutName = filename.replace(/\.astro$/, '')
  return themeLayouts.some((l) => l.name === layoutName)
}
