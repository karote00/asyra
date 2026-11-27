import { workspaceParts, type WorkspacePartId } from './component-registry.js'
import type { ComponentHandle } from './editor-types.js'

type NativeId = Exclude<WorkspacePartId, `action.${string}`>
interface ComponentOwner {
  getUI(id: NativeId): ComponentHandle
}

interface NativeComponent<Id extends NativeId> {
  readonly id: Id
  mount(editor: ComponentOwner, target: HTMLElement): () => void
}

function nativeComponents() {
  // Action items are supplied by each editor. The static registry contains
  // all native group and leaf IDs, including groups with no native children.
  const ids = new Set([
    ...Object.keys(workspaceParts),
    ...Object.values(workspaceParts).flat()
  ])

  return Object.freeze(
    Object.fromEntries(
      Array.from(ids, (id) => [
        id,
        Object.freeze({
          id,

          mount(editor: ComponentOwner, target: HTMLElement) {
            return editor.getUI(id as NativeId).mount(target)
          }
        })
      ])
    )
  ) as { readonly [Id in NativeId]: NativeComponent<Id> }
}

/** Native Design components. Each placement belongs to the supplied editor. */
export const components = /* @__PURE__ */ nativeComponents()
