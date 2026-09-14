import { beforeEach, describe, expect, it } from 'vitest'
import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'

/** Exact arithmetic for the original binary64 source and completed FK coefficients. */
type Dyadic = readonly [bigint, number]
type ExactPoint = readonly [Dyadic, Dyadic, Dyadic]
type ExactTriangle = readonly [ExactPoint, ExactPoint, ExactPoint]
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing original source evidence')
  return value
}
const exactZero: Dyadic = [0n, 0]
function dyadic(value: number): Dyadic {
  if (!Number.isFinite(value)) throw new Error('Non-finite source coefficient')
  if (value === 0) return exactZero
  const bytes = new DataView(new ArrayBuffer(8))
  bytes.setFloat64(0, value)
  const bits = bytes.getBigUint64(0)
  const exponent = Number((bits >> 52n) & 2047n)
  const fraction = bits & ((1n << 52n) - 1n)
  return [
    (bits >> 63n ? -1n : 1n) *
      (exponent === 0 ? fraction : fraction + (1n << 52n)),
    exponent === 0 ? -1074 : exponent - 1075
  ]
}
function exactAdd(a: Dyadic, b: Dyadic): Dyadic {
  const exponent = Math.min(a[1], b[1])
  return [
    (a[0] << BigInt(a[1] - exponent)) + (b[0] << BigInt(b[1] - exponent)),
    exponent
  ]
}
const exactNegate = (a: Dyadic): Dyadic => [-a[0], a[1]]
const exactSubtract = (a: Dyadic, b: Dyadic) => exactAdd(a, exactNegate(b))
const exactMultiply = (a: Dyadic, b: Dyadic): Dyadic => [
  a[0] * b[0],
  a[1] + b[1]
]
const exactScale = (a: Dyadic, scale: number) => exactMultiply(a, dyadic(scale))
const exactSign = (a: Dyadic) => {
  if (a[0] < 0n) return -1
  return a[0] > 0n ? 1 : 0
}
const vectorSubtract = (a: ExactPoint, b: ExactPoint): ExactPoint => [
  exactSubtract(a[0], b[0]),
  exactSubtract(a[1], b[1]),
  exactSubtract(a[2], b[2])
]
const vectorCross = (a: ExactPoint, b: ExactPoint): ExactPoint => [
  exactSubtract(exactMultiply(a[1], b[2]), exactMultiply(a[2], b[1])),
  exactSubtract(exactMultiply(a[2], b[0]), exactMultiply(a[0], b[2])),
  exactSubtract(exactMultiply(a[0], b[1]), exactMultiply(a[1], b[0]))
]
const vectorDot = (a: ExactPoint, b: ExactPoint) =>
  exactAdd(
    exactAdd(exactMultiply(a[0], b[0]), exactMultiply(a[1], b[1])),
    exactMultiply(a[2], b[2])
  )
function exactTransform(
  input: ExactPoint,
  transform: { position: readonly number[]; rotation: readonly number[] }
): ExactPoint {
  const [x, y, z, w] = transform.rotation.map(dyadic)
  const cross = vectorCross([x, y, z], input)
  const twiceCross: ExactPoint = cross.map((value) =>
    exactScale(value, 2)
  ) as unknown as ExactPoint
  const second = vectorCross([x, y, z], twiceCross)
  return input.map((value, axis) =>
    exactAdd(
      dyadic(transform.position[axis]),
      exactAdd(
        value,
        exactAdd(exactMultiply(w, twiceCross[axis]), second[axis])
      )
    )
  ) as unknown as ExactPoint
}
function exactTriangles(
  part: import('../walking-robot-source').WalkingRobotPart,
  transform: { position: readonly number[]; rotation: readonly number[] },
  region?: { indexStart: number; indexCount: number }
): ExactTriangle[] {
  const vertices: ExactPoint[] = []
  for (let offset = 0; offset < part.shape.positions.length; offset += 3) {
    const local: ExactPoint = [
      dyadic(part.shape.positions[offset]),
      dyadic(part.shape.positions[offset + 1]),
      dyadic(part.shape.positions[offset + 2])
    ]
    vertices.push(
      exactTransform(exactTransform(local, part.localFrame), transform)
    )
  }
  const triangles: ExactTriangle[] = []
  for (
    let offset = region?.indexStart ?? 0;
    offset <
    (region
      ? region.indexStart + region.indexCount
      : part.shape.indices.length);
    offset += 3
  )
    triangles.push([
      vertices[part.shape.indices[offset]],
      vertices[part.shape.indices[offset + 1]],
      vertices[part.shape.indices[offset + 2]]
    ])
  return triangles
}
function pointInClosedTriangles(
  point: ExactPoint,
  triangles: readonly ExactTriangle[]
) {
  // A finite set of rays; an edge/vertex or coplanar ray is retried, never rounded.
  for (const direction of [
    [1, 11, 101],
    [17, 3, 43],
    [37, 71, 5],
    [13, 47, 113]
  ]) {
    const ray: ExactPoint = [
      dyadic(direction[0]),
      dyadic(direction[1]),
      dyadic(direction[2])
    ]
    let crossings = 0,
      ambiguous = false
    for (const [a, b, c] of triangles) {
      const edge1 = vectorSubtract(b, a),
        edge2 = vectorSubtract(c, a)
      const fromA = vectorSubtract(point, a)
      const cross = vectorCross(ray, edge2)
      let determinant = vectorDot(edge1, cross)
      if (exactSign(determinant) === 0) {
        if (exactSign(vectorDot(fromA, vectorCross(edge1, edge2))) === 0) {
          ambiguous = true
          break
        }
        continue
      }
      let u = vectorDot(fromA, cross)
      const otherCross = vectorCross(fromA, edge1)
      let v = vectorDot(ray, otherCross)
      let distance = vectorDot(edge2, otherCross)
      if (exactSign(determinant) < 0) {
        determinant = exactNegate(determinant)
        u = exactNegate(u)
        v = exactNegate(v)
        distance = exactNegate(distance)
      }
      if (
        exactSign(u) < 0 ||
        exactSign(v) < 0 ||
        exactSign(exactSubtract(determinant, exactAdd(u, v))) < 0 ||
        exactSign(distance) < 0
      )
        continue
      if (exactSign(distance) === 0) return 'boundary'
      if (
        exactSign(u) === 0 ||
        exactSign(v) === 0 ||
        exactSign(exactSubtract(determinant, exactAdd(u, v))) === 0
      ) {
        ambiguous = true
        break
      }
      crossings++
    }
    if (!ambiguous) return crossings % 2 ? 'inside' : 'outside'
  }
  throw new Error('No exact nondegenerate source ray')
}

