import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateNotification } from '@/components/UpdateNotification'

describe('UpdateNotification', () => {
  let onUpdateDownloadedCallback: ((info: { version: string }) => void) | null = null

  beforeEach(() => {
    onUpdateDownloadedCallback = null
    ;(window.api as Record<string, unknown>).onUpdateDownloaded = vi.fn((cb: (info: { version: string }) => void) => {
      onUpdateDownloadedCallback = cb
      return vi.fn()
    })
    ;(window.api as Record<string, unknown>).installAndRestart = vi.fn()
  })

  it('does not render a notification initially', () => {
    const { container } = render(<UpdateNotification />)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('shows notification when update has been downloaded', () => {
    render(<UpdateNotification />)
    act(() => {
      onUpdateDownloadedCallback!({ version: '2.0.0' })
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/2\.0\.0/)).toBeInTheDocument()
  })

  it('calls installAndRestart when the restart button is clicked', async () => {
    render(<UpdateNotification />)
    act(() => {
      onUpdateDownloadedCallback!({ version: '2.0.0' })
    })
    await userEvent.click(screen.getByText('Redémarrer'))
    expect(window.api.installAndRestart).toHaveBeenCalled()
  })

  it('shows the update prompt text in French', () => {
    render(<UpdateNotification />)
    act(() => {
      onUpdateDownloadedCallback!({ version: '3.1.0' })
    })
    expect(screen.getByText(/Nouvelle version/)).toBeInTheDocument()
  })
})
