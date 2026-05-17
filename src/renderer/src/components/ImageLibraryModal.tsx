import { useState, useEffect } from 'react'
import type { AssetInfo } from '../../../shared/types'

type Props = {
  uploadsDir: string
  onSelect: (relativePath: string) => void
  onClose: () => void
}

export function ImageLibraryModal({ uploadsDir, onSelect, onClose }: Props): React.JSX.Element {
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.api.scanAssets(uploadsDir).then(setAssets)
  }, [uploadsDir])

  const filtered = search
    ? assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : assets

  return (
    <div
      data-testid="image-library-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[80vh] w-[500px] flex-col rounded-lg bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Image Library</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            &times;
          </button>
        </div>

        <div className="border-b px-4 py-2">
          <input
            type="text"
            placeholder="Search images..."
            className="w-full rounded border px-2 py-1 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No images found</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((asset) => (
                <button
                  key={asset.relativePath}
                  className="flex flex-col items-center gap-1 rounded border p-2 hover:bg-muted"
                  onClick={() => onSelect(asset.relativePath)}
                >
                  <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded bg-muted">
                    <span className="text-xs text-muted-foreground">
                      {asset.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <span className="w-full truncate text-center text-xs">{asset.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
