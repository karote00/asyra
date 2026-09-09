import type { AnalysisResult } from '../../analysis/result'
import type { ExperimentSnapshot } from '../../analysis/contracts'

/** A read-only index of accepted records, never another conclusion. */
export function projectResultPairs(
  result: AnalysisResult,
  snapshot: ExperimentSnapshot
) {
  const finding: AnalysisResult['pairEvidence'][number][] = []
  const unresolved: AnalysisResult['pairEvidence'][number][] = []
  const remaining: AnalysisResult['pairEvidence'][number][] = []
  const sources = new Map(snapshot.pairs.map((pair) => [pair.id, pair]))
  const recorded = new Set<string>()
  for (const pair of result.pairEvidence) {
    recorded.add(pair.pairId)
    if (pair.evidence.leaves.some((leaf) => leaf.state === 'finding'))
      finding.push(pair)
    else if (pair.evidence.coverage !== 'complete') unresolved.push(pair)
    else remaining.push(pair)
  }
  return {
    attention: [...finding, ...unresolved],
    all: [...finding, ...unresolved, ...remaining],
    missing: snapshot.pairs.filter((pair) => !recorded.has(pair.id)),
    sources
  }
}