function exactPointKey(point: ExactPoint) {
  return point
    .map(([n, exponent]) => {
      while (n !== 0n && n % 2n === 0n) {
        n /= 2n
        exponent++
      }
      return n === 0n ? '0' : `${n}:${exponent}`
    })
    .join(',')
}
function primitiveAxis(vector: ExactPoint): ExactPoint | undefined {
  const exponent = Math.min(...vector.map((value) => value[1]))
  const values = vector.map(([n, e]) => n << BigInt(e - exponent))
  const absolute = (n: bigint) => (n < 0n ? -n : n)
  const gcd = (a: bigint, b: bigint) => {
    a = absolute(a)
    b = absolute(b)
    while (b !== 0n) {
      const remainder = a % b
      a = b
      b = remainder
    }
    return a
  }
  let divisor = values.reduce(gcd, 0n)
  if (divisor === 0n) return undefined
  if (required(values.find((value) => value !== 0n)) < 0n) divisor = -divisor
  return [
    [values[0] / divisor, 0],
    [values[1] / divisor, 0],
    [values[2] / divisor, 0]
  ]
}
function uniqueAxes(vectors: readonly ExactPoint[]) {
  const axes = new Map<string, ExactPoint>()
  for (const vector of vectors) {
    const axis = primitiveAxis(vector)
    if (axis) axes.set(exactPointKey(axis), axis)
  }
  return [...axes.values()]
}
function certifyConvexTriangles(
  triangles: readonly ExactTriangle[],
  label: string
) {
  const points = [
    ...new Map(triangles.flat().map((p) => [exactPointKey(p), p])).values()
  ]
  const seams = new Map<string, { count: number; balance: number }>()
  const edges: ExactPoint[] = [],
    normals: ExactPoint[] = []
  let fullDimensional = false
  for (const triangle of triangles) {
    const normal = vectorCross(
      vectorSubtract(triangle[1], triangle[0]),
      vectorSubtract(triangle[2], triangle[0])
    )
    if (!primitiveAxis(normal)) throw new Error(`${label}: degenerate triangle`)
    normals.push(normal)
    const signs = points.map((point) =>
      exactSign(vectorDot(normal, vectorSubtract(point, triangle[0])))
    )
    if (signs.includes(-1) && signs.includes(1))
      throw new Error(`${label}: nonconvex emitted region`)
    fullDimensional ||= signs.some((sign) => sign !== 0)
    for (let corner = 0; corner < 3; corner++) {
      const from = triangle[corner],
        to = triangle[(corner + 1) % 3]
      const a = exactPointKey(from),
        b = exactPointKey(to)
      const key = a < b ? a + '/' + b : b + '/' + a
      const seam = seams.get(key) ?? { count: 0, balance: 0 }
      seam.count++
      seam.balance += a < b ? 1 : -1
      seams.set(key, seam)
      edges.push(vectorSubtract(to, from))
    }
  }
  if (!fullDimensional) throw new Error(`${label}: zero material volume`)
  if (
    [...seams.values()].some(
      ({ count, balance }) => count !== 2 || balance !== 0
    )
  )
    throw new Error(`${label}: unpaired emitted seam`)
  return {
    points,
    triangles,
    normals: uniqueAxes(normals),
    edges: uniqueAxes(edges)
  }
}
function exactProjection(points: readonly ExactPoint[], axis: ExactPoint) {
  const values = points.map((point) => vectorDot(point, axis))
  let min = values[0],
    max = values[0]
  for (const value of values) {
    if (exactSign(exactSubtract(value, min)) < 0) min = value
    if (exactSign(exactSubtract(value, max)) > 0) max = value
  }
  return { min, max }
}
function convexMaterialRelation(
  a: ReturnType<typeof certifyConvexTriangles>,
  b: ReturnType<typeof certifyConvexTriangles>
) {
  for (let axis = 0; axis < 3; axis++) {
    const direction: ExactPoint = [
      dyadic(axis === 0 ? 1 : 0),
      dyadic(axis === 1 ? 1 : 0),
      dyadic(axis === 2 ? 1 : 0)
    ]
    const first = exactProjection(a.points, direction),
      second = exactProjection(b.points, direction)
    if (
      exactSign(exactSubtract(first.max, second.min)) < 0 ||
      exactSign(exactSubtract(second.max, first.min)) < 0
    )
      return 'separated'
  }
  const axes = uniqueAxes([
    ...a.normals,
    ...b.normals,
    ...a.edges.flatMap((edge) =>
      b.edges.map((other) => vectorCross(edge, other))
    )
  ])
  let boundary = false
  for (const axis of axes) {
    const first = exactProjection(a.points, axis),
      second = exactProjection(b.points, axis)
    const forward = exactSign(exactSubtract(first.max, second.min))
    const reverse = exactSign(exactSubtract(second.max, first.min))
    if (forward < 0 || reverse < 0) return 'separated'
    if (forward === 0 || reverse === 0) boundary = true
  }
  if (!axes.length) throw new Error('No complete material separating axes')
  return boundary ? 'boundary' : 'volume-overlap'
}

function strictInteriorWitness(
  a: readonly ExactTriangle[],
  b: readonly ExactTriangle[]
) {
  // A point on a nondegenerate closed solid's surface strictly inside the other
  // certifies material overlap; failure to find one does not certify clearance.
  for (const [from, into] of [
    [a, b],
    [b, a]
  ]) {
    for (let triangle = 0; triangle < from.length; triangle++) {
      const [p, q, r] = from[triangle]
      const sample: ExactPoint = [0, 1, 2].map((axis) =>
        exactAdd(
          exactScale(p[axis], 0.5),
          exactAdd(exactScale(q[axis], 0.25), exactScale(r[axis], 0.25))
        )
      ) as unknown as ExactPoint
      if (pointInClosedTriangles(sample, into) === 'inside') return triangle
    }
  }
  return undefined
}

