import {
  PropertyTypes,
  StrokeJoinTypes,
  createDefaultStroke,
  emitDiagnosticCounter,
  isRecord,
  setElementGeometryLocalBounds
} from '@asyra/utils'
import type { FillAttrs, PositionData, StrokeAttrs } from '@asyra/utils'
import core, {
  VECTOR_TOKENS,
  RenderGraphics,
  type MeshProjection,
  type MeshProjectionPaint,
  isVectorAnchorNode as isAnchorNode,
  sortVectorItemsById,
  type EvenOddSegment,
  type EvenOddShape
} from '@asyra/core'
import type {
  ComponentDefinition,
  EngineNeutralRenderStrategy,
  VectorNetwork,
  VectorPointNode,
  VectorSegment
} from '@asyra/core'
import {
  DEFAULT_VECTOR_FILLS,
  getRenderableFill,
  toMeshProjectionPaint
} from './fills.js'
import { PRESET_REGISTRATION } from '../registration.js'
import { prepareVectorCompoundFill } from './vector-compound-fill.js'

const emitVectorRenderCounter = emitDiagnosticCounter

const normalizeRawPathTopologyFillRule = (
  value: unknown
): 'evenodd' | 'nonzero' => (value === 'evenodd' ? 'evenodd' : 'nonzero')

interface VectorComputedData {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
  points: Record<string, VectorPointNode>
  segments: Record<string, VectorSegment>
  networks: Record<string, VectorNetwork>
  closed: boolean
  pointCoordinateSpace?: 'workspace'
  fillRule: 'evenodd' | 'nonzero'
  fills: FillAttrs[]
  strokes?: StrokeAttrs[]
}

interface NormalizedVectorRenderDataInput {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: unknown
  scaleX?: unknown
  scaleY?: unknown
  skewX?: unknown
  skewY?: unknown
  points: Record<string, VectorPointNode>
  segments: Record<string, VectorSegment>
  networks: Record<string, VectorNetwork>
  closed: boolean
  pointCoordinateSpace?: unknown
  fillRule?: unknown
  fills?: unknown
  strokes?: unknown
}

const isNormalizedVectorRenderDataInput = (
  data: unknown
): data is NormalizedVectorRenderDataInput => {
  if (!isRecord(data)) {
    return false
  }
  if (
    typeof data.id !== 'string' ||
    typeof data.x !== 'number' ||
    !Number.isFinite(data.x) ||
    typeof data.y !== 'number' ||
    !Number.isFinite(data.y) ||
    typeof data.width !== 'number' ||
    !Number.isFinite(data.width) ||
    data.width < 0 ||
    typeof data.height !== 'number' ||
    !Number.isFinite(data.height) ||
    data.height < 0 ||
    typeof data.closed !== 'boolean'
  ) {
    return false
  }

  const points = data.points
  const segments = data.segments
  const networks = data.networks
  return (
    data.pointCoordinateSpace === 'workspace' &&
    isRecord(points) &&
    isRecord(segments) &&
    isRecord(networks)
  )
}

