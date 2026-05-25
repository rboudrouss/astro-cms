import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { EntryEditorForm } from '@/components/EntryEditorForm'
import { initI18n } from '@/i18n'
import type { CollectionSchema } from '../../src/shared/types'

const blogSchema: CollectionSchema = {
  name: 'blog',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false, description: 'A short summary' },
    { name: 'views', type: 'number', required: false, default: 0 },
    { name: 'draft', type: 'boolean', required: false, default: true },
    { name: 'pubDate', type: 'date', required: true },
    { name: 'status', type: 'enum', required: true, enumValues: ['draft', 'published', 'archived'] }
  ]
}

function renderForm(
  props: Partial<React.ComponentProps<typeof EntryEditorForm>> = {}
) {
  const i18n = initI18n('en')
  const defaults = {
    schema: blogSchema,
    values: {},
    onChange: vi.fn(),
    validationErrors: [],
    ...props
  }
  return render(
    <I18nextProvider i18n={i18n}>
      <EntryEditorForm {...defaults} />
    </I18nextProvider>
  )
}

describe('EntryEditorForm', () => {
  it('renders a text input for string fields', () => {
    renderForm()
    const input = screen.getByLabelText('title') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('text')
  })

  it('renders a number input for number fields', () => {
    renderForm()
    const input = screen.getByLabelText('views') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('number')
  })

  it('renders a checkbox for boolean fields', () => {
    renderForm()
    const checkbox = screen.getByLabelText('draft') as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.type).toBe('checkbox')
  })

  it('renders a date input for date fields', () => {
    renderForm()
    const input = screen.getByLabelText('pubDate') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('date')
  })

  it('renders a select for enum fields', () => {
    renderForm()
    const select = screen.getByLabelText('status') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.tagName).toBe('SELECT')

    const options = within(select).getAllByRole('option')
    expect(options).toHaveLength(4) // empty + 3 enum values
    expect(options[1]).toHaveTextContent('draft')
    expect(options[2]).toHaveTextContent('published')
    expect(options[3]).toHaveTextContent('archived')
  })

  it('shows field descriptions', () => {
    renderForm()
    expect(screen.getByText('A short summary')).toBeInTheDocument()
  })

  it('marks required fields', () => {
    renderForm()
    const titleInput = screen.getByLabelText('title') as HTMLInputElement
    expect(titleInput.required).toBe(true)

    const descInput = screen.getByLabelText('description') as HTMLInputElement
    expect(descInput.required).toBe(false)
  })

  it('pre-fills default values', () => {
    renderForm({ values: { views: 0, draft: true } })
    const viewsInput = screen.getByLabelText('views') as HTMLInputElement
    expect(viewsInput.value).toBe('0')

    const draftInput = screen.getByLabelText('draft') as HTMLInputElement
    expect(draftInput.checked).toBe(true)
  })

  it('calls onChange when a text field changes', async () => {
    const onChange = vi.fn()
    renderForm({ onChange })

    const input = screen.getByLabelText('title') as HTMLInputElement
    await userEvent.type(input, 'Hello')

    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.title).toBe('Hello')
  })

  it('calls onChange when a boolean field changes', async () => {
    const onChange = vi.fn()
    renderForm({ onChange, values: { draft: false } })

    const checkbox = screen.getByLabelText('draft') as HTMLInputElement
    await userEvent.click(checkbox)

    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.draft).toBe(true)
  })

  it('calls onChange when enum field changes', async () => {
    const onChange = vi.fn()
    renderForm({ onChange })

    const select = screen.getByLabelText('status') as HTMLSelectElement
    await userEvent.selectOptions(select, 'published')

    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.status).toBe('published')
  })

  it('displays validation errors per field', () => {
    renderForm({
      validationErrors: [
        { field: 'title', message: 'Title is required' },
        { field: 'pubDate', message: 'Invalid date' }
      ]
    })

    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Invalid date')).toBeInTheDocument()
  })

  it('converts empty number input to undefined', async () => {
    const onChange = vi.fn()
    renderForm({ onChange, values: { views: 5 } })

    const input = screen.getByLabelText('views') as HTMLInputElement
    await userEvent.clear(input)

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.views).toBeUndefined()
  })
})