type MaterialCertificate = ReturnType<typeof certifyConvexTriangles>
type RigidFrame = import('../walking-robot-definition').WalkingRigidTransform
const originFrame: RigidFrame = { position: [0, 0, 0], rotation: [0, 0, 0, 1] }
const coordinateAxes: readonly ExactPoint[] = [
  [dyadic(1), exactZero, exactZero],
  [exactZero, dyadic(1), exactZero],
  [exactZero, exactZero, dyadic(1)]
]
function displayDyadic([n, exponent]: Dyadic) {
  const sign = n < 0n ? -1 : 1
  if (n < 0n) n = -n
  const shift = Math.max(0, n.toString(2).length - 53)
  if (shift > 0) {
    const amount = BigInt(shift),
      quotient = n >> amount
    const remainder = n - (quotient << amount),
      halfway = 1n << (amount - 1n)
    n =
      quotient +
      (remainder > halfway || (remainder === halfway && quotient % 2n !== 0n)
        ? 1n
        : 0n)
    exponent += shift
  }
  return sign * Number(n) * 2 ** exponent
}
function adjacentBinary64(value: number, direction: -1 | 1) {
  if (value === 0) return direction * Number.MIN_VALUE
  const bytes = new DataView(new ArrayBuffer(8))
  bytes.setFloat64(0, value)
  bytes.setBigUint64(
    0,
    bytes.getBigUint64(0) + BigInt(value > 0 ? direction : -direction)
  )
  return bytes.getFloat64(0)
}
function actualPoseEnvelope(
  pose: import('../walking-robot-kinematics').WalkingRobotPoseResult
) {
  const points = pose.bodyTransforms.flatMap(({ sourceParts, transform }) =>
    sourceParts.flatMap((part) => exactTriangles(part, transform).flat())
  )
  const projections = coordinateAxes.map((axis) =>
    exactProjection(points, axis)
  )
  const min = projections.map(({ min }) => displayDyadic(min))
  const max = projections.map(({ max }) => displayDyadic(max))
  const size = projections.map(({ min, max }) =>
    displayDyadic(exactSubtract(max, min))
  )
  expect([...min, ...max, ...size].every(Number.isFinite)).toBe(true)
  for (const point of points)
    for (let axis = 0; axis < 3; axis++) {
      expect(
        exactSign(exactSubtract(point[axis], projections[axis].min))
      ).toBeGreaterThanOrEqual(0)
      expect(
        exactSign(exactSubtract(projections[axis].max, point[axis]))
      ).toBeGreaterThanOrEqual(0)
    }
  return { projections, display: { min, max, size } }
}
function transformCertificate(
  local: MaterialCertificate,
  frame: RigidFrame
): MaterialCertificate {
  const origin = exactTransform([exactZero, exactZero, exactZero], frame)
  const columns = coordinateAxes.map((point) =>
    vectorSubtract(exactTransform(point, frame), origin)
  )
  if (
    exactSign(vectorDot(columns[0], vectorCross(columns[1], columns[2]))) === 0
  )
    throw new Error('Singular completed pose affine map')
  const mapped = new Map(
    local.points.map((point) => [
      exactPointKey(point),
      exactTransform(point, frame)
    ])
  )
  const triangles = local.triangles.map(([a, b, c]): ExactTriangle => [
    required(mapped.get(exactPointKey(a))),
    required(mapped.get(exactPointKey(b))),
    required(mapped.get(exactPointKey(c)))
  ])
  return {
    points: [...mapped.values()],
    triangles,
    normals: uniqueAxes(
      triangles.map(([a, b, c]) =>
        vectorCross(vectorSubtract(b, a), vectorSubtract(c, a))
      )
    ),
    edges: uniqueAxes(
      triangles.flatMap(([a, b, c]) => [
        vectorSubtract(b, a),
        vectorSubtract(c, b),
        vectorSubtract(a, c)
      ])
    )
  }
}
function pointOnTriangle(point: ExactPoint, [a, b, c]: ExactTriangle) {
  const normal = vectorCross(vectorSubtract(b, a), vectorSubtract(c, a))
  if (exactSign(vectorDot(normal, vectorSubtract(point, a))) !== 0) return false
  const signs = [
    [a, b],
    [b, c],
    [c, a]
  ].map(([from, to]) =>
    exactSign(
      vectorDot(
        normal,
        vectorCross(vectorSubtract(to, from), vectorSubtract(point, from))
      )
    )
  )
  return !signs.includes(-1) || !signs.includes(1)
}
function trianglesIntersect(a: ExactTriangle, b: ExactTriangle) {
  const edges = (t: ExactTriangle) => [
    vectorSubtract(t[1], t[0]),
    vectorSubtract(t[2], t[1]),
    vectorSubtract(t[0], t[2])
  ]
  const first = edges(a),
    second = edges(b)
  const normals = [
    vectorCross(first[0], first[1]),
    vectorCross(second[0], second[1])
  ]
  const axes = uniqueAxes([
    ...normals,
    ...first.flatMap((edge) => second.map((other) => vectorCross(edge, other))),
    ...normals.flatMap((normal) =>
      [...first, ...second].map((edge) => vectorCross(normal, edge))
    )
  ])
  return axes.every((axis) => {
    const x = exactProjection(a, axis),
      y = exactProjection(b, axis)
    return (
      exactSign(exactSubtract(x.max, y.min)) >= 0 &&
      exactSign(exactSubtract(y.max, x.min)) >= 0
    )
  })
}
function contactLocusInPatches(
  a: MaterialCertificate,
  b: MaterialCertificate,
  patchA: ReadonlySet<number>,
  patchB: ReadonlySet<number>
) {
  const axes = uniqueAxes([
    ...a.normals,
    ...b.normals,
    ...a.edges.flatMap((edge) =>
      b.edges.map((other) => vectorCross(edge, other))
    )
  ])
  for (const axis of axes) {
    const x = exactProjection(a.points, axis),
      y = exactProjection(b.points, axis)
    let level: Dyadic | undefined
    if (exactSign(exactSubtract(x.max, y.min)) === 0) level = x.max
    else if (exactSign(exactSubtract(y.max, x.min)) === 0) level = y.max
    if (!level) continue
    const onPlane = (point: ExactPoint) =>
      exactSign(exactSubtract(vectorDot(point, axis), level)) === 0
    const covered = (
      material: MaterialCertificate,
      patches: ReadonlySet<number>
    ) => {
      const feature = material.points.filter(onPlane)
      const faces = material.triangles
        .map((triangle, index) => ({ triangle, index }))
        .filter(({ triangle }) => triangle.every(onPlane))
      const patchTriangles = material.triangles
        .map((triangle, index) => ({ triangle, index }))
        .filter(({ index }) => patches.has(index))
      if (faces.length) {
        if (!faces.every(({ index }) => patches.has(index))) return undefined
      } else if (
        !patchTriangles.some(({ triangle }) =>
          feature.every((point) => pointOnTriangle(point, triangle))
        )
      )
        return undefined
      return patchTriangles
    }
    const first = covered(a, patchA),
      second = covered(b, patchB)
    if (first && second)
      for (const from of first)
        for (const into of second)
          if (trianglesIntersect(from.triangle, into.triangle))
            return {
              axis,
              firstTriangle: from.index,
              secondTriangle: into.index
            }
  }
  return undefined
}

