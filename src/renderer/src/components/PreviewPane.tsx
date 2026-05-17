export function PreviewPane({
  url,
  pagePath
}: {
  url: string
  pagePath?: string
}): React.JSX.Element {
  const previewUrl = pagePath ? buildPageUrl(url, pagePath) : url

  return (
    <iframe
      data-testid="preview-iframe"
      src={previewUrl}
      className="h-full w-full border-0"
      title="Astro preview"
    />
  )
}

function buildPageUrl(baseUrl: string, pagePath: string): string {
  const match = pagePath.match(/src\/pages\/(.+)\.mdx?$/)
  if (!match) return baseUrl
  const route = match[1].replace(/index$/, '')
  return `${baseUrl.replace(/\/$/, '')}/${route}`
}
