export type BlockInstance = {
  id: string
  blockName: string
  props: Record<string, unknown>
}

export type BlockTreeState = {
  blocks: BlockInstance[]
  undoStack: BlockInstance[][]
  redoStack: BlockInstance[][]
}

export type BlockTreeAction =
  | { type: 'LOAD'; blocks: BlockInstance[] }
  | { type: 'INSERT'; block: BlockInstance; position: number }
  | { type: 'DELETE'; blockId: string }
  | { type: 'REORDER'; blockId: string; toPosition: number }
  | { type: 'UPDATE_PROPS'; blockId: string; props: Record<string, unknown> }
  | { type: 'UNDO' }
  | { type: 'REDO' }

export function initialState(): BlockTreeState {
  return { blocks: [], undoStack: [], redoStack: [] }
}

function withUndo(state: BlockTreeState, newBlocks: BlockInstance[]): BlockTreeState {
  return {
    blocks: newBlocks,
    undoStack: [...state.undoStack, state.blocks],
    redoStack: []
  }
}

export function reduce(state: BlockTreeState, action: BlockTreeAction): BlockTreeState {
  switch (action.type) {
    case 'LOAD':
      return { blocks: action.blocks, undoStack: [], redoStack: [] }

    case 'INSERT': {
      const pos = Math.min(action.position, state.blocks.length)
      const newBlocks = [
        ...state.blocks.slice(0, pos),
        action.block,
        ...state.blocks.slice(pos)
      ]
      return withUndo(state, newBlocks)
    }

    case 'DELETE': {
      const idx = state.blocks.findIndex((b) => b.id === action.blockId)
      if (idx === -1) return state
      const newBlocks = state.blocks.filter((b) => b.id !== action.blockId)
      return withUndo(state, newBlocks)
    }

    case 'REORDER': {
      const fromIdx = state.blocks.findIndex((b) => b.id === action.blockId)
      if (fromIdx === -1) return state
      const toIdx = Math.min(action.toPosition, state.blocks.length - 1)
      if (fromIdx === toIdx) return state
      const newBlocks = [...state.blocks]
      const [moved] = newBlocks.splice(fromIdx, 1)
      newBlocks.splice(toIdx, 0, moved)
      return withUndo(state, newBlocks)
    }

    case 'UPDATE_PROPS': {
      const idx = state.blocks.findIndex((b) => b.id === action.blockId)
      if (idx === -1) return state
      const newBlocks = state.blocks.map((b) =>
        b.id === action.blockId ? { ...b, props: action.props } : b
      )
      return withUndo(state, newBlocks)
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state
      const previous = state.undoStack[state.undoStack.length - 1]
      return {
        blocks: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.blocks]
      }
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state
      const next = state.redoStack[state.redoStack.length - 1]
      return {
        blocks: next,
        undoStack: [...state.undoStack, state.blocks],
        redoStack: state.redoStack.slice(0, -1)
      }
    }
  }
}
