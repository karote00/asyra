import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Structural admission only: never projects, expands templates or measures curves. */
export const inspectDesignBudget = (draft: unknown) => {
  const observed = {
    sourceNodes: 0,
    expandedNodes: 0,
    sourcePathCommands: 0,
    sourcePrimitivePathCommands: 0,
    expandedPathCommands: 0,
    depth: 0
  }
  const allowed = {
    sourceNodes: limits.expandedNodes,
    expandedNodes: limits.expandedNodes,
    sourcePathCommands: limits.expandedPathCommands,
    sourcePrimitivePathCommands: limits.pathCommands,
    expandedPathCommands: limits.expandedPathCommands,
    depth: limits.depth
  }
  let lowerBound = false
  const points = (rings: unknown): number => {
    if (!Array.isArray(rings)) return 0
    let count = 0
    for (const ring of rings) {
      if (!Array.isArray(ring)) continue
      for (const anchor of ring) {
        count +=
          1 +
          Number(record(anchor) && !!anchor.inControl) +
          Number(record(anchor) && !!anchor.outControl)
        if (count > limits.expandedPathCommands) {
          lowerBound = true
          return count
        }
      }
    }
    return count
  }
  const visit = (value: unknown, depth: number) => {
    if (!record(value)) return
    observed.sourceNodes++
    observed.depth = Math.max(observed.depth, depth)
    if (observed.sourceNodes > limits.expandedNodes || depth > limits.depth) {
      lowerBound = true
      return
    }
    let instances = 1,
      sourcePoints = 0,
      generatedNodes = 1
    if (value.type === 'vector-pattern') {
      instances = Array.isArray(value.placements) ? value.placements.length : 0
      generatedNodes = instances
      sourcePoints = record(value.template) ? points(value.template.rings) : 0
    } else if (value.type === 'pattern') {
      const axes = Array.isArray(value.axes) ? value.axes : []
      instances = axes.reduce(
        (total, axis) =>
          total *
          (record(axis) &&
          Number.isSafeInteger(axis.count) &&
          Number(axis.count) > 0
            ? Number(axis.count)
            : 0),
        1
      )
      if (Array.isArray(value.instanceRanges))
        instances = value.instanceRanges.reduce(
          (total, range) =>
            total +
            (record(range) &&
            Number.isSafeInteger(range.start) &&
            Number.isSafeInteger(range.end) &&
            Number(range.end) > Number(range.start)
              ? Number(range.end) - Number(range.start)
              : 0),
          0
        )
      const faces = Array.isArray(value.faces) ? value.faces : []
      generatedNodes = instances * faces.length
      sourcePoints = faces.reduce(
        (total, face) =>
          total +
          (record(face) && Array.isArray(face.vertices)
            ? face.vertices.length
            : 0),
        0
      )
    } else if (value.type === 'projected-face') {
      sourcePoints = Array.isArray(value.vertices) ? value.vertices.length : 0
    } else sourcePoints = points(value.rings)
    observed.sourcePrimitivePathCommands = Math.max(
      observed.sourcePrimitivePathCommands,
      sourcePoints
    )
    observed.expandedNodes += generatedNodes
    observed.sourcePathCommands += sourcePoints
    observed.expandedPathCommands += sourcePoints * instances
    if (Array.isArray(value.children))
      for (const child of value.children) {
        visit(child, depth + 1)
        if (observed.sourceNodes > limits.expandedNodes) break
      }
  }
  visit(draft, 1)
  const exceeded = (Object.keys(allowed) as (keyof typeof allowed)[]).filter(
    (key) => observed[key] > allowed[key]
  )
  if (!exceeded.length) return undefined
  return {
    available: false,
    code: 'DESIGN_BUDGET_EXCEEDED',
    recovery: 'correct_input',
    budget: { observed, allowed, lowerBound },
    message: `Construction budgets exceeded before geometry compilation: ${exceeded.map((key) => `${key}=${observed[key]} > ${allowed[key]}`).join('; ')}${lowerBound ? ' (observations are lower bounds)' : ''}. Source work is partitioned automatically; this input exceeds an expanded artifact, depth or indivisible primitive guard. Reuse exact repeated templates or separate independent artifacts while preserving geometry, painter order, keys and relationships. No canvas changes were made.`
  }
}

/** One source primitive per admission, with bounded cumulative work windows.
 * Global layout and identity resolution stay in the construction owner.
 */
export const createDesignSourceWork = () => {
  let nodes = 0,
    pathCommands = 0,
    batches = 0
  let batchNodes = 0,
    batchPaths = 0
  let largestBatchNodes = 0,
    largestBatchPathCommands = 0
  return {
    admit(points: number) {
      if (points > limits.pathCommands)
        throw new Error('Invalid design: indivisible source vector point limit')
      if (
        !batchNodes ||
        batchNodes === limits.nodes ||
        batchPaths + points > limits.pathCommands
      ) {
        batches++
        batchNodes = 0
        batchPaths = 0
      }
      nodes++
      pathCommands += points
      batchNodes++
      batchPaths += points
      if (
        nodes > limits.expandedNodes ||
        pathCommands > limits.expandedPathCommands
      )
        throw new Error('Invalid design: expanded source work limit')
      largestBatchNodes = Math.max(largestBatchNodes, batchNodes)
      largestBatchPathCommands = Math.max(largestBatchPathCommands, batchPaths)
    },
    summary: () => ({
      batches,
      nodes,
      pathCommands,
      largestBatchNodes,
      largestBatchPathCommands
    })
  }
}

export const sourcePathCommandCount = (node: unknown): number => {
  if (!record(node)) return 0
  if (node.type === 'projected-face')
    return Array.isArray(node.vertices) ? node.vertices.length : 0
  if (node.type === 'pattern')
    return Array.isArray(node.faces)
      ? node.faces.reduce(
          (total, face) =>
            total +
            (record(face) && Array.isArray(face.vertices)
              ? face.vertices.length
              : 0),
          0
        )
      : 0
  const source =
    node.type === 'vector-pattern' && record(node.template)
      ? node.template
      : node
  if (!Array.isArray(source.rings)) return 0
  let points = 0
  for (const ring of source.rings) {
    if (!Array.isArray(ring)) continue
    for (const anchor of ring) {
      points +=
        1 +
        Number(record(anchor) && !!anchor.inControl) +
        Number(record(anchor) && !!anchor.outControl)
      if (points > limits.pathCommands) return points
    }
  }
  return points
}
