import {
  workspaceParts,
  type WorkspacePartId,
  type WorkspaceLayout
} from './component-registry.js'
import { inspectorRows } from './inspector-registry.js'
import type { ComponentHandle, GetWorkspaceUI } from './editor-types.js'
import type { createInspectorTemplates } from './inspector-templates.js'

import { createComponentOrder } from './component-order.js'
const catalog: Readonly<Record<string, readonly string[]>> = workspaceParts

export function createWorkspaceLayout(
  current: () => void,
  document: Document,
  templates: ReturnType<typeof createInspectorTemplates>,
  actionIds: readonly string[],
  getFrameDocument: () => Document | null,
  mountRow: (id: keyof typeof inspectorRows, target: HTMLElement) => () => void
) {
  const parts = {
    ...catalog,
    toolbarActions: actionIds.map((id) => 'action.' + id)
  }
  const parents = new Map<string, string>()

  for (const [parent, children] of Object.entries(parts)) {
    for (const child of children) {
      parents.set(child, parent)
    }
  }

  parents.set('gradient', 'fillPicker')
  parents.set('fillModes', 'fillPicker')
  parents.set('colorControls', 'appearance')
  const ids = Object.freeze([
    ...new Set([...Object.keys(parts), ...parents.keys()])
  ] as WorkspacePartId[])
  const mounts = new Map<string, { shadow: ShadowRoot; release(): void }>()
  const listeners = new Map<string, Set<() => void>>()
  const revisions = new Map<string, number>()

  function notify(id: string) {
    revisions.set(id, (revisions.get(id) ?? 0) + 1)
    listeners.get(id)?.forEach((fn) => fn())
  }

  const requests = new Map<string, number>()

  function placementChanged(id: string, delta: number) {
    let cursor: string | undefined = id

    while (cursor) {
      requests.set(cursor, (requests.get(cursor) ?? 0) + delta)
      notify(cursor)
      cursor = parents.get(cursor)
    }
  }

  const handles = new Map<string, ComponentHandle>()

  function containsComponent(
    root: string,
    child: string,
    seen = new Set<string>()
  ): boolean {
    if (root === child) {
      return true
    }

    if (seen.has(root)) {
      return false
    }

    seen.add(root)
    const nested = [...parents]
      .filter(([, parent]) => parent === root)
      .map(([id]) => id)

    for (const item of orders[root]?.api.getOrder() ?? []) {
      if (typeof item !== 'string' && handles.has(item.id)) {
        nested.push(item.id)
      }
    }

    return nested.some((id) => containsComponent(id, child, seen))
  }

  const orders: Record<
    string,
    ReturnType<typeof createComponentOrder>
  > = Object.fromEntries(
    Object.entries(parts).map(([id, children]) => [
      id,
      createComponentOrder(
        children,
        () => notify(id),
        current,
        (item) => {
          if (
            typeof item === 'string' ||
            !item ||
            handles.get(item.id) !== item
          ) {
            return item
          }

          if (children.includes(item.id)) {
            return item.id
          }

          if (containsComponent(item.id, id)) {
            throw new TypeError('A workspace component cannot contain itself')
          }

          return item
        }
      )
    ])
  )
  let toolbarOrder: readonly string[] | undefined

  function setToolbar(actions: readonly { id: string }[]) {
    const next = actions.map((action) => 'action.' + action.id)

    if (
      toolbarOrder?.length === next.length &&
      next.every((id, index) => toolbarOrder?.[index] === id)
    ) {
      return
    }

    toolbarOrder = next
    orders.toolbarActions.reset(next)
  }

  const layout: WorkspaceLayout = {
    subscribe(id, fn) {
      const set = listeners.get(id) ?? new Set()

      listeners.set(id, set)
      set.add(fn)

      return () => {
        set.delete(fn)
      }
    },

    revision: (id) => revisions.get(id) ?? 0,

    order: (id) => orders[id].api.getOrder(),

    target: (id) => mounts.get(id)?.shadow,

    requested: (id) => (requests.get(id) ?? 0) > 0
  }

  for (const id of ids) {
    const row = Object.hasOwn(inspectorRows, id)
      ? (id as keyof typeof inspectorRows)
      : undefined
    const handle = Object.freeze({
      ...(row ? templates.sources[row].api : orders[id]?.api),
      id,

      mount(target: HTMLElement) {
        current()
        const owner = target?.ownerDocument

        if (
          !owner?.defaultView ||
          !(target instanceof owner.defaultView.HTMLElement) ||
          (owner !== document && owner !== getFrameDocument())
        ) {
          throw new TypeError(
            'Expected an HTML target belonging to this editor or its host document'
          )
        }

        const previous = mounts.get(id)

        if (previous) {
          let node: Node | null = target

          while (node) {
            if (node === previous.shadow) {
              throw new TypeError(
                'A component cannot mount inside its own placement'
              )
            }

            node = node.parentNode ?? (node as ShadowRoot).host ?? null
          }
        }

        if (row) {
          return mountRow(row, target)
        }

        const host = owner.createElement('div')

        host.style.display = 'contents'
        const shadow = host.attachShadow({ mode: 'open' })
        const sheet = getFrameDocument()?.querySelector<HTMLLinkElement>(
          'link[rel="stylesheet"]'
        )

        if (sheet) {
          shadow.append(sheet.cloneNode())
        }

        const binding = {
          shadow,

          release() {
            host.remove()
            if (mounts.get(id) === binding) {
              mounts.delete(id)
              placementChanged(id, -1)
            }
          }
        }

        target.append(host)
        mounts.set(id, binding)
        previous?.release()
        placementChanged(id, previous ? 0 : 1)

        return binding.release
      }
    })

    handles.set(id, handle)
  }

  return {
    ids,
    layout,
    setToolbar,
    getUI: ((id: WorkspacePartId) => {
      current()
      const handle = handles.get(id)

      if (!handle) {
        throw new TypeError('Unknown workspace component: ' + id)
      }

      return handle
    }) as GetWorkspaceUI,

    dispose() {
      for (const mount of mounts.values()) {
        mount.release()
      }

      listeners.clear()
      for (const order of Object.values(orders)) {
        order.reset([])
      }
    }
  }
}
