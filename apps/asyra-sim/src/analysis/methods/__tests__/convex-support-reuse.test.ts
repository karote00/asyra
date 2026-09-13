import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ORIGINAL_PART_METHOD,
  queryOriginalPartPair
} from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'
import {
  runClearanceQueries,
  type OfficialPairEvidence
} from '../official-method'
import { supportBaseline, supportCases } from './convex-support-reuse-fixture'
import { representativeSnapshot } from './representative-fixture'

interface Counts {
  rotate: number
  dot: number
  norm: number
}
async function observedQuery(
  inspect: (name: keyof Counts, counts: Counts) => void = () => undefined
) {
  const counts: Counts = { rotate: 0, dot: 0, norm: 0 }
  vi.resetModules()
  vi.doMock('../../../domain/kinematic-algebra', async () => {
    const actual = await vi.importActual<
      typeof import('../../../domain/kinematic-algebra')
    >('../../../domain/kinematic-algebra')
    return {
      ...actual,
      poseOperations: ((
        algebra: Parameters<typeof actual.poseOperations>[0]
      ) => {
        const operations = actual.poseOperations(algebra)
        const { rotate, dot, norm } = operations
        operations.rotate = (...args) => {
          counts.rotate++
          inspect('rotate', counts)
          return rotate(...args)
        }
        operations.dot = (...args) => {
          counts.dot++
          inspect('dot', counts)
          return dot(...args)
        }
        operations.norm = (...args) => {
          counts.norm++
          inspect('norm', counts)
          return norm(...args)
        }
        return operations
      }) as typeof actual.poseOperations
    }
  })
  return { counts, query: (await import('../convex-query')).convexDistance }
}
function digest(value: unknown): string {
  // Preserve every binary64 bit, including signed zero, rather than rounded JSON numbers.
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_, item: unknown) => {
        if (typeof item !== 'number') return item
        const bytes = Buffer.alloc(8)
        bytes.writeDoubleBE(item)
        return bytes.toString('hex')
      })
    )
    .digest('hex')
}
afterEach(() => {
  vi.doUnmock('../../../domain/kinematic-algebra')
  vi.resetModules()
})

