import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

// Delivery shares the admission owner's limits; it does not estimate or split drafts.
export const designBudgetGuidance = (
  expandedNodeLimit: number = limits.expandedNodes
) =>
  `Sum generated objects and ordinary nodes, including root and nested containers: at most ${expandedNodeLimit} objects / ${limits.expandedPathCommands} path commands / depth ${limits.depth} per artifact. Templates and work windows do not increase artifact capacity. Use parts for independent artifacts, each within limits; preserve geometry and relationships.`

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Structural admission only: never projects, expands templates or measures curves. */
export const measureDesignBudget = (
  draft: unknown,
  expandedNodeLimit: number = limits.expandedNodes
) => {
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
    expandedNodes: expandedNodeLimit,
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
  const definitions =
    record(draft) && record(draft.motifTemplates) ? draft.motifTemplates : {}
  const definitionCounts = new Map<
    string,
    { motifs: unknown[]; points: number; largest: number }
  >()
  for (const [name, source] of Object.entries(definitions)) {
    const motifs = Array.isArray(source) ? source : []
    let total = 0,
      largest = 0
    for (const motif of motifs) {
      const vertices = record(motif) ? motif.vertices : undefined
      const count = Array.isArray(vertices) ? vertices.length : 0
      total += count
      largest = Math.max(largest, count)
    }
    definitionCounts.set(name, { motifs, points: total, largest })
    observed.sourceNodes += motifs.length
    observed.sourcePathCommands += total
    observed.sourcePrimitivePathCommands = Math.max(
      observed.sourcePrimitivePathCommands,
      largest
    )
  }
  const visit = (value: unknown, depth: number, multiplier = 1) => {
    if (!record(value)) return
    observed.sourceNodes++
    observed.depth = Math.max(observed.depth, depth)
    if (observed.sourceNodes > limits.expandedNodes || depth > limits.depth) {
      lowerBound = true
      return
    }
    let instances = 1,
      sourcePoints = 0,
      generatedNodes = 1,
      primitivePoints: number | undefined,
      expandedPoints: number | undefined
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
      if (Array.isArray(value.members)) {
        for (const member of value.members) {
          // Unsupported recursive members are rejected by construction, never traversed.
          if (
            record(member) &&
            (member.type === 'projected-face' || member.type === 'surface-grid')
          )
            visit(member, depth, multiplier * instances)
          if (observed.sourceNodes > limits.expandedNodes) break
        }
        return
      }
      const faces = Array.isArray(value.faces) ? value.faces : []
      generatedNodes = instances * faces.length
      observed.sourceNodes += faces.length - 1
      primitivePoints = 0
      for (const face of faces) {
        const vertices = record(face) ? face.vertices : undefined
        const pointCount = Array.isArray(vertices) ? vertices.length : 0
        primitivePoints = Math.max(primitivePoints, pointCount)
        sourcePoints += pointCount
      }
    } else if (value.type === 'surface-grid') {
      instances =
        Number.isSafeInteger(value.rows) && Number.isSafeInteger(value.columns)
          ? Math.max(0, Number(value.rows)) * Math.max(0, Number(value.columns))
          : 0
      const reference =
        record(value.motifs) && typeof value.motifs.template === 'string'
          ? definitionCounts.get(value.motifs.template)
          : undefined
      const motifs = Array.isArray(value.motifs)
        ? value.motifs
        : (reference?.motifs ?? [])
      let motifPoints = reference?.points ?? 0
      primitivePoints = Math.max(4, reference?.largest ?? 0)
      if (!reference)
        for (const motif of motifs) {
          const vertices = record(motif) ? motif.vertices : undefined
          const count = Array.isArray(vertices) ? vertices.length : 0
          motifPoints += count
          primitivePoints = Math.max(primitivePoints, count)
        }
      sourcePoints =
        (Array.isArray(value.boundary) ? value.boundary.length : 0) +
        (reference ? 0 : motifPoints)
      generatedNodes = instances * motifs.length
      expandedPoints = instances * motifPoints
      observed.sourceNodes += reference ? 0 : motifs.length
    } else if (value.type === 'projected-face') {
      sourcePoints = Array.isArray(value.vertices) ? value.vertices.length : 0
    } else sourcePoints = points(value.rings)
    observed.sourcePrimitivePathCommands = Math.max(
      observed.sourcePrimitivePathCommands,
      primitivePoints ?? sourcePoints
    )
    observed.expandedNodes += generatedNodes * multiplier
    observed.sourcePathCommands += sourcePoints
    observed.expandedPathCommands +=
      (expandedPoints ?? sourcePoints * instances) * multiplier
    if (Array.isArray(value.children))
      for (const child of value.children) {
        visit(child, depth + 1, multiplier)
        if (observed.sourceNodes > limits.expandedNodes) break
      }
  }
  visit(draft, 1)
  const exceeded = (Object.keys(allowed) as (keyof typeof allowed)[]).filter(
    (key) => observed[key] > allowed[key]
  )
  return { observed, allowed, lowerBound, exceeded }
}