function certifyWholePose(
  source: import('../walking-robot-source').WalkingRobotSource,
  pose: import('../walking-robot-kinematics').WalkingRobotPoseResult
) {
  const local = source.rig.bodies.map((body) => ({
    body,
    regions: body.parts.flatMap((part) =>
      part.regions.map((region) => ({
        part,
        region,
        certificate: certifyConvexTriangles(
          exactTriangles(part, originFrame, region),
          `${part.id}/${region.id}`
        )
      }))
    )
  }))
  const frames = new Map(
    pose.bodyTransforms.map(({ id, transform }) => [id, transform])
  )
  const transformed = local.map(({ regions, body }) =>
    regions.map((entry) => ({
      ...entry,
      certificate: transformCertificate(
        entry.certificate,
        required(frames.get(body.id))
      )
    }))
  )
  const failures: string[] = []
  let visited = 0,
    expected = 0,
    boundaries = 0,
    tested = 0,
    strictGaps = 0
  let separatedBySAT = 0,
    unprovedBoundaries = 0,
    volumeFailures = 0
  for (let i = 0; i < local.length; i++)
    for (let j = i + 1; j < local.length; j++) {
      const first = local[i],
        second = local[j]
      expected += first.regions.length * second.regions.length
      let a = transformed[i],
        b = transformed[j]
      // Fixed interfaces use their single authored parent-local affine chain.
      // Rounded completed child translations do not redefine that physical interface.
      if (
        second.body.attachment === 'fixed' &&
        second.body.parentBodyId === first.body.id
      ) {
        a = first.regions
        b = second.regions.map((entry) => ({
          ...entry,
          certificate: transformCertificate(
            entry.certificate,
            required(second.body.fixedFrame)
          )
        }))
      } else if (
        first.body.attachment === 'fixed' &&
        first.body.parentBodyId === second.body.id
      ) {
        b = second.regions
        a = first.regions.map((entry) => ({
          ...entry,
          certificate: transformCertificate(
            entry.certificate,
            required(first.body.fixedFrame)
          )
        }))
      }
      const joint = source.rig.joints.find(
        (candidate) =>
          (candidate.parentBodyId === first.body.id &&
            candidate.childBodyId === second.body.id) ||
          (candidate.parentBodyId === second.body.id &&
            candidate.childBodyId === first.body.id)
      )
      const interfaceOwner =
        joint &&
        source.rig.jointInterfaces.find(({ jointId }) => jointId === joint.id)
      const fixedInterface =
        source.rig.armChains.some(
          (chain) =>
            chain.toolBodyId === first.body.id &&
            chain.guardBodyId === second.body.id
        ) ||
        source.rig.legChains.some(
          (chain) =>
            chain.footBodyId === second.body.id &&
            second.body.parentBodyId === first.body.id
        )
      const namedPatches = (entry: (typeof a)[number], bodyId: string) => {
        if (interfaceOwner) {
          const references =
            bodyId === required(joint).parentBodyId
              ? interfaceOwner.parentPatches
              : interfaceOwner.childPatches
          return references
            .filter(({ part }) => part === entry.part)
            .map(({ patch }) => patch)
        }
        if (fixedInterface)
          return entry.part.patches.filter(({ id }) =>
            id.endsWith('-interface')
          )
        return []
      }
      const patchIndices = (entry: (typeof a)[number], bodyId: string) => {
        const patches = namedPatches(entry, bodyId)
        const indices = new Set<number>()
        for (const patch of patches)
          if (patch.region === entry.region)
            for (const range of patch.ranges)
              for (
                let offset = range.indexStart;
                offset < range.indexStart + range.indexCount;
                offset += 3
              )
                indices.add((offset - entry.region.indexStart) / 3)
        return indices
      }
      const boundsA = a.map(({ certificate }) =>
        coordinateAxes.map((axis) => exactProjection(certificate.points, axis))
      )
      const boundsB = b.map(({ certificate }) =>
        coordinateAxes.map((axis) => exactProjection(certificate.points, axis))
      )
      for (let x = 0; x < a.length; x++)
        for (let y = 0; y < b.length; y++) {
          visited++
          if (
            coordinateAxes.some(
              (_, axis) =>
                exactSign(
                  exactSubtract(boundsA[x][axis].max, boundsB[y][axis].min)
                ) < 0 ||
                exactSign(
                  exactSubtract(boundsB[y][axis].max, boundsA[x][axis].min)
                ) < 0
            )
          ) {
            strictGaps++
            continue
          }
          tested++
          const relation = convexMaterialRelation(
            a[x].certificate,
            b[y].certificate
          )
          if (relation === 'separated') {
            separatedBySAT++
            continue
          }
          const witness =
            relation === 'boundary'
              ? contactLocusInPatches(
                  a[x].certificate,
                  b[y].certificate,
                  patchIndices(a[x], first.body.id),
                  patchIndices(b[y], second.body.id)
                )
              : undefined
          if (witness) {
            const originalA = a[x].region.indexStart + witness.firstTriangle * 3
            const originalB =
              b[y].region.indexStart + witness.secondTriangle * 3
            const ownsTriangle = (
              entry: (typeof a)[number],
              bodyId: string,
              offset: number
            ) =>
              namedPatches(entry, bodyId).some(
                (patch) =>
                  patch.region === entry.region &&
                  patch.ranges.some(
                    (range) =>
                      offset >= range.indexStart &&
                      offset + 3 <= range.indexStart + range.indexCount
                  )
              )
            expect(ownsTriangle(a[x], first.body.id, originalA)).toBe(true)
            expect(ownsTriangle(b[y], second.body.id, originalB)).toBe(true)
            expect(primitiveAxis(witness.axis)).toBeDefined()
            boundaries++
            continue
          }
          if (relation === 'boundary') unprovedBoundaries++
          else volumeFailures++
          failures.push(
            `${first.body.id}/${a[x].part.id}/${a[x].region.id} : ${second.body.id}/${b[y].part.id}/${b[y].region.id} = ${relation === 'boundary' ? 'unknown - unproved patch subset' : relation}`
          )
        }
    }
  expect(local).toHaveLength(46)
  expect(visited).toBe(expected)
  expect(visited).toBe(strictGaps + tested)
  expect(tested).toBe(
    separatedBySAT + boundaries + unprovedBoundaries + volumeFailures
  )
  expect(boundaries).toBeGreaterThan(0)
  expect(
    failures.length,
    failures.slice(0, 12).join('\n') +
      `\nvisited=${visited}, SAT=${tested}, boundaries=${boundaries}, failures=${failures.length}`
  ).toBe(0)
  return { visited, tested, boundaries }
}