const normalizeVectorRenderData = (data: unknown): VectorComputedData => {
  if (isNormalizedVectorRenderDataInput(data)) {
    emitVectorRenderCounter('vector-render-normalize-fast-path-hit')
    const finiteOr = (value: unknown, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback
    return {
      ...data,
      rotation: finiteOr(data.rotation, 0),
      scaleX: finiteOr(data.scaleX, 1),
      scaleY: finiteOr(data.scaleY, 1),
      skewX: finiteOr(data.skewX, 0),
      skewY: finiteOr(data.skewY, 0),
      points: data.points,
      pointCoordinateSpace: 'workspace',
      fillRule: normalizeRawPathTopologyFillRule(data.fillRule),
      fills: Array.isArray(data.fills) ? data.fills : [],
      strokes: Array.isArray(data.strokes) ? data.strokes : []
    }
  }
  throw new Error('[Preset Vector] Render data must contain Vector geometry')
}

type Vec2 = PositionData

interface VectorRenderGeometryProjection {
  workspaceOrigin: PositionData
}

const vectorRenderGeometryProjectionCache = new WeakMap<
  object,
  VectorRenderGeometryProjection
>()

export const getVectorRenderLocalPoint = (
  renderElement: object,
  workspacePoint: PositionData
): PositionData | null => {
  const projection = vectorRenderGeometryProjectionCache.get(renderElement)
  return projection
    ? {
        x: workspacePoint.x - projection.workspaceOrigin.x,
        y: workspacePoint.y - projection.workspaceOrigin.y
      }
    : null
}

export const getVectorRenderWorkspacePoint = (
  renderElement: object,
  localPoint: PositionData
): PositionData | null => {
  const projection = vectorRenderGeometryProjectionCache.get(renderElement)
  return projection
    ? {
        x: localPoint.x + projection.workspaceOrigin.x,
        y: localPoint.y + projection.workspaceOrigin.y
      }
    : null
}

const getAnchorNode = (
  points: Record<string, VectorPointNode>,
  pointId: string | undefined
): VectorPointNode | null => {
  if (!pointId) {
    return null
  }

  const point = points[pointId]
  if (!isAnchorNode(point)) {
    return null
  }

  return point
}

const getControlNode = (
  points: Record<string, VectorPointNode>,
  pointId?: string | null
): VectorPointNode | null => {
  if (!pointId) {
    return null
  }

  const point = points[pointId]
  if (!point || point.kind !== VECTOR_TOKENS.POINT.KIND.CONTROL) {
    return null
  }

  return point
}

const MIN_VECTOR_RENDER_SIZE = 0.1

const cubicBezierPoint = (
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t: number
) => {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  }
}

const getCubicDerivativeRoots = (
  start: number,
  control1: number,
  control2: number,
  end: number
): readonly number[] => {
  const a = -start + 3 * control1 - 3 * control2 + end
  const b = 2 * (start - 2 * control1 + control2)
  const c = control1 - start
  if (Math.abs(a) <= Number.EPSILON) {
    if (Math.abs(b) <= Number.EPSILON) {
      return []
    }
    const root = -c / b
    return root > 0 && root < 1 ? [root] : []
  }

  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) {
    return []
  }
  const squareRoot = Math.sqrt(discriminant)
  return [(-b + squareRoot) / (2 * a), (-b - squareRoot) / (2 * a)].filter(
    (root) => root > 0 && root < 1
  )
}

const calculateVectorLocalBounds = (
  points: Record<string, VectorPointNode>,
  segments: Record<string, VectorSegment>,
  networks: readonly VectorNetwork[]
) => {
  const anchorIds = new Set<string>()
  const segmentIds = new Set<string>()
  networks.forEach((network) => {
    network.pointIds.forEach((pointId) => anchorIds.add(pointId))
    network.segmentIds.forEach((segmentId) => segmentIds.add(segmentId))
  })
  const anchors = [...anchorIds]
    .map((pointId) => points[pointId])
    .filter(isAnchorNode)
  if (anchors.length === 0) {
    return {
      x: 0,
      y: 0,
      width: MIN_VECTOR_RENDER_SIZE,
      height: MIN_VECTOR_RENDER_SIZE
    }
  }

  const bounds = {
    minX: anchors[0].x,
    minY: anchors[0].y,
    maxX: anchors[0].x,
    maxY: anchors[0].y
  }
  const include = (point: Vec2) => {
    bounds.minX = Math.min(bounds.minX, point.x)
    bounds.minY = Math.min(bounds.minY, point.y)
    bounds.maxX = Math.max(bounds.maxX, point.x)
    bounds.maxY = Math.max(bounds.maxY, point.y)
  }
  anchors.forEach(include)

  segmentIds.forEach((segmentId) => {
    const segment = segments[segmentId]
    if (!segment) {
      return
    }
    const start = getAnchorNode(points, segment.startId)
    const end = getAnchorNode(points, segment.endId)
    if (!start || !end) {
      return
    }
    const outControl = getControlNode(points, segment.outControlId) ?? start
    const inControl = getControlNode(points, segment.inControlId) ?? end
    const roots = new Set([
      ...getCubicDerivativeRoots(start.x, outControl.x, inControl.x, end.x),
      ...getCubicDerivativeRoots(start.y, outControl.y, inControl.y, end.y)
    ])
    roots.forEach((root) =>
      include(cubicBezierPoint(start, outControl, inControl, end, root))
    )
  })

  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX || MIN_VECTOR_RENDER_SIZE,
    height: bounds.maxY - bounds.minY || MIN_VECTOR_RENDER_SIZE
  }
}

