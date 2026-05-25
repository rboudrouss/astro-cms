import { reduce, initialState, type BlockInstance } from '../src/renderer/src/block-tree-state'

const blockA: BlockInstance = { id: 'a', blockName: 'ImageText', props: { image: '/hero.png' } }
const blockB: BlockInstance = { id: 'b', blockName: 'ColorLigne', props: { color: '#fff' } }
const blockC: BlockInstance = { id: 'c', blockName: 'Section', props: {} }

function loaded(...blocks: BlockInstance[]) {
  return reduce(initialState(), { type: 'LOAD', blocks })
}

describe('block-tree-state', () => {
  describe('LOAD', () => {
    it('sets blocks from loaded data', () => {
      const s = loaded(blockA, blockB)
      expect(s.blocks).toEqual([blockA, blockB])
    })

    it('clears undo and redo stacks', () => {
      const s = loaded(blockA, blockB)
      expect(s.undoStack).toEqual([])
      expect(s.redoStack).toEqual([])
    })
  })

  describe('INSERT', () => {
    it('inserts a block at a given position', () => {
      const s0 = loaded(blockA, blockB)
      const s1 = reduce(s0, { type: 'INSERT', block: blockC, position: 1 })
      expect(s1.blocks).toEqual([blockA, blockC, blockB])
    })

    it('inserts at position 0 (beginning)', () => {
      const s0 = loaded(blockA)
      const s1 = reduce(s0, { type: 'INSERT', block: blockB, position: 0 })
      expect(s1.blocks).toEqual([blockB, blockA])
    })

    it('clamps to end when position exceeds length', () => {
      const s0 = loaded(blockA)
      const s1 = reduce(s0, { type: 'INSERT', block: blockB, position: 99 })
      expect(s1.blocks).toEqual([blockA, blockB])
    })

    it('pushes previous blocks to undo stack', () => {
      const s0 = loaded(blockA)
      const s1 = reduce(s0, { type: 'INSERT', block: blockB, position: 1 })
      expect(s1.undoStack).toEqual([[blockA]])
    })

    it('clears redo stack', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'UNDO' })
      expect(s.redoStack.length).toBe(1)
      s = reduce(s, { type: 'INSERT', block: blockC, position: 0 })
      expect(s.redoStack).toEqual([])
    })
  })

  describe('DELETE', () => {
    it('removes a block by id', () => {
      const s0 = loaded(blockA, blockB)
      const s1 = reduce(s0, { type: 'DELETE', blockId: 'a' })
      expect(s1.blocks).toEqual([blockB])
    })

    it('pushes previous blocks to undo stack', () => {
      const s0 = loaded(blockA, blockB)
      const s1 = reduce(s0, { type: 'DELETE', blockId: 'a' })
      expect(s1.undoStack).toEqual([[blockA, blockB]])
    })

    it('returns state unchanged when blockId not found', () => {
      const s0 = loaded(blockA)
      const s1 = reduce(s0, { type: 'DELETE', blockId: 'nonexistent' })
      expect(s1).toBe(s0)
    })
  })

  describe('REORDER', () => {
    it('moves a block forward', () => {
      const s0 = loaded(blockA, blockB, blockC)
      const s1 = reduce(s0, { type: 'REORDER', blockId: 'a', toPosition: 2 })
      expect(s1.blocks).toEqual([blockB, blockC, blockA])
    })

    it('moves a block backward', () => {
      const s0 = loaded(blockA, blockB, blockC)
      const s1 = reduce(s0, { type: 'REORDER', blockId: 'c', toPosition: 0 })
      expect(s1.blocks).toEqual([blockC, blockA, blockB])
    })

    it('returns state unchanged when blockId not found', () => {
      const s0 = loaded(blockA, blockB)
      const s1 = reduce(s0, { type: 'REORDER', blockId: 'nonexistent', toPosition: 0 })
      expect(s1).toBe(s0)
    })

    it('returns state unchanged when moving to same position', () => {
      const s0 = loaded(blockA, blockB, blockC)
      const s1 = reduce(s0, { type: 'REORDER', blockId: 'b', toPosition: 1 })
      expect(s1).toBe(s0)
    })

    it('clamps toPosition to valid range', () => {
      const s0 = loaded(blockA, blockB, blockC)
      const s1 = reduce(s0, { type: 'REORDER', blockId: 'a', toPosition: 99 })
      expect(s1.blocks).toEqual([blockB, blockC, blockA])
    })
  })

  describe('UPDATE_PROPS', () => {
    it('replaces props of the target block', () => {
      const s0 = loaded(blockA, blockB)
      const s1 = reduce(s0, { type: 'UPDATE_PROPS', blockId: 'a', props: { image: '/new.png', alt: 'new' } })
      expect(s1.blocks[0].props).toEqual({ image: '/new.png', alt: 'new' })
    })

    it('does not mutate other blocks', () => {
      const s0 = loaded(blockA, blockB)
      const s1 = reduce(s0, { type: 'UPDATE_PROPS', blockId: 'a', props: { image: '/new.png' } })
      expect(s1.blocks[1]).toEqual(blockB)
    })

    it('returns state unchanged when blockId not found', () => {
      const s0 = loaded(blockA)
      const s1 = reduce(s0, { type: 'UPDATE_PROPS', blockId: 'nonexistent', props: {} })
      expect(s1).toBe(s0)
    })

    it('pushes previous blocks to undo stack', () => {
      const s0 = loaded(blockA)
      const s1 = reduce(s0, { type: 'UPDATE_PROPS', blockId: 'a', props: { image: '/new.png' } })
      expect(s1.undoStack).toEqual([[blockA]])
    })
  })

  describe('UNDO', () => {
    it('restores the previous block state', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'UNDO' })
      expect(s.blocks).toEqual([blockA])
    })

    it('pushes current blocks to redo stack', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'UNDO' })
      expect(s.redoStack).toEqual([[blockA, blockB]])
    })

    it('returns state unchanged when undo stack is empty', () => {
      const s0 = initialState()
      const s1 = reduce(s0, { type: 'UNDO' })
      expect(s1).toBe(s0)
    })

    it('supports multiple undos', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'INSERT', block: blockC, position: 2 })
      s = reduce(s, { type: 'UNDO' })
      expect(s.blocks).toEqual([blockA, blockB])
      s = reduce(s, { type: 'UNDO' })
      expect(s.blocks).toEqual([blockA])
    })
  })

  describe('REDO', () => {
    it('restores the undone state', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'UNDO' })
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual([blockA, blockB])
    })

    it('returns state unchanged when redo stack is empty', () => {
      const s0 = initialState()
      const s1 = reduce(s0, { type: 'REDO' })
      expect(s1).toBe(s0)
    })
  })

  describe('undo/redo invariants', () => {
    it('redo(undo(s)) restores blocks after INSERT', () => {
      let s = loaded(blockA)
      const after = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(after, { type: 'UNDO' })
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual(after.blocks)
    })

    it('redo(undo(s)) restores blocks after DELETE', () => {
      let s = loaded(blockA, blockB)
      const after = reduce(s, { type: 'DELETE', blockId: 'a' })
      s = reduce(after, { type: 'UNDO' })
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual(after.blocks)
    })

    it('redo(undo(s)) restores blocks after REORDER', () => {
      let s = loaded(blockA, blockB, blockC)
      const after = reduce(s, { type: 'REORDER', blockId: 'a', toPosition: 2 })
      s = reduce(after, { type: 'UNDO' })
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual(after.blocks)
    })

    it('redo(undo(s)) restores blocks after UPDATE_PROPS', () => {
      let s = loaded(blockA)
      const after = reduce(s, { type: 'UPDATE_PROPS', blockId: 'a', props: { image: '/new.png' } })
      s = reduce(after, { type: 'UNDO' })
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual(after.blocks)
    })

    it('new mutation after undo clears redo stack', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'UNDO' })
      expect(s.redoStack.length).toBe(1)
      s = reduce(s, { type: 'INSERT', block: blockC, position: 0 })
      expect(s.redoStack).toEqual([])
    })

    it('multiple undo then redo cycle is consistent', () => {
      let s = loaded(blockA)
      s = reduce(s, { type: 'INSERT', block: blockB, position: 1 })
      s = reduce(s, { type: 'DELETE', blockId: 'a' })
      s = reduce(s, { type: 'UNDO' })
      s = reduce(s, { type: 'UNDO' })
      expect(s.blocks).toEqual([blockA])
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual([blockA, blockB])
      s = reduce(s, { type: 'REDO' })
      expect(s.blocks).toEqual([blockB])
    })
  })
})
