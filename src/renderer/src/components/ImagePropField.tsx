import { useState, useCallback } from 'react'
import { join } from 'path'
import { ImageLibraryModal } from './ImageLibraryModal'

type Props = {
  name: string
  description?: string
  value: string
  projectPath: string
  onChange: (value: string) => void
}

export function ImagePropField({
  name,
  description,
  value,
  projectPath,
  onChange
}: Props): React.JSX.Element {
  const [showLibrary, setShowLibrary] = useState(false)

  const uploadsDir = join(projectPath, 'src', 'assets', 'uploads')

  const handleUpload = useCallback(async () => {
    const filePath = await window.api.selectImageFile()
    if (!filePath) return

    const relativePath = await window.api.uploadAsset(filePath, uploadsDir)
    onChange(relativePath)
  }, [uploadsDir, onChange])

  const handleLibrarySelect = useCallback(
    (relativePath: string) => {
      onChange(relativePath)
      setShowLibrary(false)
    },
    [onChange]
  )

  return (
    <div data-testid="image-prop-field" className="flex flex-col gap-1">
      <label className="text-xs font-medium">{name}</label>
      {description && <span className="text-xs text-muted-foreground">{description}</span>}

      {value && (
        <span className="truncate text-xs text-muted-foreground">{value}</span>
      )}

      <div className="flex gap-1">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => setShowLibrary(true)}
        >
          Library
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={handleUpload}
        >
          Upload
        </button>
      </div>

      {showLibrary && (
        <ImageLibraryModal
          uploadsDir={uploadsDir}
          onSelect={handleLibrarySelect}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  )
}
