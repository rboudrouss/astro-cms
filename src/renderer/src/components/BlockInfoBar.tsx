import { Box } from 'lucide-react'
import type { BlockSelection } from '../../../shared/types'

export function BlockInfoBar({ selection }: { selection: BlockSelection }): React.JSX.Element {
  return (
    <div
      data-testid="block-info-bar"
      className="flex items-center gap-2 border-t bg-blue-50 px-3 py-1.5 text-sm text-blue-900"
    >
      <Box className="h-4 w-4" />
      <span className="font-medium">{selection.blockName}</span>
      <span className="text-blue-600">{selection.blockPath}</span>
    </div>
  )
}
