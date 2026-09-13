import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { inspectMeshTopology } from '../../../domain/mesh-topology'
import { inspectLocalConvexity } from '../__fixtures__/component-convexity-oracle'
import { representativeSnapshot } from './representative-fixture'

it.runIf(process.env.SIM_CERTIFIED_COMPONENT_ADMISSION === '1')(
  'censuses every original component before claiming convex-source applicability',
  async () => {
    const started = performance.now(),
      snapshot = await representativeSnapshot(0)
    let work = 0,
      topologyWork = 0
    const tick = () => {
      if (++work > 500000) throw new Error('Complete source census work limit')
      if (performance.now() - started > 20000)
        throw new Error('Complete source census time limit')
    }
    const rows: {
      body: string
      collider: string
      source: string
      component: number
      triangles: number
      state: string
      positive: number
      negative: number
      coplanar: number
      work: number
      witnesses: ReturnType<typeof inspectLocalConvexity>['witnesses']
    }[] = []
    for (const body of snapshot.workcell.bodies)
      for (const collider of body.colliders) {
        const geometry = collider.geometry
        if (geometry.kind !== 'mesh') continue
        const topology = inspectMeshTopology(geometry, () => {
          tick()
          topologyWork++
        })
        expect(topology.issue).toBeNull()
        for (
          let component = 0;
          component < topology.components.length;
          component++
        ) {
          const offsets = topology.components[component]
          const result = inspectLocalConvexity(geometry, offsets, tick)
          rows.push({
            body: body.id,
            collider: collider.id,
            source: geometry.source.assetId,
            component,
            triangles: offsets.length,
            ...result
          })
        }
        expect(topology.components.flat().length * 3).toBe(
          geometry.indices.length
        )
      }
    const summary = Array.from(new Set(rows.map((r) => r.body))).map((body) => {
      const components = rows.filter((r) => r.body === body)
      return {
        body,
        components: components.length,
        reflex: components.filter((r) => r.state === 'reflex').length,
        undecided: components.filter((r) => r.state === 'undecided').length,
        triangles: components.reduce((sum, r) => sum + r.triangles, 0),
        reflexTriangles: components
          .filter((r) => r.state === 'reflex')
          .reduce((sum, r) => sum + r.triangles, 0)
      }
    })
    const path = resolve(
      '../../tmp/capacity/certified-component-admission-verified.json'
    )
    mkdirSync(resolve('../../tmp/capacity'), { recursive: true })
    writeFileSync(
      path,
      JSON.stringify(
        {
          baseline: 'b9f4a710c',
          profile: 'exact local convexity necessary condition',
          complete: true,
          bodies: snapshot.workcell.bodies.length,
          pairs: snapshot.pairs.length,
          frames: snapshot.trajectory.keyframes.length,
          work,
          topologyWork,
          milliseconds: performance.now() - started,
          summary,
          rows,
          note: 'Reflex means exact disproof. Undecided is not certified convexity. No query benchmark was run.'
        },
        null,
        2
      ) + '\n'
    )
    expect(snapshot.workcell.bodies).toHaveLength(39)
    expect(snapshot.pairs).toHaveLength(298)
    expect(snapshot.trajectory.keyframes).toHaveLength(200)
    expect(work).toBe(topologyWork + rows.reduce((sum, r) => sum + r.work, 0))
    expect(work).toBeLessThanOrEqual(500000)
    // Fixed-source negative regression, recorded only after the complete exact census.
    expect(rows).toHaveLength(323)
    expect(rows.filter((row) => row.state === 'reflex')).toHaveLength(294)
    expect(rows.filter((row) => row.state === 'undecided')).toHaveLength(29)
    expect(
      rows
        .filter((row) => row.body === 'example:joint-2')
        .every((row) => row.state === 'reflex')
    ).toBe(true)
    expect(rows.find((row) => row.body === 'example:joint-2')?.source).toBe(
      '8e82edc02dcbd402d9ccfb7f00db82745212f331651861605139a5da7fdde27c'
    )
    // Every original selected body pair has at least one source whose entire
    // component set is disproved. No pair has two potentially convex components.
    for (const pair of snapshot.pairs) {
      const left = rows.filter((row) => row.body === pair.a.bodyId)
      const right = rows.filter((row) => row.body === pair.b.bodyId)
      expect(left.length).toBeGreaterThan(0)
      expect(right.length).toBeGreaterThan(0)
      expect(
        left.every((row) => row.state === 'reflex') ||
          right.every((row) => row.state === 'reflex')
      ).toBe(true)
    }
    // eslint-disable-next-line no-console -- bounded complete-source applicability evidence
    console.info(
      JSON.stringify({
        profile: 'certified-component-admission',
        work,
        topologyWork,
        summary: summary.filter(
          (r) => !r.body.startsWith('obstacle-') || r.body === 'obstacle-11'
        ),
        artifact: path
      })
    )
  },
  20000
)