describe('walking robot original solid articulation regression', () => {
  beforeEach(async () => {
    // Let Vitest deliver its throttled task update before each synchronous proof.
    await new Promise<void>((resolve) => setImmediate(resolve))
  })

  it('resolves both core endpoints from bounded interface support and the declared physical gap', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'endpoint-support'
      })
    )
    const rawVertices = (
      part: import('../walking-robot-source').WalkingRobotPart
    ) => {
      const vertices: ExactPoint[] = []
      for (let offset = 0; offset < part.shape.positions.length; offset += 3)
        vertices.push([
          dyadic(part.shape.positions[offset]),
          dyadic(part.shape.positions[offset + 1]),
          dyadic(part.shape.positions[offset + 2])
        ])
      return vertices
    }
    const link = (bodyId: string) => {
      const part = source.parts.find(({ id }) => id === bodyId)
      if (!part) return undefined
      const vertices = rawVertices(part)
      const axes = coordinateAxes.map((direction) =>
        exactProjection(vertices, direction)
      )
      const axis = axes.findIndex(
        ({ min, max }) => exactSign(min) > 0 || exactSign(max) < 0
      )
      if (axis < 0) return undefined
      const sign = exactSign(axes[axis].min) > 0 ? 1 : -1
      const direction: ExactPoint = [
        dyadic(axis === 0 ? sign : 0),
        dyadic(axis === 1 ? sign : 0),
        dyadic(axis === 2 ? sign : 0)
      ]
      const section = Math.min(
        ...part.size.filter((_, index) => index !== axis)
      )
      return { part, vertices, axis, direction, section }
    }
    let endpointCount = 0
    for (const joint of source.rig.joints.filter(
      ({ motion }) => motion === 'revolute'
    )) {
      const parent = link(joint.parentBodyId),
        child = link(joint.childBodyId)
      if (!child) throw new Error('Missing actual child core')
      if (parent) expect(joint.frame.rotation).toEqual([0, 0, 0, 1])
      const origin: ExactPoint = [
        dyadic(joint.frame.position[0]),
        dyadic(joint.frame.position[1]),
        dyadic(joint.frame.position[2])
      ]
      const materials = (roles: readonly string[]) =>
        roles.flatMap((role) => {
          const part = source.parts.find(
            ({ id }) => id === `${joint.id}-${role}`
          )
          if (!part) throw new Error('Missing bounded articulation material')
          expect(part.localFrame).toEqual(
            role === 'pin' || role === 'yoke' ? joint.frame : originFrame
          )
          return rawVertices(part)
        })
      const contexts = [
        {
          own: child,
          other: parent,
          u: child.direction,
          ownOrigin: [exactZero, exactZero, exactZero] as ExactPoint,
          otherOrigin: origin,
          material: materials(['pin', 'yoke'])
        }
      ]
      if (parent)
        contexts.push({
          own: parent,
          other: child,
          u: [
            exactNegate(parent.direction[0]),
            exactNegate(parent.direction[1]),
            exactNegate(parent.direction[2])
          ],
          ownOrigin: origin,
          otherOrigin: [exactZero, exactZero, exactZero],
          material: materials(['sleeve', 'neck'])
        })
      for (const context of contexts) {
        endpointCount++
        const other = context.other
        const profile =
          other?.vertices.map((p): ExactPoint => [
            other.axis === 0 ? exactZero : p[0],
            other.axis === 1 ? exactZero : p[1],
            other.axis === 2 ? exactZero : p[2]
          ]) ?? []
        const support = exactProjection(
          [[exactZero, exactZero, exactZero], ...profile, ...context.material],
          context.u
        ).max
        const supported = exactAdd(
          support,
          dyadic(child.section * source.definition.sourceModel.axialGapRatio)
        )
        const nominal = dyadic(
          context.own.section * source.definition.sourceModel.linkSetbackRatio
        )
        const required =
          exactSign(exactSubtract(supported, nominal)) > 0 ? supported : nominal
        const ownPoints = context.own.vertices.map((p) =>
          vectorSubtract(p, context.ownOrigin)
        )
        const actual = exactProjection(ownPoints, context.u).min
        expect(
          exactSign(exactSubtract(actual, required)),
          joint.id
        ).toBeGreaterThanOrEqual(0)
        const nearest = ownPoints.findIndex(
          (p) => exactSign(exactSubtract(vectorDot(p, context.u), actual)) === 0
        )
        const raw = context.own.vertices[nearest],
          axis = context.own.axis
        const towardPivot = exactSign(context.u[axis]) > 0 ? -1 : 1
        const adjacent = dyadic(
          adjacentBinary64(displayDyadic(raw[axis]), towardPivot)
        )
        const moved: ExactPoint = [
          axis === 0 ? adjacent : raw[0],
          axis === 1 ? adjacent : raw[1],
          axis === 2 ? adjacent : raw[2]
        ]
        expect(
          exactSign(
            exactSubtract(
              vectorDot(vectorSubtract(moved, context.ownOrigin), context.u),
              required
            )
          ),
          `${joint.id} - closest feasible binary64 endpoint`
        ).toBeLessThan(0)
        if (context.other) {
          const profileSupport = exactProjection(
            [[exactZero, exactZero, exactZero], ...profile],
            context.u
          ).max
          const otherActual = exactProjection(
            context.other.vertices.map((p) =>
              vectorSubtract(p, context.otherOrigin)
            ),
            context.u
          ).max
          expect(
            exactSign(exactSubtract(otherActual, profileSupport)),
            joint.id
          ).toBeLessThanOrEqual(0)
        }
      }
    }
    expect(endpointCount).toBe(58)
  })

  it('rejects a link exhausted by resolved endpoint requirements at the source owner', () => {
    const raw = structuredClone(
      createSyntheticWalkingRobotDefinition({ definitionId: 'exhausted-core' })
    )
    const changed = readWalkingRobotDefinition({
      ...raw,
      arms: raw.arms.map((arm, index) =>
        index === 0
          ? { ...arm, forearm: { ...arm.forearm, length: 0.052 } }
          : arm
      )
    })
    expect(() => new WalkingRobotSourceOwner().prepare(changed)).toThrow(
      'No positive link core remains'
    )
  })

  it('rejects an articulation profile whose radial neck cannot meet its sleeve', () => {
    const raw = structuredClone(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'disconnected-bearing'
      })
    )
    const changed = {
      ...raw,
      sourceModel: { ...raw.sourceModel, sleeveInnerRadiusRatio: 0.49 }
    }
    expect(() =>
      new WalkingRobotSourceOwner().prepare(readWalkingRobotDefinition(changed))
    ).toThrow()
  })

  it.each(['stowed', 'leftWorking', 'rightWorking'] as const)(
    '%s records actual source extent and sole datum without granting terrain standing',
    (preset) => {
      const owner = new WalkingRobotSourceOwner()
      const source = owner.prepare(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'source-envelope'
        })
      )
      const joints = source.rig.presets[preset]
      const pose = owner.evaluate(source, { base: originFrame, joints })
      const oldJoints = {
        ...joints,
        arms: joints.arms.map((arm) => {
          const active =
            (preset === 'leftWorking' && arm.side === 'left') ||
            (preset === 'rightWorking' && arm.side === 'right')
          return active
            ? arm
            : {
                ...arm,
                shoulderPitch: -0.8,
                elbowPitch: 1.35,
                wristPitch: -0.55
              }
        }),
        legs: joints.legs.map((leg) => ({ ...leg, hip: 0.25, knee: 1 }))
      }
      const previous = owner.evaluate(source, {
        base: originFrame,
        joints: oldJoints
      })
      const actual = actualPoseEnvelope(pose),
        prior = actualPoseEnvelope(previous)
      for (const axis of [0, 2])
        expect(
          exactSign(
            exactSubtract(
              exactSubtract(
                actual.projections[axis].max,
                actual.projections[axis].min
              ),
              exactSubtract(
                prior.projections[axis].max,
                prior.projections[axis].min
              )
            )
          )
        ).toBeLessThanOrEqual(0)
      for (const chain of source.rig.armChains)
        if (
          (preset === 'leftWorking' && chain.side === 'left') ||
          (preset === 'rightWorking' && chain.side === 'right')
        )
          expect(
            pose.frames.tools.find(({ chainId }) => chainId === chain.id)
          ).toEqual(
            previous.frames.tools.find(({ chainId }) => chainId === chain.id)
          )
      const soles = source.rig.contacts.feet.map(({ part, patch }) => {
        const frame = required(
          pose.bodyTransforms.find(({ id }) => id === part.bodyId)
        ).transform
        const points = patch.ranges.flatMap((range) =>
          exactTriangles(part, frame, range).flat()
        )
        const y = exactProjection(points, coordinateAxes[1])
        return { id: part.id, min: y.min, max: y.max }
      })
      const coplanar = soles.every(
        ({ min, max }) =>
          exactSign(exactSubtract(min, max)) === 0 &&
          exactSign(exactSubtract(min, soles[0].min)) === 0
      )
      const offset = coplanar
        ? displayDyadic(exactNegate(soles[0].min))
        : undefined
      console.info(
        'W2 source/FK geometry',
        JSON.stringify({
          preset,
          current: actual.display,
          previous: prior.display,
          soles: soles.map(({ id, min, max }) => ({
            id,
            lowestY: displayDyadic(min),
            highestY: displayDyadic(max)
          })),
          requiredBaseGroundingOffsetY: offset
        })
      )
      expect(
        coplanar,
        'sole datum only; no terrain or standing admission'
      ).toBe(true)
    },
    30000
  )

  it.each(['stowed', 'leftWorking', 'rightWorking'] as const)(
    '%s proves every different-body material pair and named contact locus',
    (preset) => {
      const owner = new WalkingRobotSourceOwner()
      const source = owner.prepare(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'whole-material-proof'
        })
      )
      certifyWholePose(
        source,
        owner.evaluate(source, {
          base: originFrame,
          joints: source.rig.presets[preset]
        })
      )
    },
    30000
  )
  it.each([-0.01, 0.01])(
    'retains normal stowed source material at the translated candidate %s without claiming a continuous path',
    (distance) => {
      const owner = new WalkingRobotSourceOwner()
      const definition = createSyntheticWalkingRobotDefinition({
        definitionId: 'translated-source-candidate'
      })
      const source = owner.prepare(definition)
      const pose = owner.evaluate(source, {
        base: { position: [distance, 0, 0], rotation: [0, 0, 0, 1] },
        joints: source.rig.presets.stowed
      })
      certifyWholePose(source, pose)
      expect(owner.prepare(definition)).toBe(source)
      expect(pose.source).toBe(source)
      expect(
        pose.bodyTransforms.every(({ sourceParts }) =>
          sourceParts.every((part) => source.parts.includes(part))
        )
      ).toBe(true)
    },
    30000
  )

  it('certifies emitted housing cells and preserves the quaternion sign equivalence', () => {
    const definition = createSyntheticWalkingRobotDefinition({
      definitionId: 'housing-certificate'
    })
    const source = new WalkingRobotSourceOwner().prepare(definition)
    for (const part of source.parts)
      for (const region of part.regions)
        certifyConvexTriangles(
          exactTriangles(
            part,
            {
              position: [0, 0, 0],
              rotation: [0, 0, 0, 1]
            },
            region
          ),
          `${part.id}/${region.id}`
        )
    const opposite = structuredClone(definition)
    const changed = readWalkingRobotDefinition({
      ...opposite,
      arms: opposite.arms.map((arm) => ({
        ...arm,
        mount: {
          ...arm.mount,
          rotation: arm.mount.rotation.map((value) => -value)
        }
      })),
      legs: opposite.legs.map((leg) => ({
        ...leg,
        mount: {
          ...leg.mount,
          rotation: leg.mount.rotation.map((value) => -value)
        }
      }))
    })
    const other = new WalkingRobotSourceOwner().prepare(changed)
    for (const id of ['chassis', 'carriage']) {
      const original = required(source.parts.find((part) => part.id === id))
      expect(
        required(other.parts.find((part) => part.id === id)).shape
      ).toEqual(original.shape)
      for (const region of original.regions) {
        const certificate = certifyConvexTriangles(
          exactTriangles(
            original,
            {
              position: [0, 0, 0],
              rotation: [0, 0, 0, 1]
            },
            region
          ),
          id
        )
        expect(
          certificate.normals.every(
            (normal) =>
              normal.filter((coefficient) => exactSign(coefficient) !== 0)
                .length === 1
          )
        ).toBe(true)
      }
    }
  }, 30000)

  it('keeps both opposed tools materially separate in the canonical stowed pose', () => {
    const owner = new WalkingRobotSourceOwner()
    const source = owner.prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'opposed-tools' })
    )
    const pose = owner.evaluate(source, {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints: source.rig.presets.stowed
    })
    for (const role of ['support', 'cutter']) {
      const pair = ['left', 'right'].map((side) => {
        const body = required(
          pose.bodyTransforms.find(({ id }) => id === `${side}-${role}-tool`)
        )
        const part = required(body.sourceParts.find(({ id }) => id === body.id))
        return certifyConvexTriangles(
          exactTriangles(part, body.transform, part.regions[0]),
          body.id
        )
      })
      expect(convexMaterialRelation(pair[0], pair[1]), role).toBe('separated')
    }
  })

  it('constructs every revolute bearing from a closed annular source with an empty pin cavity', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'closed-articulation'
      })
    )
    const revolute = source.rig.joints.filter(
      ({ motion }) => motion === 'revolute'
    )
    expect(revolute).toHaveLength(34)
    for (const joint of revolute) {
      const sleeve = source.parts.find(({ id }) => id === `${joint.id}-sleeve`)
      expect(sleeve, joint.id).toBeDefined()
      if (!sleeve)
        throw new Error(`Missing canonical annular sleeve: ${joint.id}`)
      expect(sleeve.bodyId).toBe(joint.childBodyId)
      const triangles = exactTriangles(sleeve, {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1]
      })
      expect(
        pointInClosedTriangles([exactZero, exactZero, exactZero], triangles),
        joint.id
      ).toBe('outside')
      expect(sleeve.regions, joint.id).toHaveLength(8)
      const neck = required(
        source.parts.find(({ id }) => id === `${joint.id}-neck`)
      )
      const neckRegions = neck.regions.map((region) =>
        certifyConvexTriangles(
          exactTriangles(
            neck,
            { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
            region
          ),
          neck.id
        )
      )
      const wedges = sleeve.regions.map((region) =>
        certifyConvexTriangles(
          exactTriangles(
            sleeve,
            { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
            region
          ),
          `${joint.id}/${region.id}`
        )
      )
      expect(
        neckRegions.some((neckRegion) =>
          wedges.some(
            (wedge) => convexMaterialRelation(neckRegion, wedge) !== 'separated'
          )
        ),
        joint.id
      ).toBe(true)
      for (let first = 0; first < wedges.length; first++) {
        const wedge = wedges[first]
        expect(
          pointInClosedTriangles(
            [exactZero, exactZero, exactZero],
            wedge.triangles
          )
        ).toBe('outside')
        const centroid = (axis: number) =>
          wedge.points.reduce(
            (sum, point) =>
              exactAdd(sum, exactScale(point[axis], 1 / wedge.points.length)),
            exactZero
          )
        const material: ExactPoint = [centroid(0), centroid(1), centroid(2)]
        expect(
          wedges.filter(
            (candidate) =>
              pointInClosedTriangles(material, candidate.triangles) === 'inside'
          )
        ).toHaveLength(1)
        expect(() =>
          certifyConvexTriangles(
            wedge.triangles.slice(1),
            'missing cap or seam'
          )
        ).toThrow()
        expect(() =>
          certifyConvexTriangles(
            wedge.triangles.filter((_, index) => index !== 4),
            'missing radial seam'
          )
        ).toThrow()
        const axis = { x: 0, y: 1, z: 2 }[joint.axis]
        const radii = wedge.points.map((p) =>
          p.reduce(
            (sum, value, index) =>
              index === axis ? sum : exactAdd(sum, exactMultiply(value, value)),
            exactZero
          )
        )
        const minRadius = radii.reduce((a, b) =>
          exactSign(exactSubtract(a, b)) < 0 ? a : b
        )
        const maxRadius = radii.reduce((a, b) =>
          exactSign(exactSubtract(a, b)) > 0 ? a : b
        )
        const threshold = exactScale(exactAdd(minRadius, maxRadius), 0.5)
        const collapsed = wedge.triangles.map((triangle): ExactTriangle => {
          const changed = triangle.map((p): ExactPoint => {
            const radius = p.reduce(
              (sum, value, index) =>
                index === axis
                  ? sum
                  : exactAdd(sum, exactMultiply(value, value)),
              exactZero
            )
            if (exactSign(exactSubtract(radius, threshold)) >= 0) return p
            return [
              axis === 0 ? p[0] : exactZero,
              axis === 1 ? p[1] : exactZero,
              axis === 2 ? p[2] : exactZero
            ]
          })
          return [changed[0], changed[1], changed[2]]
        })
        expect(() =>
          certifyConvexTriangles(collapsed, 'collapsed inner radius')
        ).toThrow()
        for (let second = first + 1; second < wedges.length; second++)
          expect(
            convexMaterialRelation(wedge, wedges[second]),
            joint.id
          ).not.toBe('volume-overlap')
      }
    }
  }, 30000)

  it.each(['stowed', 'leftWorking', 'rightWorking'] as const)(
    '%s has no material-volume overlap across an authored joint',
    (preset) => {
      const owner = new WalkingRobotSourceOwner()
      const source = owner.prepare(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'solid-articulation-regression'
        })
      )
      const pose = owner.evaluate(source, {
        base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        joints: source.rig.presets[preset]
      })
      const byBody = new Map(pose.bodyTransforms.map((body) => [body.id, body]))
      const regions = new Map(
        pose.bodyTransforms.map((body) => [
          body.id,
          body.sourceParts.flatMap((part) =>
            part.regions.map((region) => ({
              id: `${part.id}/${region.id}`,
              certificate: certifyConvexTriangles(
                exactTriangles(part, body.transform, region),
                `${part.id}/${region.id}`
              )
            }))
          )
        ])
      )
      const overlaps: string[] = []
      let visited = 0
      for (const joint of source.rig.joints) {
        visited++
        expect(
          byBody.has(joint.parentBodyId) && byBody.has(joint.childBodyId)
        ).toBe(true)
        for (const parent of required(regions.get(joint.parentBodyId)))
          for (const child of required(regions.get(joint.childBodyId))) {
            if (
              convexMaterialRelation(parent.certificate, child.certificate) ===
              'volume-overlap'
            ) {
              const witness = strictInteriorWitness(
                parent.certificate.triangles,
                child.certificate.triangles
              )
              overlaps.push(
                `${joint.id}: ${parent.id} / ${child.id} / surface sample ${witness ?? 'none; complete SAT proves volume'}`
              )
            }
          }
      }
      expect(visited).toBe(35)
      expect(overlaps, overlaps.join('\n')).toEqual([])
    },
    30000
  )
})

