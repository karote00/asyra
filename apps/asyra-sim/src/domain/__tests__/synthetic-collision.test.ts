import { expect, it } from 'vitest'
import { runOriginalPartMethod } from '../../analysis/methods/original-part-method'
import { completeAnalysisResult } from '../../analysis/result'
import { collisionStarterSnapshot } from './collision-starter-fixture'

it('the full-workcell starter checks every part, independently finding tool/table contact and reporting a failed verdict', async () => {
  const snapshot = await collisionStarterSnapshot()

  expect(snapshot.pairs).toHaveLength(46)
  expect(
    new Set(snapshot.pairs.flatMap((pair) => [pair.a.bodyId, pair.b.bodyId]))
  ).toEqual(new Set(snapshot.workcell.bodies.map((body) => body.id)))
  const tablePairs = snapshot.pairs.filter(
    (pair) =>
      [pair.a.bodyId, pair.b.bodyId].includes('example:fixture-table') &&
      [pair.a.bodyId, pair.b.bodyId].some(
        (id) => id === 'example:gripper' || id === 'example:workpiece'
      )
  )
  const tablePairIds = new Set(tablePairs.map((pair) => pair.id))

  expect(tablePairs).toHaveLength(2)
  expect(
    snapshot.workcell.bodies.every((body) =>
      body.colliders.every((part) => part.geometry.kind === 'mesh')
    )
  ).toBe(true)
  for (const time of [0, 8]) {
    const endpoint = runOriginalPartMethod({
      ...snapshot,
      interval: [time, time]
    })
    expect(endpoint.coverage).toBe('complete')
    expect(
      endpoint.pairs
        .filter((pair) => tablePairIds.has(pair.pairId))
        .every((pair) =>
          pair.evidence.leaves.every((leaf) => leaf.state === 'clear')
        )
    ).toBe(true)
  }
  const evidence = runOriginalPartMethod(snapshot)
  expect(evidence.coverage).toBe('partial')
  expect(evidence.pairs).toHaveLength(snapshot.pairs.length)

  const unresolved = evidence.pairs.filter(
    (pair) => pair.evidence.coverage === 'partial'
  )

  expect(unresolved.length).toBeGreaterThan(0)
  expect(
    unresolved.every((pair) =>
      pair.evidence.leaves.some(
        (leaf) => leaf.state === 'unresolved' && leaf.reason.includes('budget')
      )
    )
  ).toBe(true)

  const fullPathResult = completeAnalysisResult(snapshot, evidence, {
    runId: 'full-path-run',
    startedAt: 100,
    endedAt: 200
  })

  expect(fullPathResult.execution).toBe('completed')
  expect(fullPathResult.coverage).toBe('partial')
  expect(fullPathResult.unresolvedPairCount).toBeGreaterThan(0)
  expect(fullPathResult.verdict).not.toBe('meets')

  // The complete source and budget remain unchanged. A pose query is not a path proof.
  const pose = runOriginalPartMethod({ ...snapshot, interval: [4, 4] })

  expect(pose.coverage).toBe('complete')
  expect(pose.pairs).toHaveLength(snapshot.pairs.length)

  for (const pair of pose.pairs.filter((pair) =>
    tablePairIds.has(pair.pairId)
  )) {
    expect(
      pair.evidence.leaves.some(
        (leaf) =>
          leaf.state === 'finding' && leaf.penetration && leaf.witnessTime === 4
      )
    ).toBe(true)
  }
  const result = completeAnalysisResult(
    { ...snapshot, interval: [4, 4] },
    pose,
    {
      runId: 'collision-run',
      startedAt: 100,
      endedAt: 200
    }
  )
  expect(result.execution).toBe('completed')
  expect(result.summary).toBe('issue-found')
  expect(result.verdict).toBe('does-not-meet')
  expect(result.findingPairCount).toBeGreaterThanOrEqual(2)
  expect(result.unresolvedPairCount).toBe(0)
}, 20000)

it('the focused report replay witness is a real contact pose for the complete workcell', async () => {
  const snapshot = await collisionStarterSnapshot()
  const evidence = runOriginalPartMethod({ ...snapshot, interval: [3.9, 3.9] })
  const source = snapshot.pairs.find(
    (pair) =>
      pair.a.bodyId === 'example:gripper' &&
      pair.b.bodyId === 'example:fixture-table'
  )
  const pair = evidence.pairs.find((pair) => pair.pairId === source?.id)

  expect(evidence.pairs).toHaveLength(46)
  expect(evidence.coverage).toBe('complete')
  expect(
    pair?.evidence.leaves.find((leaf) => leaf.state === 'finding')
  ).toMatchObject({ penetration: true, witnessTime: 3.9 })
})
