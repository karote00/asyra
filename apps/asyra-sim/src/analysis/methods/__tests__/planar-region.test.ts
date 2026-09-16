import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Vec3 } from '../../../domain/math'
import { coplanar, planarRegions } from './planar-region-fixture'
import { representativeSnapshot } from './representative-fixture'

function mesh(points: Vec3[], indices: number[]): MeshGeometry {
  return {
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] },
    positions: points.flat(),
    indices
  }
}
function fan(dent = 0) {
  const ring = [
    [2, 0],
    [2, 2],
    [0, 2],
    [-2, 2],
    [-2, 0],
    [-2, -2],
    [0, -2],
    [2, -2]
  ]
  return mesh(
    [[0, 0, dent], ...ring.map(([x, y]) => [x, y, x + y] as Vec3)],
    ring.flatMap((_, i) => [0, i + 1, ((i + 1) % 8) + 1])
  )
}
function measured(input: MeshGeometry) {
  const counts: Record<string, number> = {}
  const result = planarRegions(input, (kind) => {
    counts[kind] = (counts[kind] ?? 0) + 1
  })
  return {
    result,
    counts,
    work: Object.values(counts).reduce((a, b) => a + b, 0)
  }
}

it('proves non-cardinal exact planes and detects a subnormal departure', () => {
  const base: readonly [Vec3, Vec3, Vec3] = [
    [1, 0, 1],
    [0, 1, 1],
    [-1, 0, -1]
  ]
  expect(coplanar([...base, [0, 0, 0]], () => undefined)).toBe(true)
  expect(coplanar([...base, [0, 0, Number.MIN_VALUE]], () => undefined)).toBe(
    false
  )
  expect(coplanar([...base, [0, 0, -Number.MIN_VALUE]], () => undefined)).toBe(
    false
  )
})

it('partitions a planar fan exactly once and does not erase a tiny dent', () => {
  const flat = measured(fan())
  expect(flat.result.regions).toHaveLength(1)
  expect(flat.result.sharedEdges).toBe(8)
  expect(flat.result.coplanarEdges).toBe(8)
  expect(flat.result.regions.flat().sort((a, b) => a - b)).toEqual(
    Array.from({ length: 8 }, (_, i) => 3 * i)
  )
  expect(flat.result.optimisticFourfold).toBe(true)
  // The outer square has a midpoint on each side: a dent creates four planes,
  // each containing the two triangles along one straight side.
  expect(measured(fan(Number.MIN_VALUE)).result.regions).toHaveLength(4)
  expect(flat.counts['exact-zero']).toBe(8)
  expect(flat.counts['edge-lookup']).toBe(24)
  expect(flat.counts['face-visit']).toBe(8)
  expect(flat.counts['neighbor-lookup']).toBe(16)
})

it('keeps a planar hole optimistic and never claims its union is convex', () => {
  const points: Vec3[] = [
    [-2, -2, 0],
    [2, -2, 0],
    [2, 2, 0],
    [-2, 2, 0],
    [-1, -1, 0],
    [1, -1, 0],
    [1, 1, 0],
    [-1, 1, 0]
  ]
  const indices = [
    0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7
  ]
  const result = measured(mesh(points, indices)).result
  expect(result.regions).toHaveLength(1)
  expect(result.optimisticFourfold).toBe(true)
  expect(Object.keys(result).sort()).toEqual(
    [
      'triangles',
      'sharedEdges',
      'coplanarEdges',
      'regions',
      'optimisticFourfold'
    ].sort()
  )
})

it('keeps disconnected coplanar triangles separate and accepts exact coordinate adjacency', () => {
  const separate = mesh(
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 0],
      [2, 1, 0]
    ],
    [0, 1, 2, 3, 4, 5]
  )
  expect(measured(separate).result.regions).toHaveLength(2)
  const duplicated = mesh(
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0]
    ],
    [0, 1, 2, 3, 4, 5]
  )
  const result = measured(duplicated).result
  expect(result.regions).toHaveLength(1)
  expect(result.sharedEdges).toBe(1)
  expect(result.optimisticFourfold).toBe(false)
})

it('rejects malformed original adjacency and nonfinite coordinates', () => {
  const points: Vec3[] = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0]
  ]
  expect(() => measured(mesh(points, [0, 1, 2, 0, 1, 3]))).toThrow(
    'orientation'
  )
  expect(() => measured(mesh(points, [0, 1, 2, 1, 0, 3, 0, 1, 3]))).toThrow(
    'Non-manifold'
  )
  expect(() => measured(mesh(points, [0, 0, 2]))).toThrow('Degenerate')
  expect(() => measured(mesh(points, [0, 1, 99]))).toThrow('Invalid original')
  expect(() => measured(mesh([[Infinity, 0, 0]], [0, 0, 0]))).toThrow(
    'Nonfinite'
  )
})

it('owns fresh preparation and equivalent repeated charges without source-hash aliases', () => {
  const source = fan()
  const first = measured(source),
    second = measured(source)
  expect(second).toEqual(first)
  expect(second.result).not.toBe(first.result)
  const sameHashDifferentData = fan(Number.MIN_VALUE)
  expect(sameHashDifferentData.source).toEqual(source.source)
  expect(measured(sameHashDifferentData).result.regions).toHaveLength(4)
})