function bounds(positions: readonly number[]) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let offset = 0; offset < positions.length; offset += 3)
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], positions[offset + axis])
      max[axis] = Math.max(max[axis], positions[offset + axis])
    }
  return { min, max }
}

describe('walking robot canonical source', () => {
  it('owns every expected chain, body, joint and closed source part once', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'source-contract' })
    )
    expect(source.rig.armChains.map(({ id }) => id).sort()).toEqual([
      'left-cutter',
      'left-support',
      'right-cutter',
      'right-support'
    ])
    expect(source.rig.legChains.map(({ id }) => id).sort()).toEqual([
      'left-front',
      'left-middle',
      'left-rear',
      'right-front',
      'right-middle',
      'right-rear'
    ])
    expect(new Set(source.rig.bodies.map(({ id }) => id)).size).toBe(
      source.rig.bodies.length
    )
    expect(new Set(source.rig.joints.map(({ id }) => id)).size).toBe(
      source.rig.joints.length
    )
    expect(
      new Set(source.rig.joints.map(({ childBodyId }) => childBodyId)).size
    ).toBe(source.rig.joints.length)
    const bodyIds = new Set(source.rig.bodies.map(({ id }) => id))
    expect(
      source.rig.joints.every(
        ({ parentBodyId, childBodyId }) =>
          bodyIds.has(parentBodyId) && bodyIds.has(childBodyId)
      )
    ).toBe(true)
    for (const body of source.rig.bodies)
      for (const part of body.parts) {
        expect(part.bodyId).toBe(body.id)
        expect(
          source.parts.filter((candidate) => candidate === part)
        ).toHaveLength(1)
        expect(part.material.evidence).toEqual({
          kind: 'synthetic',
          id: 'walking-source-materials-v1',
          label: 'Walking robot source materials - synthetic assumptions'
        })
        expect(part.material.evidence).not.toBe(
          source.definition.geometryEvidence
        )
      }
    for (const part of source.parts) {
      expect(part.regions.length).toBeGreaterThan(0)
      expect(part.regions.every(({ kind }) => kind === 'closed-solid')).toBe(
        true
      )
      expect(
        part.regions.reduce((count, region) => count + region.indexCount, 0)
      ).toBe(part.shape.indices.length)
      const extent = bounds(part.shape.positions)
      expect(extent.max.map((value, axis) => value - extent.min[axis])).toEqual(
        part.size
      )
      for (const patch of part.patches)
        for (const range of patch.ranges) {
          expect(part.regions.includes(patch.region)).toBe(true)
          expect(range.indexStart).toBeGreaterThanOrEqual(
            patch.region.indexStart
          )
          expect(range.indexStart + range.indexCount).toBeLessThanOrEqual(
            patch.region.indexStart + patch.region.indexCount
          )
        }
    }
    expect(source.parts.map(({ id }) => id).join('|')).not.toMatch(
      /wheel|tire|tread|hub|axle|single-wrist/
    )
    expect(
      source.rig.joints.find(({ id }) => id === 'carriage-lift')
    ).toMatchObject({ axis: 'y', motion: 'prismatic' })
    for (const chain of source.rig.armChains)
      expect(
        chain.jointIds.map(
          (id) => source.rig.joints.find((joint) => joint.id === id)?.axis
        )
      ).toEqual(['y', 'x', 'x', 'x'])
    for (const chain of source.rig.legChains)
      expect(
        chain.jointIds.map(
          (id) => source.rig.joints.find((joint) => joint.id === id)?.axis
        )
      ).toEqual(['z', 'x', 'x'])
  })

  it('keeps synthetic material assumptions distinct from measured geometry evidence', () => {
    const raw = {
      ...structuredClone(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'measured-shape'
        })
      ),
      geometryEvidence: {
        kind: 'measured' as const,
        id: 'geometry-survey-12'
      }
    }
    const definition = readWalkingRobotDefinition(raw)
    const source = new WalkingRobotSourceOwner().prepare(definition)
    expect(source.definition.geometryEvidence).toEqual({
      kind: 'measured',
      id: 'geometry-survey-12'
    })
    expect(
      source.parts.every(
        ({ material }) =>
          material.evidence.kind === 'synthetic' &&
          material.evidence.id === 'walking-source-materials-v1'
      )
    ).toBe(true)
  })

  it('publishes distinct loci without granting contact or collision permission', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'patches' })
    )
    expect(source.rig.contacts.feet).toHaveLength(6)
    expect(source.rig.contacts.supportTools).toHaveLength(2)
    expect(source.rig.contacts.cuttingEdges).toHaveLength(2)
    expect(
      new Set(source.rig.contacts.feet.map(({ patch }) => patch.id)).size
    ).toBe(6)
    expect(
      source.rig.contacts.supportTools.every(
        ({ part }) => part.material.material === 'synthetic-soft-textile'
      )
    ).toBe(true)
    expect(
      source.rig.contacts.cuttingEdges.every(
        ({ part, patch }) =>
          part.material.material === 'synthetic-hardened-steel' &&
          part.size[0] < part.size[2] &&
          patch.ranges[0].indexStart === 6
      )
    ).toBe(true)
    expect(source.parts.filter(({ id }) => id.endsWith('-guard'))).toHaveLength(
      4
    )
    for (const jointInterface of source.rig.jointInterfaces) {
      const joint = source.rig.joints.find(
        ({ id }) => id === jointInterface.jointId
      )
      expect(joint).toBeDefined()
      expect(jointInterface.frame).toBe(joint?.frame)
      expect(jointInterface.axis).toBe(joint?.axis)
      expect(jointInterface.domain).toBe(joint?.domain)
      expect(jointInterface.materialInterface).toBe('unmodeled')
      if (joint?.motion === 'prismatic') {
        expect(jointInterface.parentPatches).toHaveLength(2)
        expect(jointInterface.childPatches.length).toBeGreaterThan(0)
      } else {
        expect(jointInterface.parentPatches).toEqual([])
        expect(jointInterface.childPatches).toEqual([])
      }
      expect(jointInterface).not.toHaveProperty('envelope')
      expect(jointInterface).not.toHaveProperty('collisionExemption')
    }
  })

  it('binds complete positive mass properties and a one-definition lifetime', () => {
    const owner = new WalkingRobotSourceOwner()
    const definition = createSyntheticWalkingRobotDefinition({
      definitionId: 'lifetime-a'
    })
    const first = owner.prepare(definition)
    expect(owner.prepare(definition)).toBe(first)
    expect(owner.read()).toBe(first)
    expect(owner.isCurrent(first)).toBe(true)
    expect(owner.work.builds).toBe(1)
    expect(first.massProperties.definition).toBe(definition)
    expect(first.massProperties.totalMassKg).toBeGreaterThan(40)
    expect(
      first.massProperties.bodies.every(
        ({ massKg, localCoM }) => massKg > 0 && localCoM.every(Number.isFinite)
      )
    ).toBe(true)
    expect(
      new Set(first.massProperties.bodies.map(({ bodyId }) => bodyId))
    ).toEqual(new Set(first.rig.bodies.map(({ id }) => id)))
    const next = owner.prepare(
      readWalkingRobotDefinition({
        ...structuredClone(definition),
        definitionId: 'lifetime-b'
      })
    )
    expect(next).not.toBe(first)
    expect(owner.isCurrent(first)).toBe(false)
    expect(owner.work.builds).toBe(2)
    expect(() =>
      owner.evaluate(first, {
        base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        joints: first.rig.presets.stowed
      })
    ).toThrow(/Stale/)
    expect(
      owner.evaluate(next, {
        base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        joints: next.rig.presets.stowed
      }).source
    ).toBe(next)
    owner.clear()
    expect(owner.read()).toBeUndefined()
    expect(owner.isCurrent(next)).toBe(false)
  })
})
