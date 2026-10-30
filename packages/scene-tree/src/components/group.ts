import type {
  GroupRawData,
  GroupAttrs,
  ElementInstanceTypes,
  IGroupElement,
  ElementRawData
} from '@asyra/utils'
import { IDTypes, NameTypes, emitDiagnosticCounter } from '@asyra/utils'
import type { PropsManager } from '@asyra/props-manager'
import Element from './element.js'

type GroupDataType = Partial<GroupRawData>

// Canonical membership is owned here; public arrays are lazy, stable snapshots.
const memberships = new WeakMap<
  object,
  { ids: string[]; snapshot?: string[] }
>()

class Group<T extends GroupAttrs = GroupAttrs>
  extends Element<T>
  implements IGroupElement<T>
{
  constructor(
    data?: Partial<ElementRawData>,
    idPrefix?: string,
    namePrefix?: string,
    propsManager?: PropsManager
  ) {
    super(
      data,
      idPrefix || IDTypes.GROUP,
      namePrefix || NameTypes.GROUP,
      propsManager
    )
  }

  _init(): void {
    super._init()
    const membership = {
      ids: [] as string[],
      snapshot: undefined as string[] | undefined
    }
    memberships.set(this, membership)
    Object.defineProperty(this.data, 'children', {
      enumerable: true,
      configurable: true,
      get: () => {
        if (!membership.snapshot) {
          membership.snapshot = [...membership.ids]
          emitDiagnosticCounter(
            'scene-tree:membership:snapshot-items',
            membership.ids.length
          )
        }
        return membership.snapshot
      },
      set: (children: string[]) => {
        membership.ids = [...children]
        membership.snapshot = undefined
      }
    })
  }

  load(data: GroupDataType): void {
    super.load(data)
    this.data.children = (data.children as string[]) || []
  }

  /**
   * Scene Tree batch-owner write. Ordered ADD_ELEMENT changes provide the
   * external transaction and replay evidence for this membership replacement.
   */
  replaceChildrenFromCanonicalBatch(children: readonly string[]): void {
    this.data.children = children as string[]
  }

  private canonicalMembership() {
    const membership = memberships.get(this)
    if (!membership) {
      throw new Error('[Group] Canonical membership is not initialized')
    }
    return membership
  }

  getCanonicalChildCount(): number {
    return this.canonicalMembership().ids.length
  }

  insertChildrenFromCanonicalBatch(
    index: number,
    ids: readonly string[]
  ): void {
    const membership = this.canonicalMembership()
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > membership.ids.length
    ) {
      throw new Error('[Group] Invalid canonical insertion index')
    }
    const previousLength = membership.ids.length
    // Move a middle insertion's suffix once, without argument-count limits.
    membership.ids.length += ids.length
    for (let cursor = previousLength - 1; cursor >= index; cursor--) {
      membership.ids[cursor + ids.length] = membership.ids[cursor]
    }
    for (let offset = 0; offset < ids.length; offset++) {
      membership.ids[index + offset] = ids[offset]
    }
    membership.snapshot = undefined
    emitDiagnosticCounter('scene-tree:membership:inserted-items', ids.length)
    emitDiagnosticCounter(
      'scene-tree:membership:moved-items',
      previousLength - index
    )
  }

  removeChildrenFromCanonicalBatch(ids: readonly string[]): void {
    const membership = this.canonicalMembership()
    const removed = new Set(ids)
    membership.ids = membership.ids.filter((id) => !removed.has(id))
    membership.snapshot = undefined
    emitDiagnosticCounter('scene-tree:membership:recovery-items', ids.length)
  }

  save(): GroupRawData {
    const data = super.save() as GroupRawData
    data.children = this.data.children
    return data
  }

  addElement(element: ElementInstanceTypes, index = -1) {
    if (!element) {
      return
    }

    const children = [...this.get('children')]
    const idx = index > -1 ? index : children.length
    children.splice(idx, 0, element.get('id'))
    this.set('children', children)
    element.set('parentId', this.get('id'), { undoable: false })
  }

  removeElement(element: ElementInstanceTypes) {
    if (!element) {
      return
    }

    const children = [...this.get('children')]
    const index = children.indexOf(element.get('id'))
    if (index < 0) {
      return
    }

    children.splice(index, 1)
    this.set('children', children)
    element.set('parentId', '', { undoable: false })
  }
}

export default Group
