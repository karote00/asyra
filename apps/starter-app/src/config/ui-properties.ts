// UI-only identities: never serialized as Item properties.
export const UIProperties = {
  itemIds: 'item-board.item-ids',
  selectedId: 'item-board.selected-id',
  ready: 'item-board.ready',
  pending: 'item-board.pending',
  status: 'item-board.status',
  canvasWidth: 'item-board.canvas-width'
} as const

export interface AppStatus {
  readonly tone: 'loading' | 'ok' | 'unsaved' | 'error'
  readonly message: string
}
