import { useCallback, useState, type KeyboardEvent } from 'react'

export function RawEditor({
  content,
  filePath,
  onSave
}: {
  content: string
  filePath: string
  onSave: (content: string) => void
}): React.JSX.Element {
  const [value, setValue] = useState(content)

  const fileName = filePath.split('/').pop() ?? filePath

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onSave(value)
      }
    },
    [onSave, value]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm text-muted-foreground">{fileName}</span>
      </div>
      <textarea
        className="flex-1 resize-none bg-background p-4 font-mono text-sm text-foreground outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  )
}
