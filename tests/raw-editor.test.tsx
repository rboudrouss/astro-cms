import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RawEditor } from '../src/renderer/src/components/RawEditor'

describe('RawEditor', () => {
  const defaultProps = {
    content: '---\ntitle: Hello\n---\n\n# Hello World\n',
    filePath: '/projects/site/src/pages/index.mdx',
    onSave: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a textarea with the file content', () => {
    render(<RawEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(defaultProps.content)
  })

  it('displays the file path', () => {
    render(<RawEditor {...defaultProps} />)
    expect(screen.getByText(/index\.mdx/)).toBeInTheDocument()
  })

  it('allows editing the content', async () => {
    const user = userEvent.setup()
    render(<RawEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')

    await user.clear(textarea)
    await user.type(textarea, 'new content')
    expect(textarea).toHaveValue('new content')
  })

  it('calls onSave with content on Ctrl+S', async () => {
    render(<RawEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')

    fireEvent.keyDown(textarea, { key: 's', ctrlKey: true })

    expect(defaultProps.onSave).toHaveBeenCalledWith(defaultProps.content)
  })

  it('calls onSave with updated content after editing', async () => {
    const user = userEvent.setup()
    render(<RawEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')

    await user.clear(textarea)
    await user.type(textarea, 'modified')

    fireEvent.keyDown(textarea, { key: 's', ctrlKey: true })

    expect(defaultProps.onSave).toHaveBeenCalledWith('modified')
  })

  it('supports Cmd+S on Mac', () => {
    render(<RawEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')

    fireEvent.keyDown(textarea, { key: 's', metaKey: true })

    expect(defaultProps.onSave).toHaveBeenCalledWith(defaultProps.content)
  })

  it('does not call onSave on plain S key', () => {
    render(<RawEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')

    fireEvent.keyDown(textarea, { key: 's' })

    expect(defaultProps.onSave).not.toHaveBeenCalled()
  })
})
