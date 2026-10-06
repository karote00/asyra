import { Container, Graphics, Mesh } from 'pixi.js'

const PARTITION_CHILD_LIMIT = 128

/** SDK-only identity containers bound batch invalidation while preserving the
 * logical hierarchy exposed by opaque engine handles. Camera motion changes
 * their group transforms, not their retained vertex buffers.
 */
export class PixiBatchPartitions {
  private readonly partitions = new Map<Container, Container[]>()
  private readonly partitionParents = new WeakMap<Container, Container>()

  append(parent: Container, child: Container): void {
    const previous = this.parentOf(child)
    if (previous) this.remove(previous, child)
    let blocks = this.partitions.get(parent)
    if (!blocks) {
      if (
        parent instanceof Graphics ||
        parent instanceof Mesh ||
        parent.children.length < PARTITION_CHILD_LIMIT
      ) {
        parent.addChild(child)
        return
      }
      const existing = [...parent.children]
      blocks = []
      this.partitions.set(parent, blocks)
      const block = this.createBlock(parent, blocks, 0)
      existing.forEach((node) => block.addChild(node))
    }
    let tail = blocks[blocks.length - 1]
    if (!tail || tail.children.length >= PARTITION_CHILD_LIMIT) {
      tail = this.createBlock(parent, blocks, blocks.length)
    }
    tail.addChild(child)
  }

  remove(parent: Container, child: Container): void {
    const blocks = this.partitions.get(parent)
    const block = child.parent
    if (!blocks || !block || this.partitionParents.get(block) !== parent) {
      parent.removeChild(child)
      return
    }
    block.removeChild(child)
    if (block.children.length === 0) this.removeBlock(parent, blocks, block)
  }

  setIndex(parent: Container, child: Container, index: number): void {
    const blocks = this.partitions.get(parent)
    if (!blocks) {
      parent.setChildIndex(child, index)
      return
    }
    const count = blocks.reduce((sum, block) => sum + block.children.length, 0)
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= count ||
      this.parentOf(child) !== parent
    ) {
      throw new Error('Invalid render child index or parent')
    }
    let current = 0
    for (const block of blocks) {
      if (block === child.parent) {
        current += block.getChildIndex(child)
        break
      }
      current += block.children.length
    }
    if (current === index) return
    this.remove(parent, child)
    let offset = index
    let blockIndex = 0
    while (
      blockIndex < blocks.length &&
      offset > blocks[blockIndex].children.length
    ) {
      offset -= blocks[blockIndex].children.length
      blockIndex++
    }
    let block = blocks[blockIndex]
    if (!block) {
      block = this.createBlock(parent, blocks, blocks.length)
      offset = 0
    } else if (block.children.length >= PARTITION_CHILD_LIMIT) {
      const right = this.createBlock(parent, blocks, blockIndex + 1)
      // Split without moving any later partition or changing its GPU buffers.
      const split = Math.max(1, Math.min(block.children.length - 1, offset))
      const suffix = block.children.slice(split)
      block.removeChildren(split)
      suffix.forEach((node) => right.addChild(node))
      if (offset >= split) {
        block = right
        offset -= split
      }
    }
    block.addChildAt(child, offset)
  }

  parentOf(child: Container): Container | null {
    const parent = child.parent
    return parent ? (this.partitionParents.get(parent) ?? parent) : null
  }

  dispose(parent: Container): void {
    const blocks = this.partitions.get(parent)
    if (!blocks) return
    for (const block of [...blocks]) {
      block.removeChildren()
      this.removeBlock(parent, blocks, block)
    }
    this.partitions.delete(parent)
  }

  private createBlock(
    parent: Container,
    blocks: Container[],
    index: number
  ): Container {
    const block = new Container({ isRenderGroup: true, eventMode: 'passive' })
    this.partitionParents.set(block, parent)
    blocks.splice(index, 0, block)
    parent.addChildAt(block, index)
    return block
  }

  private removeBlock(
    parent: Container,
    blocks: Container[],
    block: Container
  ): void {
    blocks.splice(blocks.indexOf(block), 1)
    this.partitionParents.delete(block)
    parent.removeChild(block)
    block.destroy({ children: false })
    // Keep the live parent's empty state: the next insertion still uses it.
  }
}
