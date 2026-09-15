import type { Point3 } from './greenhouse'
import type { SourceRegion } from './source-occupancy'

export const QUADRUPED_TEMPLATE_FORMAT = 'quadruped-source-template/2'
export const QUADRUPED_TEMPLATE_ID = 'side-stage-articulation-2'
export interface SourceModule {
  readonly id: string
  readonly material: string
  readonly size: Point3
  readonly dimensions: {
    readonly kind: 'rigid' | 'axial-span' | 'panel'
    readonly axes: readonly number[]
    readonly min: Point3
    readonly max: Point3
  }
  readonly positions: readonly number[]
  readonly axialWeights?: readonly number[]
  readonly indices: readonly number[]
  readonly regions: readonly (SourceRegion & { readonly convex: boolean })[]
  readonly patches: readonly {
    readonly id: string
    readonly regionId: string
    readonly ranges: readonly {
      readonly indexStart: number
      readonly indexCount: number
    }[]
    readonly witnessTriangle: number
  }[]
  readonly ports: readonly {
    readonly id: string
    readonly position: Point3
    readonly axialWeight?: number
  }[]
  readonly maxRepeat: number
}
export interface SourceTemplate {
  readonly format: typeof QUADRUPED_TEMPLATE_FORMAT
  readonly templateId: typeof QUADRUPED_TEMPLATE_ID
  readonly sourceProfile: 'side-stage-articulation/2'
  readonly units: {
    readonly linear: 'metre'
    readonly angular: 'radian'
    readonly scale: 1
  }
  readonly axes: {
    readonly handedness: 'right'
    readonly lateral: '+X'
    readonly up: '+Y'
    readonly longitudinal: '+Z'
    readonly quaternion: 'xyzw'
  }
  readonly evidence: {
    readonly kind: 'synthetic'
    readonly id: string
    readonly label: string
  }
  readonly modules: readonly SourceModule[]
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const point = (value: unknown): value is Point3 =>
  Array.isArray(value) && value.length === 3 && value.every(finite)
const fail = (message: string): never => {
  throw new Error(message)
}
const integer = (value: unknown): value is number => Number.isSafeInteger(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
type IntegerPoint = readonly [bigint, bigint, bigint]
const sub = (a: IntegerPoint, b: IntegerPoint): IntegerPoint => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2]
]
const cross = (a: IntegerPoint, b: IntegerPoint): IntegerPoint => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]
const dot = (a: IntegerPoint, b: IntegerPoint) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
function dyadic(value: number) {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0)
  const exponentBits = Number((bits >> 52n) & 2047n)
  let significand = bits & ((1n << 52n) - 1n)
  if (exponentBits) significand += 1n << 52n
  if (bits >> 63n) significand = -significand
  return { significand, exponent: exponentBits ? exponentBits - 1075 : -1074 }
}
function integerVertices(positions: readonly number[]) {
  const values = positions.map(dyadic)
  const exponent = Math.min(
    ...values
      .filter((value) => value.significand !== 0n)
      .map((value) => value.exponent)
  )
  const integers = values.map((value) =>
    value.significand === 0n
      ? 0n
      : value.significand << BigInt(value.exponent - exponent)
  )
  return Array.from(
    { length: positions.length / 3 },
    (_, i) => integers.slice(i * 3, i * 3 + 3) as unknown as IntegerPoint
  )
}