it('propagates every checkpoint interruption and never publishes a partial region result', () => {
  const source = mesh(
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0]
    ],
    [0, 1, 2, 1, 3, 2]
  )
  const stop = new Error('cancelled')
  for (const input of [source, fan()]) {
    const complete = measured(input)
    if (input === source)
      expect(complete.counts['exact-buffer']).toBeUndefined()
    else {
      for (const kind of [
        'exact-buffer',
        'exact-decode',
        'exact-exponent',
        'exact-align',
        'exact-subtract',
        'exact-multiply',
        'exact-add',
        'exact-zero'
      ])
        expect(complete.counts[kind]).toBeGreaterThan(0)
    }
    for (let at = 1; at <= complete.work; at++) {
      let work = 0,
        published: unknown
      try {
        published = planarRegions(input, () => {
          if (++work === at) throw stop
        })
      } catch (caught) {
        expect(caught).toBe(stop)
      }
      expect(work).toBe(at)
      expect(published).toBeUndefined()
    }
    expect(measured(input)).toEqual(complete)
  }
})

const project = fileURLToPath(new URL('../../../../../../', import.meta.url))
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex')
it.runIf(process.env.SIM_PLANAR_REGION_SCREEN === '1')(
  'screens all original source bindings once under the frozen preparation ceiling',
  async () => {
    const censusPath = process.env.SIM_PLANAR_CENSUS_FILE
    if (!censusPath) throw new Error('Missing reviewed census file path')
    const censusText = readFileSync(censusPath, 'utf8')
    expect(digest(censusText)).toBe(
      'b79710033eadf5263f17b13744c754c58ef353abd65f85fedd318cf940014f99'
    )
    const census = JSON.parse(censusText) as {
      manifest: { inputHash: string }
      work: number
      evaluations: number
      rows: { pair: string; kind: string; traversal: boolean }[]
    }
    expect(census.work).toBe(500197)
    expect(census.evaluations).toBe(20265)
    const snapshot = await representativeSnapshot(0)
    expect(digest(JSON.stringify(snapshot))).toBe(census.manifest.inputHash)
    const required = new Set(
      census.rows
        .filter((r) => r.kind === 'distance' && r.traversal)
        .flatMap((r) => r.pair.split('::'))
    )
    const bindings = snapshot.workcell.bodies.flatMap((body) =>
      body.colliders.map((c) => ({
        key: `${body.id}/${c.id}`,
        geometry: c.geometry
      }))
    )
    expect(bindings).toHaveLength(39)
    const counts: Record<string, number> = {},
      rows: {
        binding: string
        asset: string
        triangles: number
        required: boolean
        state: 'unvisited' | 'running' | 'complete' | 'interrupted'
        start?: number
        end?: number
        result?: ReturnType<typeof planarRegions>
      }[] = bindings.map(({ key, geometry }) => {
        if (geometry.kind !== 'mesh')
          throw new Error('Expected full original source')
        return {
          binding: key,
          asset: geometry.source.assetId,
          triangles: geometry.indices.length / 3,
          required: required.has(key),
          state: 'unvisited'
        }
      })
    expect(rows.filter((r) => r.required)).toHaveLength(3)
    const started = performance.now()
    let work = 0,
      error: string | undefined
    const tick = (kind: string) => {
      if (performance.now() - started >= 20000)
        throw new Error('20000 ms preparation limit')
      counts[kind] = (counts[kind] ?? 0) + 1
      if (++work >= 230088)
        throw new Error('230088 preparation ceiling leaves no query reserve')
    }
    try {
      for (let index = 0; index < bindings.length; index++) {
        const row = rows[index],
          geometry = bindings[index].geometry
        row.state = 'running'
        row.start = work
        tick('binding-admission')
        if (geometry.kind !== 'mesh') throw new Error('Expected mesh')
        const result = planarRegions(geometry, tick)
        tick('binding-publication')
        row.result = result
        row.state = 'complete'
        row.end = work
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
      const active = rows.find((r) => r.state === 'running')
      if (active) {
        active.state = 'interrupted'
        active.end = work
      }
    }
    const milliseconds = performance.now() - started
    const complete = rows.every((r) => r.state === 'complete')
    const admitted =
      complete &&
      rows.filter((r) => r.required).every((r) => r.result?.optimisticFourfold)
    const report = {
      baseline: 'b9f4a710c',
      inputHash: census.manifest.inputHash,
      censusSha256: digest(censusText),
      bindings: bindings.length,
      lifetime:
        'fresh complete preparation per binding, no asset aliases; repeated preparation identically charged',
      ceiling: 230088,
      milliseconds,
      work,
      counts,
      complete,
      admitted,
      error,
      rows,
      note: 'Optimistic exact coplanar regions only. No convex union, global intersection, surface witness, collision or G4 conclusion.'
    }
    mkdirSync(resolve(project, 'tmp/capacity'), { recursive: true })
    writeFileSync(
      resolve(project, 'tmp/capacity/planar-region-screen.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
    // eslint-disable-next-line no-console -- bounded formal source-only receipt
    console.info(
      JSON.stringify({
        ...report,
        rows: rows.map(({ result, ...r }) => ({
          ...r,
          regions: result?.regions.length,
          optimisticFourfold: result?.optimisticFourfold
        }))
      })
    )
    expect(work).toBe(Object.values(counts).reduce((a, b) => a + b, 0))
    expect(
      rows
        .filter((r) => r.state !== 'unvisited')
        .reduce((n, r) => {
          if (r.end === undefined || r.start === undefined)
            throw new Error('Missing charged binding range')
          return n + r.end - r.start
        }, 0)
    ).toBe(work)
    expect(rows.some((r) => r.state === 'running')).toBe(false)
    if (error) {
      expect(admitted).toBe(false)
      expect(error).toMatch(/preparation (ceiling|limit)/)
    } else {
      expect(complete).toBe(true)
      for (const row of rows) {
        if (!row.result) throw new Error('Missing complete region receipt')
        expect(new Set(row.result.regions.flat()).size).toBe(row.triangles)
        expect(row.result.regions.flat().length).toBe(row.triangles)
      }
    }
  },
  30000
)
