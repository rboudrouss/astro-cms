import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { TextSelectionMessage } from '../../../shared/types'

export type InlineEditorProps = {
  selection: TextSelectionMessage
  iframeRect: DOMRect
  onSave: (html: string) => void
  onCancel: () => void
}

export function InlineEditor({
  selection,
  iframeRect,
  onSave,
  onCancel
}: InlineEditorProps): React.JSX.Element {
  const editor = useEditor({
    extensions: [StarterKit],
    content: selection.innerHTML,
    autofocus: 'end',
    editorProps: {
      attributes: {
        'data-testid': 'inline-editor-tiptap'
      }
    }
  })

  const handleBlur = useCallback(() => {
    if (!editor) return
    onSave(editor.getHTML())
  }, [editor, onSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  const top = iframeRect.top + selection.rect.top
  const left = iframeRect.left + selection.rect.left
  const width = selection.rect.width

  const inlineStyles: React.CSSProperties = {
    position: 'absolute',
    top,
    left,
    width,
    minHeight: selection.rect.height,
    zIndex: 50,
    fontSize: selection.computedStyles.fontSize,
    fontFamily: selection.computedStyles.fontFamily,
    fontWeight: selection.computedStyles.fontWeight,
    fontStyle: selection.computedStyles.fontStyle,
    color: selection.computedStyles.color,
    lineHeight: selection.computedStyles.lineHeight,
    textAlign: selection.computedStyles.textAlign as React.CSSProperties['textAlign'],
    letterSpacing: selection.computedStyles.letterSpacing,
    padding: selection.computedStyles.padding,
    margin: '0',
    background: 'white',
    boxShadow: '0 0 0 2px rgb(59,130,246), 0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: '2px',
    outline: 'none'
  }

  return (
    <div
      data-testid="inline-editor"
      style={inlineStyles}
      onBlur={handleBlur}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
