import {
  Container,
  Graphics,
  Matrix,
  updateRenderGroupTransforms
} from 'pixi.js'

export type ProjectionMode = 'ordinary' | 'isolated' | 'retained'
export type ProbeGroup = 'source' | 'target'
export interface ProbeMove {
  id: number
  parent: ProbeGroup
  x: number
  y: number
}

/** Bounded two-parent projection experiment, never a production renderer.
 * Logical groups own membership/coordinates; native paint roots own resources.
 * The deliberately small input vocabulary is not a replacement SceneTree.
 */
export class RetainedHierarchyProbe {
  readonly scene = new Container({ isRenderGroup: true })

  readonly groups = {
    source: new Container(),
    target: new Container({ x: 40, y: 60 })
  }

  readonly roots: Graphics[] = []

  readonly leaves: Graphics[] = []

  readonly members = { source: new Set<number>(), target: new Set<number>() }

  readonly work = { classified: 0, orderChecks: 0 }

  private readonly positions: { parent: ProbeGroup; x: number; y: number }[] =
    []

  private readonly dirty = new Set<number>()

  private orderDirty = false

  constructor(
    readonly mode: ProjectionMode,
    count = 4,
    perRoot = 1000
  ) {
    if (mode === 'isolated') {
      this.groups.source.enableRenderGroup()
      this.groups.target.enableRenderGroup()
    }

    this.scene.addChild(this.groups.source, this.groups.target)
    for (let id = 0; id < count; id++) {
      const root = new Graphics({ isRenderGroup: mode === 'isolated' })

      for (let i = 0; i < perRoot; i++) {
        const ordinal = id * perRoot + i
        const leaf = new Graphics()
          .rect(0, 0, 6, 6)
          .fill(ordinal % 2 ? 0x2288cc : 0x66bb99)

        leaf.position.set((ordinal % 80) * 8, Math.floor(ordinal / 80) * 8)
        root.addChild(leaf)
        this.leaves.push(leaf)
      }

      this.roots.push(root)
      this.positions.push({ parent: 'source', x: 0, y: 0 })
      this.members.source.add(id)
      if (mode === 'retained') {
        this.scene.addChild(root)
      } else {
        this.groups.source.addChild(root)
      }
    }

    this.updateTransforms()
  }

  accept(moves: readonly ProbeMove[]): void {
    for (const move of moves) {
      const previous = this.positions[move.id]

      if (!previous) {
        throw new Error('Unknown drawable root')
      }

      if (previous.parent !== move.parent) {
        this.members[previous.parent].delete(move.id)
        this.members[move.parent].add(move.id)
        this.orderDirty = true
      }

      this.positions[move.id] = { parent: move.parent, x: move.x, y: move.y }
      this.dirty.add(move.id)
    }
  }

  moveGroup(group: ProbeGroup, x: number, y: number): void {
    this.groups[group].position.set(x, y)
    for (const id of this.members[group]) {
      this.dirty.add(id)
    }
  }

  removeEmptyGroup(group: ProbeGroup): void {
    if (this.members[group].size) {
      throw new Error('Group still owns content')
    }

    this.groups[group].destroy()
  }

  flush(): void {
    for (const id of this.dirty) {
      this.work.classified++
      const { parent, x, y } = this.positions[id]
      const group = this.groups[parent]
      const root = this.roots[id]

      if (this.mode === 'retained') {
        group.updateLocalTransform()
        const world = group.localTransform
          .clone()
          .append(new Matrix(1, 0, 0, 1, x, y))

        root.updateLocalTransform()
        const old = root.localTransform

        if (
          old.a !== world.a ||
          old.b !== world.b ||
          old.c !== world.c ||
          old.d !== world.d ||
          old.tx !== world.tx ||
          old.ty !== world.ty
        ) {
          root.setFromMatrix(world)
        }
      } else {
        if (root.parent !== group) {
          group.addChild(root)
        }

        root.position.set(x, y)
      }
    }

    if (this.orderDirty && this.mode === 'retained') {
      let index = Object.values(this.groups).filter(
        (group) => !group.destroyed
      ).length

      for (const id of [...this.members.source, ...this.members.target]) {
        this.work.orderChecks++
        const root = this.roots[id]

        if (this.scene.children[index] !== root) {
          this.scene.setChildIndex(root, index)
        }

        index++
      }
    }

    this.dirty.clear()
    this.orderDirty = false
  }

  updateTransforms(): void {
    this.flush()
    const group = this.scene.renderGroup

    if (!group) {
      throw new Error('Missing scene render domain')
    }

    updateRenderGroupTransforms(group, true)
  }

  bounds(group: ProbeGroup): {
    x: number
    y: number
    width: number
    height: number
  } {
    this.flush()
    if (this.mode !== 'retained') {
      return { ...this.groups[group].getLocalBounds().rectangle }
    }

    this.groups[group].updateLocalTransform()
    const inverse = this.groups[group].localTransform.clone().invert()
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    for (const id of this.members[group]) {
      const root = this.roots[id]

      root.updateLocalTransform()
      const matrix = inverse.clone().append(root.localTransform)
      const bounds = root.getLocalBounds()

      for (const x of [bounds.x, bounds.x + bounds.width]) {
        for (const y of [bounds.y, bounds.y + bounds.height]) {
          const point = matrix.apply({ x, y })

          minX = Math.min(minX, point.x)
          minY = Math.min(minY, point.y)
          maxX = Math.max(maxX, point.x)
          maxY = Math.max(maxY, point.y)
        }
      }
    }

    if (!Number.isFinite(minX)) {
      throw new Error('No logical content')
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  captureTarget(group: ProbeGroup): {
    target: Container
    clones: number
    release: () => void
  } {
    this.flush()
    if (this.mode !== 'retained') {
      return {
        target: this.groups[group],
        clones: 0,

        release: () => undefined
      }
    }

    const target = new Container()
    let clones = 0

    const copy = (original: Graphics): Graphics => {
      // Share prepared paint; do not use clone(), which changes context ownership
      // on the live Graphics in this SDK version.
      const result = new Graphics(original.context)

      try {
        clones++
        original.updateLocalTransform()
        result.setFromMatrix(original.localTransform)
        result.alpha = original.alpha
        result.visible = original.visible
        result.blendMode = original.blendMode
        for (const child of original.children) {
          if (!(child instanceof Graphics)) {
            throw new Error('Probe supports Graphics paint only')
          }

          result.addChild(copy(child))
        }
      } catch (error) {
        result.destroy({ children: true, context: false })
        throw error
      }

      return result
    }

    try {
      this.groups[group].updateLocalTransform()
      const inverse = this.groups[group].localTransform.clone().invert()

      for (const id of this.members[group]) {
        const original = this.roots[id]
        const root = copy(original)

        root.setFromMatrix(inverse.clone().append(original.localTransform))
        target.addChild(root)
      }

      return {
        target,
        clones,

        release: () => target.destroy({ children: true, context: false })
      }
    } catch (error) {
      target.destroy({ children: true, context: false })
      throw error
    }
  }

  dispose(): void {
    this.scene.destroy({ children: true })
  }
}
