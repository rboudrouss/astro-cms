import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreviewPane } from '../src/renderer/src/components/PreviewPane'

describe('PreviewPane CSS variable injection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts CSS variables to iframe via postMessage when cssVariables prop changes', () => {
    const postMessageSpy = vi.fn()

    const { rerender } = render(
      <PreviewPane url="http://localhost:4321/" cssVariables="" />
    )

    const iframe = screen.getByTestId('preview-iframe') as HTMLIFrameElement
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: postMessageSpy },
      writable: true
    })

    rerender(
      <PreviewPane url="http://localhost:4321/" cssVariables=":root { --color: red; }" />
    )

    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'astro-cms:variables-updated', css: ':root { --color: red; }' },
      '*'
    )
  })

  it('does not post when cssVariables is empty string', () => {
    const postMessageSpy = vi.fn()

    render(
      <PreviewPane url="http://localhost:4321/" cssVariables="" />
    )

    const iframe = screen.getByTestId('preview-iframe') as HTMLIFrameElement
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: postMessageSpy },
      writable: true
    })

    expect(postMessageSpy).not.toHaveBeenCalled()
  })
})
