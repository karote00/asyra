import type { RenderEnginePoint } from './types.js'

/** Straight (not premultiplied) RGBA channels in [0, 1]. */
export type RenderEngineColor = readonly [number, number, number, number]

export interface RenderEngineGradientStop {
  readonly position: number
  readonly color: RenderEngineColor
}

export type RenderEngineMeshFill =
  | Readonly<{ kind: 'solid'; color: RenderEngineColor }>
  | Readonly<{
      kind: 'gradient'
      type: 'linear' | 'radial' | 'angular' | 'diamond'
      start: RenderEnginePoint
      end: RenderEnginePoint
      side?: RenderEnginePoint
      stops: readonly RenderEngineGradientStop[]
    }>

/** Ordered source-over layers; coordinates are shared by every mesh face. */
export interface RenderEngineMeshMaterial {
  readonly fills: readonly RenderEngineMeshFill[]
}
