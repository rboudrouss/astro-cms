import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { Sidebar } from '@/components/Sidebar'
import { NewEntryDialog } from '@/components/NewEntryDialog'
import { DeleteEntryDialog } from '@/components/DeleteEntryDialog'
import { initI18n } from '@/i18n'
import type { ProjectTree, CollectionSchema } from '../../src/shared/types'

const sampleTree: ProjectTree = {
  pages: [],
  collections: [
    {
      type: 'collection',
      name: 'blog',
      entries: [
        { type: 'entry', name: 'first', relativePath: 'first.mdx', fullPath: '/p/src/content/blog/first.mdx' }
      ]
    }
  ]
}

const blogSchema: CollectionSchema = {
  name: 'blog',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'draft', type: 'boolean', required: false, default: true }
  ]
}

function i18n() {
  return initI18n('en')
}

describe('Sidebar new entry button', () => {
  it('renders a new entry button per collection', () => {
    const onNewEntry = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <Sidebar tree={sampleTree} selectedPath={null} onSelect={vi.fn()} onNewEntry={onNewEntry} />
      </I18nextProvider>
    )
    const btn = screen.getByTitle('New entry')
    expect(btn).toBeInTheDocument()
  })

  it('calls onNewEntry with collection name when clicked', async () => {
    const onNewEntry = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <Sidebar tree={sampleTree} selectedPath={null} onSelect={vi.fn()} onNewEntry={onNewEntry} />
      </I18nextProvider>
    )
    await userEvent.click(screen.getByTitle('New entry'))
    expect(onNewEntry).toHaveBeenCalledWith('blog')
  })

  it('does not render new entry button when onNewEntry is not provided', () => {
    render(
      <I18nextProvider i18n={i18n()}>
        <Sidebar tree={sampleTree} selectedPath={null} onSelect={vi.fn()} />
      </I18nextProvider>
    )
    expect(screen.queryByTitle('New entry')).not.toBeInTheDocument()
  })
})

describe('NewEntryDialog', () => {
  it('renders slug input and schema fields', () => {
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={vi.fn()}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    expect(screen.getByText('New entry in blog')).toBeInTheDocument()
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()
    expect(screen.getByLabelText('title')).toBeInTheDocument()
    expect(screen.getByLabelText('draft')).toBeInTheDocument()
  })

  it('pre-fills default values', () => {
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={vi.fn()}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    const draftCheckbox = screen.getByLabelText('draft') as HTMLInputElement
    expect(draftCheckbox.checked).toBe(true)
  })

  it('validates slug is required on submit', async () => {
    const onCreate = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={onCreate}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    await userEvent.click(screen.getByText('Create'))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText('Slug is required')).toBeInTheDocument()
  })

  it('validates slug format', async () => {
    const onCreate = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={onCreate}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    await userEvent.type(screen.getByLabelText(/slug/i), 'Invalid Slug!')
    await userEvent.click(screen.getByText('Create'))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('calls onCreate with slug and values on valid submit', async () => {
    const onCreate = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={onCreate}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    await userEvent.type(screen.getByLabelText(/slug/i), 'my-post')
    await userEvent.type(screen.getByLabelText('title'), 'My Post')
    await userEvent.click(screen.getByText('Create'))
    expect(onCreate).toHaveBeenCalledWith('my-post', expect.objectContaining({ title: 'My Post', draft: true }))
  })

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={vi.fn()}
          onCancel={onCancel}
        />
      </I18nextProvider>
    )
    await userEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows no-schema message when schema is null', () => {
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={null}
          onCreate={vi.fn()}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    expect(screen.getByText('No schema found for this collection')).toBeInTheDocument()
  })

  it('validates required schema fields on submit', async () => {
    const onCreate = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <NewEntryDialog
          collectionName="blog"
          schema={blogSchema}
          onCreate={onCreate}
          onCancel={vi.fn()}
        />
      </I18nextProvider>
    )
    await userEvent.type(screen.getByLabelText(/slug/i), 'my-post')
    await userEvent.click(screen.getByText('Create'))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText('title is required')).toBeInTheDocument()
  })
})

describe('DeleteEntryDialog', () => {
  it('shows entry name and confirmation message', () => {
    render(
      <I18nextProvider i18n={i18n()}>
        <DeleteEntryDialog entryName="first-post" onConfirm={vi.fn()} onCancel={vi.fn()} />
      </I18nextProvider>
    )
    expect(screen.getByText('Delete this entry?')).toBeInTheDocument()
    expect(screen.getByText(/first-post/)).toBeInTheDocument()
  })

  it('calls onConfirm when delete is clicked', async () => {
    const onConfirm = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <DeleteEntryDialog entryName="first-post" onConfirm={onConfirm} onCancel={vi.fn()} />
      </I18nextProvider>
    )
    await userEvent.click(screen.getByText('Delete'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn()
    render(
      <I18nextProvider i18n={i18n()}>
        <DeleteEntryDialog entryName="first-post" onConfirm={vi.fn()} onCancel={onCancel} />
      </I18nextProvider>
    )
    await userEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