export const inspectDesignBudget = (
  draft: unknown,
  expandedNodeLimit: number = limits.expandedNodes
) => {
  const { observed, allowed, lowerBound, exceeded } = measureDesignBudget(
    draft,
    expandedNodeLimit
  )
  if (!exceeded.length) return
  return {
    available: false,
    code: 'DESIGN_BUDGET_EXCEEDED',
    recovery: 'correct_input',
    budget: { observed, allowed, lowerBound },
    message: `Construction budgets exceeded before geometry compilation: ${exceeded.map((key) => `${key}=${observed[key]} > ${allowed[key]}`).join('; ')}${lowerBound ? ' (observations are lower bounds)' : ''}. Source work is partitioned automatically; this input exceeds an expanded artifact, depth or indivisible primitive guard. Template compression does not reduce expanded output. Use existing ordered parts for independent ready artifacts that each fit, preserving geometry, painter order, keys and relationships. Do not replay completed parts. No canvas changes were made.`
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
      const previousBatches = batches
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
      return previousBatches > 0 && batches !== previousBatches
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

export interface DesignSourceSelection {
  child: number
  range?: { start: number; end: number }
}
export interface DesignBudgetPartition {
  selections: DesignSourceSelection[]
  expandedNodes: number
  expandedPathCommands: number
}

export const selectDesignSource = (
  input: Record<string, unknown>,
  items: DesignSourceSelection[]
) => {
  const children = input.children as Record<string, unknown>[]
  const selected: Record<string, unknown>[] = []
  let previousChild = -1
  for (const item of items) {
    const child = children[item.child]
    if (item.range && previousChild === item.child) {
      const previous = selected[selected.length - 1]
      previous.instanceRanges = [
        ...(previous.instanceRanges as unknown[]),
        item.range
      ]
    } else
      selected.push(
        item.range ? { ...child, instanceRanges: [item.range] } : child
      )
    previousChild = item.child
  }
  return { ...input, children: selected }
}

/** Partition source references, never constructed geometry or canonical state. */
export const partitionDesignBudget = (
  input: unknown,
  expandedNodeLimit: number = limits.expandedNodes
): DesignBudgetPartition[] | undefined => {
  if (
    !record(input) ||
    input.type !== 'group' ||
    !record(input.projection) ||
    !Array.isArray(input.children) ||
    !input.children.length ||
    Object.keys(input).some(
      (key) =>
        ![
          'type',
          'name',
          'key',
          'projection',
          'children',
          'fillTemplates',
          'motifTemplates',
          'linearFields',
          'x',
          'y'
        ].includes(key)
    )
  )
    return
  const children = input.children
  if (
    children.some(
      (child) =>
        !record(child) ||
        !['projected-face', 'surface-grid', 'pattern'].includes(
          String(child.type)
        )
    )
  )
    return
  // Recovery is conservative about global identity: never allow two source key
  // families to become independently valid merely because artifacts are separate.
  const families = children.map((child) => ({
    key: child.key,
    generated: child.type !== 'projected-face'
  }))
  if (input.key !== undefined)
    families.push({ key: input.key, generated: false })
  if (families.some(({ key }) => typeof key !== 'string' || !key.trim())) return
  families.sort((a, b) =>
    String(a.key) < String(b.key) ? -1 : Number(String(a.key) > String(b.key))
  )
  for (let index = 1; index < families.length; index++) {
    const earlier = families[index - 1],
      current = families[index]
    if (
      earlier.key === current.key ||
      (earlier.generated && String(current.key).startsWith(String(earlier.key)))
    )
      return
  }
  const whole = measureDesignBudget(input, expandedNodeLimit)
  if (whole.lowerBound || !whole.exceeded.length) return
  const sharedCost = measureDesignBudget(
    { ...input, children: [] },
    expandedNodeLimit
  ).observed
  const empty = () => ({ ...sharedCost })
  const parts: DesignBudgetPartition[] = []
  let selections: DesignSourceSelection[] = []
  let cost = empty()
  const flush = () => {
    if (!selections.length) return
    parts.push({
      selections,
      expandedNodes: cost.expandedNodes,
      expandedPathCommands: cost.expandedPathCommands
    })
    selections = []
    cost = empty()
  }
  for (const [child, value] of children.entries()) {
    if (!record(value)) return
    let ranges: { start: number; end: number }[] = [{ start: 0, end: 1 }]
    const pattern = value.type === 'pattern'
    if (pattern) {
      if (!Array.isArray(value.axes) || !value.axes.length) return
      const total = value.axes.reduce(
        (n, axis) =>
          record(axis) &&
          Number.isSafeInteger(axis.count) &&
          Number(axis.count) > 0
            ? n * Number(axis.count)
            : NaN,
        1
      )
      if (!Number.isSafeInteger(total) || total <= 0) return
      const selectedRanges = value.instanceRanges ?? [{ start: 0, end: total }]
      if (!Array.isArray(selectedRanges) || !selectedRanges.length) return
      let previousEnd = 0
      ranges = []
      for (const range of selectedRanges) {
        if (
          !record(range) ||
          !Number.isSafeInteger(range.start) ||
          !Number.isSafeInteger(range.end) ||
          Number(range.start) < previousEnd ||
          Number(range.end) > total ||
          Number(range.end) <= Number(range.start)
        )
          return
        ranges.push({ start: Number(range.start), end: Number(range.end) })
        previousEnd = Number(range.end)
      }
    }
    // Measure the source component once. Only output cost scales with instances;
    // sparse ranges of one component share its source cost within each artifact.
    const member = pattern
      ? {
          ...value,
          instanceRanges: [{ start: ranges[0].start, end: ranges[0].start + 1 }]
        }
      : value
    const measured = measureDesignBudget(
      { ...input, children: [member] },
      expandedNodeLimit
    )
    if (measured.lowerBound || measured.exceeded.length) return
    const unit = {
      ...measured.observed,
      sourceNodes: measured.observed.sourceNodes - sharedCost.sourceNodes,
      sourcePathCommands:
        measured.observed.sourcePathCommands - sharedCost.sourcePathCommands,
      expandedNodes: measured.observed.expandedNodes - 1,
      depth: measured.observed.depth - 1
    }
    if (
      !Object.values(unit).every(Number.isSafeInteger) ||
      unit.expandedNodes <= 0
    )
      return
    for (const range of ranges) {
      let start = range.start
      while (start < range.end) {
        if (parts.length >= limits.recoveryParts) return
        const newSource = selections.at(-1)?.child !== child
        const nextSourceNodes =
          cost.sourceNodes + (newSource ? unit.sourceNodes : 0)
        const nextSourcePaths =
          cost.sourcePathCommands + (newSource ? unit.sourcePathCommands : 0)
        const nextDepth = Math.max(cost.depth, unit.depth + 1)
        const capacity =
          nextSourceNodes > whole.allowed.sourceNodes ||
          nextSourcePaths > whole.allowed.sourcePathCommands ||
          nextDepth > whole.allowed.depth
            ? 0
            : Math.min(
                range.end - start,
                Math.floor(
                  (expandedNodeLimit - cost.expandedNodes) / unit.expandedNodes
                ),
                unit.expandedPathCommands
                  ? Math.floor(
                      (limits.expandedPathCommands -
                        cost.expandedPathCommands) /
                        unit.expandedPathCommands
                    )
                  : Infinity
              )
        if (!capacity) {
          if (!selections.length) return
          flush()
          continue
        }
        selections.push(
          pattern
            ? { child, range: { start, end: start + capacity } }
            : { child }
        )
        cost = {
          sourceNodes: nextSourceNodes,
          sourcePathCommands: nextSourcePaths,
          sourcePrimitivePathCommands: Math.max(
            cost.sourcePrimitivePathCommands,
            unit.sourcePrimitivePathCommands
          ),
          depth: nextDepth,
          expandedNodes: cost.expandedNodes + capacity * unit.expandedNodes,
          expandedPathCommands:
            cost.expandedPathCommands + capacity * unit.expandedPathCommands
        }
        start += capacity
      }
    }
  }
  flush()
  return parts.length > 1 && parts.length <= limits.recoveryParts
    ? parts
    : undefined
}
