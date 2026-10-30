import {
  assertRenderEngineCapabilities,
  RenderEngineCapabilities,
  type RenderEngine,
  type RenderEngineObjectHandle,
  type RenderEnginePoint,
  type RenderEngineSpatialHit,
  type RenderEngineSpatialProjection,
  type SpatialRay,
  type SpatialVector
} from '@asyra/render-engine'
import type { RenderNode } from '../types/render-object.js'
export interface SpatialHit {
  readonly visualId: string
  readonly elementId?: string
  readonly instanceIndex?: number
  readonly instanceId?: string
  readonly distance: number
  readonly point: SpatialVector
}
export type SpatialPick =
  | { readonly kind: 'overlay'; readonly elementId: string }
  | { readonly kind: 'spatial'; readonly hit: SpatialHit }
  | null
/** Maps registered Render identity without exposing SDK objects or engine handles. */
export class SpatialQueries {
  constructor(
    private readonly engine: RenderEngine,
    private readonly nodes: () => readonly RenderNode[],
    private readonly resolve: (
      handle: RenderEngineObjectHandle
    ) => RenderNode | null,
    private readonly surface: (
      point: RenderEnginePoint
    ) => RenderEnginePoint | null
  ) {
    assertRenderEngineCapabilities(engine, [
      RenderEngineCapabilities.SPATIAL_QUERIES
    ])
  }
  private handle(id: string): RenderEngineObjectHandle {
    const nodes = this.nodes().filter(
      (node) =>
        node.projectionIdentity?.visualId === id && node.getEngineHandle()
    )
    if (typeof id !== 'string' || !id || nodes.length !== 1) {
      throw new Error('Unknown or ambiguous spatial visual identity')
    }
    const handle = nodes[0].getEngineHandle()
    if (!handle || this.resolve(handle) !== nodes[0]) {
      throw new Error('Retired spatial visual identity')
    }
    return handle
  }
  private hit(hit: RenderEngineSpatialHit): SpatialHit {
    const node = this.resolve(hit.object),
      identity = node?.projectionIdentity
    if (!identity) {
      throw new Error('Unregistered spatial query target')
    }
    if (this.handle(identity.visualId) !== hit.object) {
      throw new Error('Retired spatial query target')
    }
    return {
      ...identity,
      ...(hit.instanceIndex === undefined
        ? {}
        : { instanceIndex: hit.instanceIndex }),
      ...(hit.instanceId === undefined ? {} : { instanceId: hit.instanceId }),
      distance: hit.distance,
      point: [...hit.point]
    }
  }
  project(point: SpatialVector): RenderEngineSpatialProjection {
    const result = this.engine.query({ type: 'spatial-project', point })
    if (result.type !== 'spatial-projection') {
      throw new Error('Invalid spatial projection result')
    }
    return result
  }
  ray(point: RenderEnginePoint): SpatialRay | null {
    const local = this.surface(point)
    if (!local) {
      return null
    }
    const result = this.engine.query({ type: 'spatial-ray', point: local })
    if (result.type !== 'spatial-ray') {
      throw new Error('Invalid spatial ray result')
    }
    return result.ray
  }
  raycast(ray: SpatialRay): readonly SpatialHit[] {
    const result = this.engine.query({ type: 'spatial-raycast', ray })
    if (result.type !== 'spatial-hits') {
      throw new Error('Invalid spatial hit result')
    }
    return result.hits.map((hit) => this.hit(hit))
  }
  convert(
    visualId: string,
    point: SpatialVector,
    to: 'local' | 'world',
    instanceIndex?: number
  ): SpatialVector {
    const result = this.engine.query({
      type: 'spatial-convert',
      object: this.handle(visualId),
      point,
      to,
      instanceIndex
    })
    if (result.type !== 'spatial-point') {
      throw new Error('Invalid spatial conversion result')
    }
    return result.point
  }
  bounds(visualId: string, space: 'local' | 'world', instanceIndex?: number) {
    const result = this.engine.query({
      type: 'spatial-bounds',
      object: this.handle(visualId),
      space,
      instanceIndex
    })
    if (result.type !== 'spatial-bounds') {
      throw new Error('Invalid spatial bounds result')
    }
    return result.bounds
  }
  pick(point: RenderEnginePoint): SpatialPick {
    const local = this.surface(point)
    if (!local) {
      return null
    }
    const result = this.engine.query({ type: 'spatial-pick', point: local })
    if (result.type !== 'spatial-pick') {
      throw new Error('Invalid spatial pick result')
    }
    if (result.overlay) {
      let node = this.resolve(result.overlay)
      if (!node) {
        throw new Error('Unregistered screen target')
      }
      while (!node.interactionIdentity && node.parent) {
        node = node.parent
      }
      const id = node.interactionIdentity
      if (!id) {
        throw new Error('Screen target has no interaction identity')
      }
      return { kind: 'overlay', elementId: id }
    }
    return result.hit ? { kind: 'spatial', hit: this.hit(result.hit) } : null
  }
}
