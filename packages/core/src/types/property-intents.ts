import type {
  PropertyTargetView,
  SharedPropertySourceUpdate
} from '@asyra/props-manager'
import type { EVENT_OPTIONS } from '@asyra/utils'

export interface ElementPropertyTarget {
  readonly elementId: string
  readonly propertyName: string
  readonly path: readonly { readonly key: string; readonly childId: string }[]
  readonly expectedRootId?: string
  readonly expectedPropertyId?: string
  readonly expectedSourceId?: string
}
export interface ElementPropertyOverride {
  readonly target: ElementPropertyTarget
  readonly values: Readonly<Record<string, unknown>>
}
export interface ElementPropertyOverrideReset {
  readonly target: ElementPropertyTarget
  readonly keys: readonly string[]
}
export interface ElementPropertySharing {
  readonly target: ElementPropertyTarget
  readonly sourceId: string
}
export interface ElementPropertyIntentAPIs {
  readElementPropertyTargets: (
    targets: readonly ElementPropertyTarget[]
  ) => readonly PropertyTargetView[]
  updateElementPropertyTargets: (
    updates: readonly ElementPropertyOverride[],
    options?: EVENT_OPTIONS
  ) => readonly string[]
  updateSharedPropertySources: (
    updates: readonly SharedPropertySourceUpdate[],
    options?: EVENT_OPTIONS
  ) => readonly string[]
  resetElementPropertyOverrides: (
    updates: readonly ElementPropertyOverrideReset[],
    options?: EVENT_OPTIONS
  ) => readonly string[]
  detachElementPropertyTargets: (
    targets: readonly ElementPropertyTarget[],
    options?: EVENT_OPTIONS
  ) => readonly string[]
  shareElementPropertyTargets: (
    updates: readonly ElementPropertySharing[],
    options?: EVENT_OPTIONS
  ) => readonly string[]
}
