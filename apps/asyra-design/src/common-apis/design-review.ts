import core from '../contexts'
interface Bounds {
  x: number
  y: number
  width: number
  height: number
}
interface ReviewApis {
  read(id: string):
    | {
        type?: string
        children?: readonly string[]
        parentId?: string
        visible?: boolean
      }
    | undefined
  computed(
    id: string,
    fields: readonly string[]
  ): Record<string, unknown> | undefined
  measure(
    ids: readonly string[]
  ): readonly { elementId: string; bounds: Bounds | null }[]
}
interface ReviewFinding {
  kind: string
  elementId: string
  left?: number
  top?: number
  right?: number
  bottom?: number
}
const defaultApis: ReviewApis = {
  read: (id) => core.getElementData(id),
  computed: (id, fields) => core.getElementComputedData(id, fields),
  measure: (ids) => core.measureElementContentBounds(ids)
}
const fields = ['x', 'y', 'width', 'height', 'rotation']
const overflow = (bounds: Bounds, width: number, height: number) => ({
  left: Math.max(0, -bounds.x),
  top: Math.max(0, -bounds.y),
  right: Math.max(0, bounds.x + bounds.width - width),
  bottom: Math.max(0, bounds.y + bounds.height - height)
})
export const createDesignReviewer =
  (apis: ReviewApis = defaultApis) =>
  (rootId: string) => {
    if (typeof rootId !== 'string' || !rootId.length || rootId.length > 256)
      throw new Error('Invalid review target.')
    const findings: ReviewFinding[] = []
    const measuredTextIds: string[] = []
    const queue: { id: string; visible: boolean; parent?: Bounds }[] = [
      { id: rootId, visible: true }
    ]
    const visited = new Set<string>(),
      text = new Map<string, Bounds>()
    let complete = true,
      truncated = false
    for (let index = 0; index < queue.length && index < 200; index++) {
      const { id, visible: inherited, parent } = queue[index]
      if (visited.has(id)) {
        complete = false
        findings.push({ kind: 'invalid-hierarchy', elementId: id })
        continue
      }
      visited.add(id)
      const data = apis.read(id)
      if (!data) {
        complete = false
        findings.push({ kind: 'missing-element', elementId: id })
        continue
      }
      const visible = inherited && data.visible !== false
      const computed = apis.computed(id, fields)
      const valid =
        computed &&
        ['x', 'y', 'width', 'height'].every(
          (key) =>
            typeof computed[key] === 'number' && Number.isFinite(computed[key])
        ) &&
        Number(computed.width) >= 0 &&
        Number(computed.height) >= 0
      const bounds = valid
        ? {
            x: Number(computed.x),
            y: Number(computed.y),
            width: Number(computed.width),
            height: Number(computed.height)
          }
        : undefined
      if (visible && !bounds) {
        complete = false
        findings.push({ kind: 'geometry-unavailable', elementId: id })
      }
      if (visible && bounds && parent) {
        if (computed?.rotation !== undefined && computed.rotation !== 0) {
          complete = false
          findings.push({ kind: 'rotated-bounds-unchecked', elementId: id })
        } else {
          const excess = overflow(bounds, parent.width, parent.height)
          if (Object.values(excess).some((value) => value > 0.5))
            findings.push({
              kind: 'container-overflow',
              elementId: id,
              ...excess
            })
        }
      }
      if (visible && bounds && data.type === 'text') text.set(id, bounds)
      if (Array.isArray(data.children)) {
        const available = 201 - queue.length
        if (data.children.length > available) truncated = true
        for (const child of data.children.slice(0, Math.max(0, available)))
          queue.push({ id: child, visible, parent: bounds })
      }
    }
    if (queue.length > 200) truncated = true
    if (text.size) {
      let measured: ReturnType<ReviewApis['measure']> = []
      try {
        measured = apis.measure([...text.keys()])
      } catch {
        complete = false
      }
      const byId = new Map(
        measured.map((entry) => [entry.elementId, entry.bounds])
      )
      for (const [id, layout] of text) {
        const content = byId.get(id)
        if (!content || !Object.values(content).every(Number.isFinite)) {
          complete = false
          findings.push({ kind: 'measurement-unavailable', elementId: id })
          continue
        }
        measuredTextIds.push(id)
        const excess = overflow(content, layout.width, layout.height)
        if (Object.values(excess).some((value) => value > 0.5))
          findings.push({ kind: 'text-overflow', elementId: id, ...excess })
      }
    }
    return {
      complete: complete && !truncated,
      truncated,
      checkedElements: visited.size,
      measuredTextCount: measuredTextIds.length,
      measuredTextIds,
      findings
    }
  }
export const reviewDesign = createDesignReviewer()
