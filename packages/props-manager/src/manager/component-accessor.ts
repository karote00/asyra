import type {
  PropertyComponentInstanceTypes,
  SetterChangeRecord
} from '@asyra/utils'

interface ComponentAccessor {
  validateSharedWrite: (propertyId: string, key: string, value: unknown) => void
  getPropertyById: (
    propertyId: string
  ) => PropertyComponentInstanceTypes | undefined
  addToMap: (component: PropertyComponentInstanceTypes) => void
  createComponent: (
    data: Record<string, unknown>
  ) => PropertyComponentInstanceTypes | null
  addChange: (change: SetterChangeRecord) => void
}

const noopAccessor: ComponentAccessor = {
  validateSharedWrite: () => {
    throw new Error('Shared property writes require an active Props owner')
  },
  getPropertyById: () => undefined,
  addToMap: () => undefined,
  createComponent: () => null,
  addChange: () => undefined
}

let accessor: ComponentAccessor = noopAccessor
let scopedAccessor: ComponentAccessor | undefined

export const setComponentAccessor = (nextAccessor: ComponentAccessor) => {
  accessor = nextAccessor
}

export const getPropertyComponentAccessor = () => scopedAccessor ?? accessor

export const runWithPropertyComponentAccessor = <T>(
  nextAccessor: ComponentAccessor,
  callback: () => T
): T => {
  const previousAccessor = scopedAccessor
  scopedAccessor = nextAccessor
  try {
    return callback()
  } finally {
    scopedAccessor = previousAccessor
  }
}

export type { ComponentAccessor as PropertyComponentAccessor }
