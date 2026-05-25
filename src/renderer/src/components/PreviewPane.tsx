import { useEffect, useRef } from 'react'

export function PreviewPane({
  url,
  pagePath,
  cssVariables
}: {
  url: string
  pagePath?: string
  cssVariables?: string
}): React.JSX.Element {
  const previewUrl = pagePath ? buildPageUrl(url, pagePath) : url
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!cssVariables || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      { type: 'astro-cms:variables-updated', css: cssVariables },
      '*'
    )
  }, [cssVariables])

  return (
    <iframe
      ref={iframeRef}
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