const buildEvenOddShape = (
  orderedNetworks: VectorNetwork[],
  points: Record<string, VectorPointNode>,
  segments: Record<string, VectorSegment>,
  pointOffset: PositionData
): EvenOddShape => {
  const shape: EvenOddShape = { paths: [] }
  orderedNetworks.forEach((network) => {
    const segmentsList: EvenOddSegment[] = []
    network.segmentIds.forEach((segmentId) => {
      const segment = segments[segmentId]
      if (!segment) {
        return
      }

      const start = getAnchorNode(points, segment.startId)
      const end = getAnchorNode(points, segment.endId)
      if (!start || !end) {
        return
      }

      const outControl = getControlNode(points, segment.outControlId)
      const inControl = getControlNode(points, segment.inControlId)

      if (!outControl && !inControl) {
        segmentsList.push({
          type: 'line',
          points: [
            start.x - pointOffset.x,
            start.y - pointOffset.y,
            end.x - pointOffset.x,
            end.y - pointOffset.y
          ]
        })
      } else {
        segmentsList.push({
          type: 'cubicBezier',
          points: [
            start.x - pointOffset.x,
            start.y - pointOffset.y,
            (outControl?.x ?? start.x) - pointOffset.x,
            (outControl?.y ?? start.y) - pointOffset.y,
            (inControl?.x ?? end.x) - pointOffset.x,
            (inControl?.y ?? end.y) - pointOffset.y,
            end.x - pointOffset.x,
            end.y - pointOffset.y
          ]
        })
      }
    })

    if (segmentsList.length > 0) {
      shape.paths.push({ segments: segmentsList })
    }
  })

  return shape
}

const drawVectorNetworkPath = (
  graphic: Parameters<EngineNeutralRenderStrategy>[0],
  network: VectorNetwork,
  points: Record<string, VectorPointNode>,
  segments: Record<string, VectorSegment>,
  pointOffset: PositionData
) => {
  const first = getAnchorNode(points, network.pointIds[0])
  if (!first) {
    return
  }

  const linearPoints = [
    { x: first.x - pointOffset.x, y: first.y - pointOffset.y }
  ]
  let isLinear = true
  network.segmentIds.forEach((segmentId) => {
    const segment = segments[segmentId]
    if (!segment) {
      return
    }
    const start = getAnchorNode(points, segment.startId)
    const end = getAnchorNode(points, segment.endId)
    if (!start || !end) {
      return
    }
    const outControl = getControlNode(points, segment.outControlId)
    const inControl = getControlNode(points, segment.inControlId)
    if (outControl || inControl) {
      isLinear = false
      return
    }
    linearPoints.push({
      x: end.x - pointOffset.x,
      y: end.y - pointOffset.y
    })
  })
  if (isLinear && linearPoints.length > 1) {
    graphic.poly(linearPoints, network.closed)
    return
  }

  graphic.moveTo(first.x - pointOffset.x, first.y - pointOffset.y)

  network.segmentIds.forEach((segmentId) => {
    const segment = segments[segmentId]
    if (!segment) {
      return
    }

    const start = getAnchorNode(points, segment.startId)
    const end = getAnchorNode(points, segment.endId)
    if (!start || !end) {
      return
    }

    const outControl = getControlNode(points, segment.outControlId)
    const inControl = getControlNode(points, segment.inControlId)

    if (!outControl && !inControl) {
      graphic.lineTo(end.x - pointOffset.x, end.y - pointOffset.y)
      return
    }

    graphic.bezierCurveTo(
      (outControl?.x ?? start.x) - pointOffset.x,
      (outControl?.y ?? start.y) - pointOffset.y,
      (inControl?.x ?? end.x) - pointOffset.x,
      (inControl?.y ?? end.y) - pointOffset.y,
      end.x - pointOffset.x,
      end.y - pointOffset.y
    )
  })

  if (network.closed) {
    graphic.closePath()
  }
}

