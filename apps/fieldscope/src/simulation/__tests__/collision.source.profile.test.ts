import { expect, it } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import { prepareHierarchy, queryHierarchy } from './source-hierarchy'
import { setup, coverage, expectedInventory } from './collision-test-fixtures'

it('profiles cold source hierarchy and two warm poses without Cartesian triangle traversal', () => {
  const configuration = { ...DEFAULT_CONFIGURATION, length: 2.2 },
    site = new SiteGeometry()
  const f = setup(buildSiteMeshes(configuration, site), configuration, site),
    tree = prepareHierarchy(f.source)
  expect(tree.work.leafReferences).toBe(tree.work.builtTriangles)
  console.log(
    'hierarchy cold source profile',
    JSON.stringify({
      work: tree.work,
      milliseconds: tree.milliseconds,
      payloadBytes: tree.payloadBytes
    })
  )
  for (const yaw of [0, 0.4]) {
    const input = coverage()
    if (!input.robot) throw new Error('Expected robot')
    input.robot = {
      ...input.robot,
      base: {
        position: [0, 0, 0],
        rotation: [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]
      }
    }
    const baselineStart = performance.now(),
      baseline = f.query.cover(f.source, { ...input, maxTrianglePairs: 0 }),
      baselineMs = performance.now() - baselineStart
    const report = queryHierarchy(tree, input)
    expect(report.work.total).toBe(expectedInventory(f.source).trianglePairs)
    expect(
      report.work.excluded + report.work.candidates + report.work.unvisited
    ).toBe(report.work.total)
    expect(report.work.nodePairs).toBeLessThanOrEqual(500000)
    expect(report.candidates).toHaveLength(0)
    console.log(
      'hierarchy warm pose profile',
      JSON.stringify({
        yaw,
        baselineRemaining: baseline.coverage.unvisited,
        baselineMs,
        work: report.work,
        milliseconds: report.milliseconds
      })
    )
  }
})
