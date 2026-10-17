/** Build deliberately whole-view test judgments with explicit image dependencies. */
export const wholeViewJudgments = <T>(
  inspectionIds: readonly unknown[],
  checks: readonly T[]
) => ({
  inspectionIds,
  checks: checks.map((check) => ({ ...check, inspectionIds }))
})

import type { LocalToolOwner } from '../../local-tool-invocation'
import { AiDesignToolIds } from '../../../src/constants/ai-design'

/** Primary-agent fixture: explicitly request a binding before submitting authored verdicts.
 * No capture intent or verdict is inferred. Invalid/unavailable binding results are
 * returned directly, preserving the owner's recovery path and original assertions.
 */
export const withReviewBindingActor = <T extends LocalToolOwner>(
  owner: T
): T => {
  const call = owner.call.bind(owner)
  owner.call = async (name, input, signal) => {
    if (
      name !== AiDesignToolIds.REVIEW_DRAWING ||
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input)
    )
      return call(name, input, signal)
    const value = input as Record<string, unknown>
    if (
      value.inspections ||
      !Array.isArray(value.checks) ||
      !value.checks.length ||
      value.checks.some(
        (check) => !check || typeof check !== 'object' || check.binding
      )
    )
      return call(name, input, signal)
    const bindingText = await call(
      name,
      {
        phase: value.phase,
        bindChecks: value.checks.map(
          ({ status: _status, evidence: _evidence, ...selection }) => selection
        )
      },
      signal
    )
    const binding = JSON.parse(bindingText)
    if (!binding.next?.arguments?.checks) return bindingText
    return call(
      name,
      {
        ...value,
        checks: value.checks.map((check, index) => ({
          ...check,
          binding: binding.next.arguments.checks[index].binding
        }))
      },
      signal
    )
  }
  return owner
}