const drawVectorPath = (
  graphic: Parameters<EngineNeutralRenderStrategy>[0],
  orderedNetworks: VectorNetwork[],
  points: Record<string, VectorPointNode>,
  segments: Record<string, VectorSegment>,
  pointOffset: PositionData
) => {
  orderedNetworks.forEach((network) =>
    drawVectorNetworkPath(graphic, network, points, segments, pointOffset)
  )
}

const applyBaseVectorStroke = (
  graphic: Parameters<EngineNeutralRenderStrategy>[0],
  strokes: StrokeAttrs[],
  replayPath: () => void
): void => {
  for (const stroke of strokes) {
    if (!isRecord(stroke)) {
      continue
    }

    const width = stroke.width
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) {
      continue
    }

    const fill = getRenderableFill([stroke.fill])
    if (!fill || fill.kind !== 'solid') {
      continue
    }

    replayPath()
    graphic.stroke({ color: fill.color, alpha: fill.alpha, width })
    return
  }
}

interface VectorFillProjection {
  points: VectorComputedData['points']
  segments: VectorComputedData['segments']
  networks: VectorComputedData['networks']
  fillRule: VectorComputedData['fillRule']
  orderedNetworks: VectorNetwork[]
  bounds: ReturnType<typeof calculateVectorLocalBounds>
  coverage: ReturnType<typeof prepareVectorCompoundFill>
  projection: MeshProjection
  fills: FillAttrs[]
  paint: MeshProjectionPaint
  stroke?: RenderGraphics
}

const vectorFillProjections = new WeakMap<object, VectorFillProjection>()

const renderVectorGraphic = (
  graphic: Parameters<EngineNeutralRenderStrategy>[0],
  data: unknown
): void => {
  const renderData = normalizeVectorRenderData(data)
  const { points, segments, networks, fillRule, fills } = renderData
  let state = vectorFillProjections.get(graphic)
  const geometryChanged =
    !state ||
    state.points !== points ||
    state.segments !== segments ||
    state.networks !== networks ||
    state.fillRule !== fillRule
  const orderedNetworks =
    state && !geometryChanged
      ? state.orderedNetworks
      : sortVectorItemsById(Object.values(networks))
  const bounds =
    state && !geometryChanged
      ? state.bounds
      : calculateVectorLocalBounds(points, segments, orderedNetworks)
  const pointOffset = { x: bounds.x, y: bounds.y }
  const paint =
    state?.fills === fills ? state.paint : toMeshProjectionPaint(fills)
  const hasPaint = paint.kind === 'solid' || paint.material.fills.length > 0
  const coverage =
    state && !geometryChanged
      ? state.coverage
      : prepareVectorCompoundFill(
          buildEvenOddShape(orderedNetworks, points, segments, pointOffset),
          fillRule
        )
  const model = {
    polygons: coverage.faces,
    bounds: { minX: 0, minY: 0, maxX: bounds.width, maxY: bounds.height }
  }
  if (!state) {
    state = {
      points,
      segments,
      networks,
      fillRule,
      orderedNetworks,
      bounds,
      coverage,
      fills,
      paint,
      projection: core.createMeshProjection({ model, paint })
    }
    state.projection.attach(graphic)
    vectorFillProjections.set(graphic, state)
  } else {
    if (geometryChanged) state.projection.update({ model, paint })
    else if (state.paint !== paint) state.projection.updatePaint(paint)
    Object.assign(state, {
      points,
      segments,
      networks,
      fillRule,
      orderedNetworks,
      bounds,
      coverage,
      fills,
      paint
    })
  }
  graphic.clear()
  graphic.batched = true
  graphic.hitArea = hasPaint ? { contains: coverage.contains } : null
  state.projection.setVisible(coverage.faces.length > 0 && hasPaint)
  graphic.setSourceSpaceOrigin(pointOffset)
  vectorRenderGeometryProjectionCache.set(graphic, {
    workspaceOrigin: pointOffset
  })
  setElementGeometryLocalBounds(
    graphic as Parameters<typeof setElementGeometryLocalBounds>[0],
    { x: 0, y: 0, width: bounds.width, height: bounds.height }
  )
  graphic.x = renderData.x
  graphic.y = renderData.y
  graphic.rotation = renderData.rotation
  graphic.width = renderData.width
  graphic.height = renderData.height
  graphic.scale.set(renderData.scaleX, renderData.scaleY)
  graphic.skew.set(renderData.skewX, renderData.skewY)

  // Unfilled paths keep their ordinary graphics path. A filled path's stroke
  // is a later child, above its mesh; material changes cannot reverse order.
  const hasFill = hasPaint && coverage.faces.length > 0
  if (!hasFill)
    applyBaseVectorStroke(graphic, renderData.strokes ?? [], () =>
      drawVectorPath(graphic, orderedNetworks, points, segments, pointOffset)
    )
  if (hasFill && renderData.strokes?.length && !state.stroke) {
    state.stroke = new RenderGraphics()
    graphic.addChild(state.stroke)
  }
  if (state.stroke) {
    const stroke = state.stroke
    stroke.clear()
    stroke.visible =
      hasFill && orderedNetworks.length > 0 && !!renderData.strokes?.length
    if (stroke.visible)
      applyBaseVectorStroke(stroke, renderData.strokes ?? [], () =>
        drawVectorPath(stroke, orderedNetworks, points, segments, pointOffset)
      )
  }
}

