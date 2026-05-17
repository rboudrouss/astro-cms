import type { PreviewMode } from '../../../shared/types'
import { PREVIEW_WIDTHS } from '../../../shared/types'

export function PreviewPane({
  url,
  pagePath,
  previewMode = 'full'
}: {
  url: string
  pagePath?: string
  previewMode?: PreviewMode
}): React.JSX.Element {
  const previewUrl = pagePath ? buildPageUrl(url, pagePath) : url
  const maxWidth = PREVIEW_WIDTHS[previewMode]

  return (
    <div
      data-testid="preview-container"
      className="mx-auto flex h-full w-full justify-center transition-all duration-300"
      style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
    >
      <iframe
        data-testid="preview-iframe"
        src={previewUrl}
        className="h-full w-full border-0"
        title="Astro preview"
      />
    </div>
  )
}

function buildPageUrl(baseUrl: string, pagePath: string): string {
  const match = pagePath.match(/src\/pages\/(.+)\.mdx?$/)
  if (!match) return baseUrl
  const route = match[1].replace(/index$/, '')
  return `${baseUrl.replace(/\/$/, '')}/${route}`
}
