import { operationInputIssues } from '@asyra/ai-agent-runtime/schema'
import {
  DesignPreparationLimits,
  isDesignContainerType
} from '../src/ai/prepared-design'
import { isReservedDraftRepairKey } from './design-draft-repair'

export interface DraftRepairTarget {
  path: string
  message: string
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** Inspect independent authored nodes after bounded schema diagnostics overflow.
 * Validate container fields separately from their children. A rejected node is
 * one replacement target even if many of its fields have the same problem.
 */
export function locateDraftRepairTargets(
  draft: unknown,
  rootSchema: unknown,
  nodeSchema: unknown,
  referenceRoot: unknown
) {
  const targets: DraftRepairTarget[] = []

  const visit = (value: unknown, path: string, depth: number) => {
    const children =
      record(value) &&
      isDesignContainerType(value.type) &&
      Array.isArray(value.children) &&
      value.children.length < DesignPreparationLimits.expandedNodes &&
      depth < DesignPreparationLimits.depth
        ? value.children
        : undefined
    const fields =
      children && record(value) ? { ...value, children: [] } : value
    const issues = operationInputIssues(
      fields,
      path ? nodeSchema : rootSchema,
      referenceRoot
    )

    if (issues) {
      const fieldIssues = issues.filter(
        (i) =>
          !['oneOf', 'anyOf', 'allOf', 'diagnosticLimit'].includes(i.keyword)
      )

      if (path) {
        targets.push({ path, message: (fieldIssues[0] ?? issues[0]).message })

        return
      }

      for (const issue of fieldIssues) {
        const field = issue.instancePath.split('/')[1]

        // A forbidden root property cannot be deleted by replacing its value.
        if (
          field &&
          !isReservedDraftRepairKey(field) &&
          !(
            issue.instancePath === '/' + field &&
            ['additionalProperties', 'falseSchema'].includes(issue.keyword)
          ) &&
          !targets.some((t) => t.path === '/' + field)
        ) {
          targets.push({ path: '/' + field, message: issue.message })
        }
      }
    }

    children?.forEach((child, index) =>
      visit(child, path + '/children/' + index, depth + 1)
    )
  }

  visit(draft, '', 1)

  return targets
}