export const VECTOR_RENDER_STRATEGY: EngineNeutralRenderStrategy =
  Object.assign(
    (
      graphic: Parameters<EngineNeutralRenderStrategy>[0],
      data: Parameters<EngineNeutralRenderStrategy>[1]
    ) => {
      renderVectorGraphic(graphic, data)
    },
    {
      directPropertyKeys: Object.freeze([
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'scaleX',
        'scaleY',
        'skewX',
        'skewY'
      ])
    }
  )

export const VECTOR_COMPONENT_DEFINITION: ComponentDefinition = {
  type: 'vector',
  idPrefix: 'vector',
  namePrefix: 'Vector',
  registration: PRESET_REGISTRATION,
  properties: [
    {
      name: PropertyTypes.POSITION,
      type: PropertyTypes.POSITION,
      alias: ['x', 'y', 'rotation']
    },
    {
      name: PropertyTypes.DIMENSION,
      type: PropertyTypes.DIMENSION,
      alias: ['width', 'height']
    },
    {
      name: 'points',
      type: PropertyTypes.VECTOR_POINTS,
      defaultValue: {} as Record<string, VectorPointNode>
    },
    {
      name: 'segments',
      type: PropertyTypes.VECTOR_SEGMENTS,
      defaultValue: {} as Record<string, VectorSegment>
    },
    {
      name: 'networks',
      type: PropertyTypes.VECTOR_NETWORKS,
      defaultValue: {} as Record<string, VectorNetwork>
    },
    {
      name: 'closed',
      type: PropertyTypes.CUSTOM,
      defaultValue: false
    },
    {
      name: 'pointCoordinateSpace',
      type: PropertyTypes.CUSTOM,
      defaultValue: 'workspace'
    },
    {
      name: 'fillRule',
      type: PropertyTypes.CUSTOM,
      defaultValue: 'nonzero'
    },
    {
      name: 'fills',
      type: PropertyTypes.FILLS,
      defaultValue: DEFAULT_VECTOR_FILLS
    },
    {
      name: 'strokes',
      type: PropertyTypes.STROKES,
      defaultValue: [
        createDefaultStroke({
          color: '#cccccc',
          visible: true,
          joinType: StrokeJoinTypes.ROUND
        })
      ]
    }
  ]
}