/** Exact binary64 predicates; no geometric epsilon grants material admission. */
export function validateSourceModule(raw: unknown): SourceModule {
  if (
    !record(raw) ||
    !text(raw.id) ||
    !text(raw.material) ||
    !point(raw.size) ||
    !raw.size.every((v) => v > 0) ||
    !Array.isArray(raw.positions) ||
    raw.positions.length < 12 ||
    raw.positions.length % 3 ||
    !raw.positions.every(finite) ||
    !Array.isArray(raw.indices) ||
    !raw.indices.length ||
    raw.indices.length % 3 ||
    !raw.indices.every(
      (v) => integer(v) && v >= 0 && v < (raw.positions as number[]).length / 3
    ) ||
    !Array.isArray(raw.regions) ||
    !raw.regions.length ||
    !Array.isArray(raw.patches) ||
    !Array.isArray(raw.ports)
  )
    return fail('Invalid material module')
  const module = raw as unknown as SourceModule
  const vertices = integerVertices(module.positions)
  const coordinateKeys = vertices.map((v) => v.join(':'))
  const regionIds = new Set<string>()
  let end = 0
  for (const region of module.regions) {
    if (
      !text(region.id) ||
      regionIds.has(region.id) ||
      region.kind !== 'closed-solid' ||
      region.indexStart !== end ||
      !integer(region.indexCount) ||
      region.indexCount <= 0 ||
      region.indexCount % 3 ||
      typeof region.convex !== 'boolean' ||
      end + region.indexCount > module.indices.length
    )
      return fail('Invalid source region')
    regionIds.add(region.id)
    const edges = new Map<string, { count: number; orientation: number }>()
    const triangles = new Set<string>()
    const memberIndices = new Set(
      module.indices.slice(end, end + region.indexCount)
    )
    let volume6 = 0n
    for (let offset = end; offset < end + region.indexCount; offset += 3) {
      const ids = module.indices.slice(offset, offset + 3)
      const [a, b, c] = ids.map((id) => vertices[id])
      const normal = cross(sub(b, a), sub(c, a))
      if (normal.every((value) => value === 0n))
        return fail('Degenerate coordinate triangle')
      const keys = ids.map((id) => coordinateKeys[id])
      const triangleKey = [...keys].sort().join('|')
      if (triangles.has(triangleKey))
        return fail('Duplicate coordinate triangle')
      triangles.add(triangleKey)
      volume6 += dot(a, cross(b, c))
      if (
        region.convex &&
        [...memberIndices].some(
          (index) => dot(normal, sub(vertices[index], a)) > 0n
        )
      )
        return fail('False convex region claim')
      for (let edge = 0; edge < 3; edge++) {
        const from = keys[edge],
          to = keys[(edge + 1) % 3]
        const key = [from, to].sort().join('|')
        const entry = edges.get(key) ?? { count: 0, orientation: 0 }
        entry.count++
        entry.orientation += from < to ? 1 : -1
        edges.set(key, entry)
      }
    }
    if (
      [...edges.values()].some(
        (edge) => edge.count !== 2 || edge.orientation !== 0
      )
    )
      return fail('Non-manifold oriented region')
    if (volume6 <= 0n) return fail('Non-positive region volume')
    end += region.indexCount
  }
  if (end !== module.indices.length) return fail('Incomplete region coverage')
  const patchIds = new Set<string>()
  for (const patch of module.patches) {
    const region = module.regions.find((r) => r.id === patch.regionId)
    if (
      !text(patch.id) ||
      patchIds.has(patch.id) ||
      !region ||
      !Array.isArray(patch.ranges) ||
      !patch.ranges.length ||
      !integer(patch.witnessTriangle)
    )
      return fail('Invalid patch witness')
    patchIds.add(patch.id)
    let rangeEnd = region.indexStart
    let witness = false
    for (const range of patch.ranges) {
      if (
        !integer(range.indexStart) ||
        range.indexStart % 3 ||
        range.indexStart < rangeEnd ||
        !integer(range.indexCount) ||
        range.indexCount <= 0 ||
        range.indexCount % 3 ||
        range.indexStart + range.indexCount >
          region.indexStart + region.indexCount
      )
        return fail('Patch membership outside region')
      rangeEnd = range.indexStart + range.indexCount
      if (
        patch.witnessTriangle * 3 >= range.indexStart &&
        patch.witnessTriangle * 3 < rangeEnd
      )
        witness = true
    }
    if (!witness)
      return fail('Patch witness is not an original member triangle')
  }
  const portIds = new Set<string>()
  for (const port of module.ports) {
    if (!text(port.id) || portIds.has(port.id) || !point(port.position))
      return fail('Invalid module port')
    portIds.add(port.id)
  }
  const policy = module.dimensions
  if (
    !policy ||
    !['rigid', 'axial-span', 'panel'].includes(policy.kind) ||
    !Array.isArray(policy.axes) ||
    new Set(policy.axes).size !== policy.axes.length ||
    !policy.axes.every((axis) => integer(axis) && axis >= 0 && axis < 3) ||
    !point(policy.min) ||
    !point(policy.max) ||
    !module.size.every(
      (size, axis) =>
        policy.min[axis] > 0 &&
        policy.min[axis] <= size &&
        size <= policy.max[axis]
    ) ||
    (policy.kind === 'rigid' && policy.axes.length !== 0) ||
    (policy.kind === 'axial-span' &&
      (policy.axes.length !== 1 || policy.axes[0] !== 2)) ||
    [0, 1, 2].some(
      (axis) =>
        !policy.axes.includes(axis) &&
        (policy.min[axis] !== module.size[axis] ||
          policy.max[axis] !== module.size[axis])
    ) ||
    !integer(module.maxRepeat) ||
    module.maxRepeat < 1 ||
    module.maxRepeat > 64
  )
    return fail('Invalid admitted module dimension policy')
  if (
    policy.kind === 'axial-span' &&
    (!Array.isArray(module.axialWeights) ||
      module.axialWeights.length !== module.positions.length / 3 ||
      !module.axialWeights.every((weight) => weight === 0 || weight === 1))
  )
    return fail('Missing fixed-cap axial deformation weights')
  return module
}
export function readQuadrupedTemplate(raw: unknown): SourceTemplate {
  if (
    !record(raw) ||
    raw.format !== QUADRUPED_TEMPLATE_FORMAT ||
    raw.templateId !== QUADRUPED_TEMPLATE_ID ||
    raw.sourceProfile !== 'side-stage-articulation/2' ||
    !record(raw.units) ||
    raw.units.linear !== 'metre' ||
    raw.units.angular !== 'radian' ||
    raw.units.scale !== 1 ||
    !record(raw.axes) ||
    raw.axes.handedness !== 'right' ||
    raw.axes.lateral !== '+X' ||
    raw.axes.up !== '+Y' ||
    raw.axes.longitudinal !== '+Z' ||
    raw.axes.quaternion !== 'xyzw' ||
    !record(raw.evidence) ||
    raw.evidence.kind !== 'synthetic' ||
    !text(raw.evidence.id) ||
    !text(raw.evidence.label) ||
    !Array.isArray(raw.modules) ||
    !raw.modules.length ||
    'bodies' in raw ||
    'joints' in raw ||
    'instances' in raw
  )
    return fail('Unsupported quadruped material template')
  const ids = new Set<string>()
  for (const item of raw.modules) {
    const module = validateSourceModule(item)
    if (ids.has(module.id)) return fail('Duplicate module identity')
    ids.add(module.id)
  }
  return freeze(structuredClone(raw) as unknown as SourceTemplate)
}
export function instantiateSourceModule(
  module: SourceModule,
  size: Point3 = module.size
) {
  if (
    !point(size) ||
    !size.every(
      (value, axis) =>
        value >= module.dimensions.min[axis] &&
        value <= module.dimensions.max[axis] &&
        (module.dimensions.axes.includes(axis) || value === module.size[axis])
    )
  )
    return fail('Unsupported rigid module dimensions')
  const scale = size.map((value, axis) => value / module.size[axis])
  const positions = module.positions.map((value, index) => {
    if (module.dimensions.kind === 'axial-span')
      return index % 3 === 2
        ? value +
            (size[2] - module.size[2]) *
              (module.axialWeights?.[Math.floor(index / 3)] ??
                fail('Missing axial weight'))
        : value
    return value * scale[index % 3]
  })
  const material = {
    moduleId: module.id,
    positions,
    indices: [...module.indices],
    regions: () => module.regions,
    patches: module.patches,
    ports: module.ports.map((port) => ({
      ...port,
      position: port.position.map((value, axis) => {
        if (module.dimensions.kind === 'axial-span')
          return axis === 2
            ? value + (size[2] - module.size[2]) * (port.axialWeight ?? 0)
            : value
        return value * scale[axis]
      }) as unknown as Point3
    }))
  }
  // Transformation is a trust boundary, including overflow and loss of material.
  validateSourceModule({
    ...module,
    size,
    positions,
    dimensions: { kind: 'rigid', axes: [], min: size, max: size },
    ports: material.ports
  })
  return material
}

