import {
  BatchGeometry,
  Batcher,
  BatcherPipe,
  type BatchableElement,
  BatchableMesh,
  DefaultBatcher,
  ExtensionType,
  Mesh,
  extensions,
  type BatcherOptions,
  type InstructionSet,
  type Renderer,
  type RenderPipe
} from 'pixi.js'
import { meshMaterialSources } from './mesh-material-resources.js'
import { createMeshMaterialShader } from './mesh-material-shader.js'

const materialBatchName = 'analytic-mesh-material'

export class MeshMaterialBatcher extends Batcher {
  static extension = { type: ExtensionType.Batcher, name: materialBatchName }
  readonly name = materialBatchName
  readonly geometry = new BatchGeometry()
  readonly vertexSize = 6
  shader: ReturnType<typeof createMeshMaterialShader>

  // The standard vertex layout and packing remain owned by Pixi.
  packAttributes(...args: Parameters<DefaultBatcher['packAttributes']>): void {
    DefaultBatcher.prototype.packAttributes(...args)
    this.markMaterial(args[0], args[2], args[3], args[0].attributeSize)
  }
  packQuadAttributes(
    ...args: Parameters<DefaultBatcher['packQuadAttributes']>
  ): void {
    DefaultBatcher.prototype.packQuadAttributes(...args)
    this.markMaterial(args[0], args[2], args[3], 4)
  }
  private markMaterial(
    element: BatchableElement,
    attributes: Uint32Array,
    offset: number,
    count: number
  ): void {
    if (!meshMaterialSources.has(element.texture.source)) return
    for (let i = 0; i < count; i++) attributes[offset + i * 6 + 5] |= 2
  }
  override destroy(): void {
    super.destroy({ shader: true })
  }

  constructor(options: BatcherOptions) {
    super(options)
    this.shader = createMeshMaterialShader(options.maxTextures)
  }
}

export class MaterialMesh extends Mesh {
  override readonly renderPipeId = materialBatchName

  setBatching(enabled: boolean): void {
    const mode = enabled ? 'auto' : 'no-batch'
    if (this.geometry.batchMode === mode) return
    this.geometry.batchMode = mode
    this.onViewUpdate()
  }
}

/** Engine-owned pipe state; no access to MeshPipe's private caches. */
export class MeshMaterialPipe implements RenderPipe<MaterialMesh> {
  static extension = {
    type: [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes],
    name: materialBatchName
  }
  private entries = new WeakMap<
    MaterialMesh,
    {
      element: BatchableMesh
      indexSize: number
      attributeSize: number
      batchMode: string
    }
  >()

  constructor(private renderer: Renderer) {}

  private getEntry(mesh: MaterialMesh) {
    let entry = this.entries.get(mesh)
    if (!entry) {
      const element = new BatchableMesh()
      element.batcherName = materialBatchName
      element.renderable = mesh
      element.transform = mesh.groupTransform
      entry = {
        element,
        indexSize: 0,
        attributeSize: 0,
        batchMode: mesh.geometry.batchMode
      }
      this.entries.set(mesh, entry)
    }
    entry.element.geometry = mesh.geometry
    entry.element.setTexture(mesh.texture)
    entry.element.roundPixels =
      mesh.roundPixels || this.renderer.roundPixels ? 1 : 0
    return entry
  }

  validateRenderable(mesh: MaterialMesh): boolean {
    const entry = this.getEntry(mesh)
    if (
      entry.batchMode !== mesh.geometry.batchMode ||
      entry.indexSize !== mesh.geometry.indices.length ||
      entry.attributeSize !== mesh.geometry.positions.length
    )
      return true
    return !entry.element._batcher?.checkAndUpdateTexture(
      entry.element,
      mesh.texture
    )
  }

  addRenderable(mesh: MaterialMesh, instructions: InstructionSet): void {
    const entry = this.getEntry(mesh)
    entry.batchMode = mesh.geometry.batchMode
    entry.indexSize = mesh.geometry.indices.length
    entry.attributeSize = mesh.geometry.positions.length
    const batch = this.renderer.renderPipes.batch
    const isolated = mesh.geometry.batchMode === 'no-batch'
    if (isolated) batch.break(instructions)
    batch.addToBatch(entry.element, instructions)
    if (isolated) batch.break(instructions)
  }

  updateRenderable(mesh: MaterialMesh): void {
    const entry = this.getEntry(mesh)
    entry.element._batcher.updateElement(entry.element)
  }

  destroyRenderable(mesh: MaterialMesh): void {
    this.entries.get(mesh)?.element.reset()
    this.entries.delete(mesh)
  }

  destroy(): void {
    this.entries = new WeakMap()
  }
}

/** Shared public submission boundary keeps ordinary strokes/images in order. */
export class MeshMaterialBatchPipe extends BatcherPipe {
  override addToBatch(
    element: BatchableElement,
    instructions: InstructionSet
  ): void {
    if (element.batcherName === 'default')
      element.batcherName = materialBatchName
    super.addToBatch(element, instructions)
  }
}

// Named pipe registration preserves the first entry. Replace through the public
// extension lifecycle before renderer construction; adding alone is ignored.
extensions.remove({
  type: [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes],
  name: 'batch'
})
extensions.add(MeshMaterialBatcher, MeshMaterialPipe, {
  type: [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes],
  name: 'batch',
  ref: MeshMaterialBatchPipe
})
