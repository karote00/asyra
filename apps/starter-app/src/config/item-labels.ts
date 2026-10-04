import type { ItemStatus } from '../domain/item-domain.js'
export const statusLabels: Record<ItemStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done'
}