it.runIf(process.env.SIM_SUPPORT_REUSE_POPULATION === '1')(
  'preserves the complete recorded scenario-zero population and charged work',
  async () => {
    const controlFile = process.env.SIM_SUPPORT_REUSE_CONTROL_FILE
    if (!controlFile) throw new Error('Missing reviewed population control')
    const controlText = readFileSync(controlFile, 'utf8')
    const controlSha256 = createHash('sha256').update(controlText).digest('hex')
    expect(controlSha256).toBe(
      'b79710033eadf5263f17b13744c754c58ef353abd65f85fedd318cf940014f99'
    )
    const control = JSON.parse(controlText) as {
      manifest: { inputHash: string }
      work: number
      evaluations: number
      coverage: string
      pairs: OfficialPairEvidence[]
    }
    const snapshot = await representativeSnapshot(0)
    const inputHash = createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex')
    expect(inputHash).toBe(control.manifest.inputHash)
    expect(snapshot.budget.maxDurationMs).toBe(30000)
    const started = performance.now()
    const checkpoint = () => {
      if (performance.now() - started >= snapshot.budget.maxDurationMs)
        throw new Error('Analysis exceeded its declared wall-time budget.')
    }
    const context = new OriginalMeshQuery(checkpoint)
    const pairs: OfficialPairEvidence[] = []
    let result: ReturnType<typeof runClearanceQueries> | undefined
    let error: string | undefined
    try {
      result = runClearanceQueries(
        snapshot,
        ORIGINAL_PART_METHOD,
        (query, settings, check) =>
          queryOriginalPartPair(query, settings, check, context),
        checkpoint,
        (pair) => pairs.push(pair)
      )
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
    }
    const milliseconds = performance.now() - started
    const output = fileURLToPath(
      new URL(
        '../../../../../../tmp/capacity/convex-support-reuse.json',
        import.meta.url
      )
    )
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(
      output,
      JSON.stringify(
        {
          description:
            'Canonical arithmetic reuse - full recorded partial population parity, not G4',
          controlSha256,
          inputHash,
          runtimeBudgetMs: snapshot.budget.maxDurationMs,
          milliseconds,
          work: context.work,
          evaluations: result?.evaluations,
          coverage: result?.coverage,
          error,
          firstPartialPair: pairs.find(
            (pair) => pair.evidence.coverage === 'partial'
          )?.pairId,
          pairs
        },
        null,
        2
      ) + '\n'
    )
    expect(error).toBeUndefined()
    expect(context.work).toBe(500197)
    expect(context.work).toBe(control.work)
    expect(result?.evaluations).toBe(20265)
    expect(result?.evaluations).toBe(control.evaluations)
    expect(result?.coverage).toBe('partial')
    expect(result?.coverage).toBe(control.coverage)
    // The authoritative control is persisted JSON (which cannot encode -0).
    // Local receipts above separately compare every binary64 output bit.
    expect(JSON.stringify(pairs)).toBe(JSON.stringify(control.pairs))
  },
  // Test harness allowance includes fixture creation/receipt comparison. The
  // actual geometry invocation retains its existing 30000 ms runtime deadline.
  45000
)
describe('iteration-local convex support reuse', () => {
  it('recomputes on every query and after source or pose replacement', async () => {
    const { counts, query } = await observedQuery()
    const inputs = supportCases()
    for (const index of [2, 2, 8, 2, 4, 4]) {
      const input = inputs[index]
      counts.rotate = counts.dot = counts.norm = 0
      expect(
        digest(query(input.a, input.b, input.tolerance, input.iterations))
      ).toBe(supportBaseline[index][1])
      expect(counts).toEqual({
        rotate: index === 4 ? 20 : 18,
        dot: 23,
        norm: 13
      })
    }
    // Reuse the exact shape identity with changed geometry: no identity cache.
    const input = inputs[0]
    input.a.geometry = { kind: 'sphere', radius: 0.2 }
    counts.rotate = counts.dot = counts.norm = 0
    const changed = query(input.a, input.b, input.tolerance, input.iterations)
    const changedCounts = { ...counts }
    expect(digest(changed)).not.toBe(supportBaseline[0][1])
    counts.rotate = counts.dot = counts.norm = 0
    expect(
      query({ ...input.a }, { ...input.b }, input.tolerance, input.iterations)
    ).toEqual(changed)
    expect(counts).toEqual(changedCounts)
    expect(counts.rotate).toBeGreaterThan(0)
  })
  it('does not retain a partial record after a synchronous arithmetic failure', async () => {
    const sentinel = new Error('test-owned arithmetic interruption')
    for (let stop = 1; stop <= 8; stop++) {
      let armed = true
      const { counts, query } = await observedQuery((name, current) => {
        if (armed && name === 'rotate' && current.rotate === stop)
          throw sentinel
      })
      const input = supportCases()[0]
      expect(() =>
        query(input.a, input.b, input.tolerance, input.iterations)
      ).toThrow(sentinel)
      armed = false
      counts.rotate = counts.dot = counts.norm = 0
      expect(
        digest(query(input.a, input.b, input.tolerance, input.iterations))
      ).toBe(supportBaseline[0][1])
      expect(counts).toEqual({ rotate: 8, dot: 8, norm: 4 })
    }
  })
  it('isolates a reentrant invocation from the interrupted outer arithmetic', async () => {
    let nested = false
    let nestedDigest: string | undefined
    const input = supportCases()[0]
    const observed = await observedQuery((name) => {
      if (name !== 'rotate' || nested) return
      nested = true
      nestedDigest = digest(
        observed.query(input.a, input.b, input.tolerance, input.iterations)
      )
    })
    expect(
      digest(
        observed.query(input.a, input.b, input.tolerance, input.iterations)
      )
    ).toBe(supportBaseline[0][1])
    expect(nestedDigest).toBe(supportBaseline[0][1])
    expect(observed.counts).toEqual({ rotate: 16, dot: 16, norm: 8 })
  })
  it('preserves frozen bitwise evidence and removes only repeated directional arithmetic', async () => {
    const { counts, query } = await observedQuery()
    const rows = supportCases().map((test) => {
      counts.rotate = counts.dot = counts.norm = 0
      const evidence = query(test.a, test.b, test.tolerance, test.iterations)
      return {
        name: test.name,
        digest: digest(evidence),
        counts: { ...counts }
      }
    })
    expect(rows.map(({ name, digest }) => ({ name, digest }))).toEqual(
      supportBaseline.map(([name, digest]) => ({ name, digest }))
    )
    expect(rows.map(({ counts }) => counts)).toEqual(
      supportBaseline.map(
        ([, , rotate, dot, norm, continued, triangles, radial]) => ({
          rotate: rotate - 2 * continued,
          dot: dot - 3 * triangles * continued,
          norm: norm - radial * continued
        })
      )
    )
  })
})