/** Adjustable panel planes are shared exact source coordinates, not rounded centre/half-size reconstructions. */
export function instantiateSourcePanel(
  module: SourceModule,
  low: Point3,
  high: Point3
) {
  if (
    module.dimensions.kind !== 'panel' ||
    module.dimensions.axes.length !== 3 ||
    !point(low) ||
    !point(high)
  )
    return fail('Unsupported source panel bounds')
  const size = high.map((value, axis) => value - low[axis]) as unknown as Point3
  const material = instantiateSourceModule(module, size)
  const lower = [0, 1, 2].map((axis) =>
    Math.min(...module.positions.filter((_, i) => i % 3 === axis))
  )
  const upper = [0, 1, 2].map((axis) =>
    Math.max(...module.positions.filter((_, i) => i % 3 === axis))
  )
  const positions = module.positions.map((value, index) => {
    const axis = index % 3
    if (value === lower[axis]) return low[axis]
    if (value === upper[axis]) return high[axis]
    return fail('Panel interpolation needs an authored interior-vertex policy')
  })
  const ports = module.ports.map((port) => ({
    ...port,
    position: port.position.map((value, axis) => {
      if (value === lower[axis]) return low[axis]
      if (value === upper[axis]) return high[axis]
      return (
        low[axis] +
        ((value - lower[axis]) / (upper[axis] - lower[axis])) *
          (high[axis] - low[axis])
      )
    }) as unknown as Point3
  }))
  validateSourceModule({
    ...module,
    size,
    positions,
    ports,
    dimensions: { kind: 'rigid', axes: [], min: size, max: size }
  })
  return { ...material, positions, ports }
}
