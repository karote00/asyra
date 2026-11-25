import { AiDesignToolIds } from '../src/constants/ai-design'

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const inlineFindingLimit = 8

export function findingTargetMatches(finding: unknown, target: string) {
  return (
    record(finding) && (finding.key === target || finding.elementId === target)
  )
}

/** All findings remain with the check owner. Keep small sets actionable in one exchange. */
export function describeDesignFindings(
  findings: readonly unknown[],
  checkId: string,
  unchanged = false
) {
  if (unchanged) {
    return {
      findings: [],
      findingSummary: { checkId, total: findings.length, unchanged: true }
    }
  }

  const groups = new Map<
    string,
    { count: number; examples: unknown[]; shared: Map<string, unknown> }
  >()

  for (const finding of findings) {
    const kind =
      record(finding) && typeof finding.kind === 'string'
        ? finding.kind
        : 'other'
    const group = groups.get(kind)

    if (group) {
      group.count++
      if (group.examples.length < inlineFindingLimit) {
        group.examples.push(finding)
      }

      for (const field of group.shared.keys()) {
        if (!record(finding) || group.shared.get(field) !== finding[field]) {
          group.shared.delete(field)
        }
      }
    } else {
      const shared = record(finding)
        ? new Map(
            Object.entries(finding).filter(
              ([field, value]) =>
                [
                  'left',
                  'right',
                  'top',
                  'bottom',
                  'parentId',
                  'property',
                  'expected',
                  'actual',
                  'tolerance'
                ].includes(field) &&
                (typeof value === 'number' || typeof value === 'string')
            )
          )
        : new Map<string, unknown>()

      groups.set(kind, { count: 1, examples: [finding], shared })
    }
  }

  const grouped = findings.length > inlineFindingLimit

  return {
    findings: grouped
      ? Array.from(groups.values()).flatMap((g) =>
          g.count <= inlineFindingLimit ? g.examples : g.examples.slice(0, 1)
        )
      : findings,
    findingSummary: {
      checkId,
      total: findings.length,
      ...(grouped
        ? {
            sharedByKind: Object.fromEntries(
              Array.from(groups)
                .filter(([, group]) => group.count > inlineFindingLimit)
                .map(([kind, group]) => [
                  kind,
                  Object.fromEntries(group.shared)
                ])
            )
          }
        : {}),
      counts: Object.fromEntries(
        Array.from(groups, ([kind, group]) => [kind, group.count])
      )
    }
  }
}

export function defaultFindingProjection(
  name: string,
  value: unknown,
  finalStep: () => string
): ((receipt: Record<string, unknown>) => Record<string, unknown>) | undefined {
  const workflow = 'design_workflow.' + AiDesignToolIds.PREPARE_AND_APPLY_DESIGN
  const prepare = 'design_preparation.' + AiDesignToolIds.PREPARE_DESIGN
  const measure = 'design_operations.review_design'

  const projectOperation = (operation: unknown, result: unknown): unknown => {
    if (!record(result)) {
      return result
    }

    if (operation === workflow && Array.isArray(result.parts)) {
      return {
        ...result,
        parts: result.parts.map((part) => projectOperation(prepare, part))
      }
    }

    if (
      (operation === prepare || operation === workflow) &&
      typeof result.artifactId === 'string' &&
      Array.isArray(result.findings)
    ) {
      const { review: _brief, ...receipt } = result

      return {
        ...receipt,
        ...describeDesignFindings(
          result.findings,
          `prepared:${result.artifactId}:data`
        )
      }
    }

    if (
      operation === measure &&
      Array.isArray(result.actionResults) &&
      record(result.mechanicalSelection) &&
      Array.isArray(result.mechanicalSelection.checks)
    ) {
      const checkId = result.mechanicalSelection.checks[0]?.checkId

      if (typeof checkId === 'string') {
        return {
          ...result,
          actionResults: result.actionResults.map((entry) => {
            if (
              entry.actionName !== 'review_design' ||
              !record(entry.result) ||
              !Array.isArray(entry.result.findings) ||
              entry.result.findings.length <= inlineFindingLimit
            ) {
              return entry
            }

            return {
              ...entry,
              result: {
                ...entry.result,
                ...describeDesignFindings(entry.result.findings, checkId)
              }
            }
          })
        }
      }
    }

    return result
  }

  const eligible = (operation: unknown) =>
    operation === workflow || operation === prepare || operation === measure

  if (eligible(name)) {
    return (receipt) => {
      const result = projectOperation(name, receipt)

      return record(result) ? result : receipt
    }
  }

  if (
    name !== 'design_operations.' + AiDesignToolIds.EXECUTE_DESIGN ||
    !record(value) ||
    !record(value.execution)
  ) {
    return
  }

  const execution = value.execution
  const step = finalStep()
  const operation = Array.isArray(execution.calls)
    ? execution.calls.findLast((call) => call.stepId === step)?.name
    : undefined

  if (
    !eligible(operation) &&
    !(
      Array.isArray(execution.recovery) &&
      execution.recovery.some((entry) => eligible(entry.name))
    )
  ) {
    return
  }

  return (receipt) => {
    const body = receipt.execution

    if (!record(body)) {
      return receipt
    }

    return {
      ...receipt,
      execution: {
        ...body,
        ...(Object.hasOwn(body, 'value')
          ? { value: projectOperation(operation, body.value) }
          : {}),
        ...(Array.isArray(body.recovery)
          ? {
              recovery: body.recovery.map((entry) =>
                eligible(entry.name) && Object.hasOwn(entry, 'value')
                  ? {
                      ...entry,
                      value: projectOperation(entry.name, entry.value)
                    }
                  : entry
              )
            }
          : {})
      }
    }
  }
}
