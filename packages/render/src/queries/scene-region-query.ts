import { emitDiagnosticCounter } from '@asyra/utils'
import type { RenderNode, RenderBounds } from '../types/render-object.js'
import { RegionIndex, assertRegionBounds } from './region-index.js'

/** Runtime-owned workspace extents; canonical IDs and permissions remain with the caller. */
export class SceneRegionQuery {
  private readonly index = new RegionIndex<RenderNode>()
  private readonly dirty = new Set<RenderNode>()
  private readonly subtrees = new Set<RenderNode>()
  private order: Map<RenderNode, number> | null = null

  constructor(
    private readonly root: RenderNode,
    readonly includes: (node: RenderNode) => boolean
  ) {
    this.subtrees.add(root)
  }

  private contains(node: RenderNode): boolean {
    for (
      let current: RenderNode | null = node;
      current;
      current = current.parent
    )
      if (current === this.root) return true
    return false
  }

  change(node: RenderNode, descendants = false): void {
    if (node === this.root) {
      if (descendants) this.subtrees.add(node)
      return
    }
    if (!this.contains(node)) return
    if (descendants) this.subtrees.add(node)
    for (
      let current: RenderNode | null = node;
      current && current !== this.root;
      current = current.parent
    )
      this.dirty.add(current)
  }

  membership(parent: RenderNode, child: RenderNode): void {
    if (!this.contains(parent) && !this.contains(child)) return
    this.subtrees.add(child)
    this.change(parent)
    if (this.includesSubtree(child)) this.order = null
  }

  reorder(parent: RenderNode, child: RenderNode): void {
    if (this.contains(parent) && this.includesSubtree(child)) this.order = null
  }

  private includesSubtree(node: RenderNode): boolean {
    const pending = [node]
    while (pending.length) {
      const current = pending.pop()
      if (!current) break
      if (this.includes(current)) return true
      for (const child of current.children) pending.push(child)
    }
    return false
  }

  forget(node: RenderNode): void {
    const indexed = this.index.has(node)
    this.index.delete(node)
    this.dirty.delete(node)
    this.subtrees.delete(node)
    if (indexed) this.order = null
  }

  query(bounds: RenderBounds): RenderNode[] {
    assertRegionBounds(bounds)
    const visit = (node: RenderNode, fn: (node: RenderNode) => void) => {
      const pending = [node]
      while (pending.length) {
        const current = pending.pop()
        if (!current) break
        fn(current)
        for (let i = current.children.length - 1; i >= 0; i--)
          pending.push(current.children[i])
      }
    }
    for (const root of this.subtrees) {
      let ancestor = root.parent
      while (ancestor && !this.subtrees.has(ancestor))
        ancestor = ancestor.parent
      if (ancestor) continue
      visit(root, (node) => {
        if (node !== this.root) this.dirty.add(node)
      })
    }
    this.subtrees.clear()
    let measured = 0
    for (const node of this.dirty) {
      if (
        !this.contains(node) ||
        !node.getEngineHandle() ||
        !this.includes(node)
      )
        this.index.delete(node)
      else {
        this.index.set(
          node,
          node.getBoundsRelativeTo(this.root.parent ?? this.root)
        )
        measured++
      }
    }
    this.dirty.clear()
    emitDiagnosticCounter('region-query:bounds-read', measured)
    if (!this.order) {
      const order = new Map<RenderNode, number>()
      // Postorder gives children before parents while preserving sibling order.
      const pending: [RenderNode, boolean][] = [[this.root, false]]
      while (pending.length) {
        const entry = pending.pop()
        if (!entry) break
        const [node, expanded] = entry
        if (expanded) {
          order.set(node, order.size)
          continue
        }
        pending.push([node, true])
        for (let i = node.children.length - 1; i >= 0; i--)
          pending.push([node.children[i], false])
      }
      this.order = order
      emitDiagnosticCounter('region-query:order-visit', order.size)
    }
    const candidates = this.index.query(bounds)
    emitDiagnosticCounter('region-query:cell-visit', candidates.visitedCells)
    emitDiagnosticCounter(
      'region-query:candidate-check',
      candidates.checkedEntries
    )
    const order = this.order
    const position = (node: RenderNode) => {
      const value = order.get(node)
      if (value === undefined)
        throw new Error('Region candidate is outside current document order')
      return value
    }
    return candidates.values
      .filter((node) => {
        for (
          let current: RenderNode | null = node;
          current && current !== this.root;
          current = current.parent
        )
          if (!current.visible || !current.renderable) return false
        return true
      })
      .sort((a, b) => position(a) - position(b))
  }
}
