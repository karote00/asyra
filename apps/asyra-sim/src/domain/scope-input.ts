import type { ExcludedBodyPair } from '../analysis/contracts'
import { validIdentifier } from './workcell'

export function parseExclusions(text: string): ExcludedBodyPair[] {
  if (!text.trim()) return []

  return text.split(/\r?\n/).map((line, index) => {
    const [a, b, ...reasonParts] = line.split('\t')

    const reason = reasonParts.join(' ').trim()

    if (
      !validIdentifier(a) ||
      !validIdentifier(b) ||
      a === b ||
      !reason ||
      reason.length > 500
    )
      throw new Error(
        `Invalid exclusion on line ${index + 1}; use body-a<TAB>body-b<TAB>reason.`
      )

    return { version: 1, a, b, reason }
  })
}
