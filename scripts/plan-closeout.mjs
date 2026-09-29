import path from 'node:path'
import { assertPlanSection, validateContext } from './task-context.mjs'

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

export function closeoutPaths(planPath) {
  const boundary = planPath.indexOf('/plans/')
  const owner = planPath.slice(0, boundary)
  const relative = planPath.slice(boundary + '/plans/'.length)
  requireValue(owner && relative, 'Plan path must have a plans owner')
  return {
    active: planPath,
    completed: `${owner}/plans/completed/${relative}`,
    index: `${owner}/PLANS.md`,
    decisions: `${owner}/decisions/releases/unreleased.md`
  }
}

// snapshot methods read immutable Git objects, never execute candidate code.
// reviewedSha is supplied by the trusted review adapter, not by the PR body.
export async function evaluateCloseout({
  context: input,
  baseSha,
  headSha,
  reviewedSha,
  snapshot
}) {
  const context = validateContext(input)
  // Immutable file reads are shared within one evaluation only. A later head
  // or evaluation gets its own cache, including missing-file results.
  const files = new Map()
  const read = (sha, file) => {
    const key = JSON.stringify([sha, file])
    if (!files.has(key))
      files.set(key, Promise.resolve(snapshot.read(sha, file)))
    return files.get(key)
  }
  requireValue(
    await snapshot.isAncestor(context.base.sha, baseSha),
    'Task base must be integrated in the PR base'
  )
  requireValue(
    await snapshot.isAncestor(context.base.sha, headSha),
    'Task base must be integrated in the PR head'
  )
  for (const prerequisite of context.prerequisites) {
    requireValue(
      await snapshot.isAncestor(prerequisite, context.base.sha),
      'Task prerequisite is missing from the selected base'
    )
  }
  const changed = await snapshot.changedPaths(baseSha, headSha)
  const completedAdditions = []
  const removedPlans = []
  for (const file of changed.filter((file) => /\/plans\/.*\.md$/.test(file))) {
    const before = await read(baseSha, file)
    const after = await read(headSha, file)
    if (file.includes('/plans/completed/')) {
      if (before === null && after !== null) completedAdditions.push(file)
    } else if (before !== null && after === null) removedPlans.push(file)
  }
  if (context.mode === 'standalone') {
    requireValue(
      completedAdditions.length === 0,
      'Changes to completed plan records require a plan association'
    )
    requireValue(
      removedPlans.length === 0,
      'Removing an active plan requires a plan association'
    )
    return {
      applicable: false,
      summary: 'Explicit standalone task; no plan closeout required.'
    }
  }
  const paths = closeoutPaths(context.plan.path)
  const basePlan = await read(context.base.sha, paths.active)
  requireValue(
    basePlan !== null,
    'Referenced plan is missing from the task base'
  )
  assertPlanSection(basePlan, context)
  if (context.mode === 'plan-task') {
    requireValue(
      removedPlans.length === 0,
      'Partial task cannot remove active plans'
    )
    const active = await read(headSha, paths.active)
    requireValue(
      active !== null,
      'Partial task removed its plan; use plan-closeout for final completion'
    )
    assertPlanSection(active, context)
    requireValue(
      completedAdditions.length === 0,
      'Partial task cannot update completed plan records'
    )
    return {
      applicable: false,
      summary:
        'Plan task retains its active plan; whole-plan closeout remains with the named owner.'
    }
  }
  requireValue(
    /^[a-f0-9]{40}$/.test(reviewedSha ?? ''),
    'A trusted review of an exact source commit is required before closeout'
  )
  requireValue(
    await snapshot.isAncestor(reviewedSha, headSha),
    'Reviewed source must be an ancestor of the current head'
  )
  requireValue(
    await snapshot.isAncestor(context.base.sha, reviewedSha),
    'Reviewed source must include the selected task base'
  )
  const sourcePlan = await read(reviewedSha, paths.active)
  requireValue(sourcePlan !== null, 'Review must precede plan closeout')
  assertPlanSection(sourcePlan, context)
  const afterReview = await snapshot.changedPaths(reviewedSha, headSha)
  const allowed = new Set(Object.values(paths))
  requireValue(
    afterReview.length > 0 && afterReview.every((file) => allowed.has(file)),
    'Changes after review must be limited to this plan, completed record, index and decision history; review changed implementation again'
  )
  requireValue(
    completedAdditions.every((file) => file === paths.completed),
    'Closeout cannot modify another completed plan'
  )
  requireValue(
    removedPlans.every((file) => file === paths.active),
    'Closeout cannot remove another active plan'
  )
  requireValue(
    (await read(headSha, paths.active)) === null,
    'Active plan must move to completed'
  )
  requireValue(
    (await read(reviewedSha, paths.completed)) === null,
    'Completed target already exists; resolve ownership before closeout'
  )
  const completed = await read(headSha, paths.completed)
  requireValue(
    completed?.startsWith(sourcePlan.trimEnd()),
    'Completed record must preserve the reviewed plan and append its outcome'
  )
  const outcome = completed.slice(sourcePlan.trimEnd().length)
  requireValue(
    outcome.includes(`Reviewed source: ${reviewedSha}`),
    'Completed record must identify the reviewed source'
  )
  requireValue(
    /Completed: \d{4}-\d{2}-\d{2}/.test(outcome),
    'Completed record requires a completion date'
  )
  for (const label of ['Outcome', 'Decision', 'Exit criteria']) {
    requireValue(
      new RegExp(`${label}: [^\\s][^\\n]*`).test(outcome),
      `Completed record requires ${label}`
    )
  }
  const index = await read(headSha, paths.index)
  requireValue(index !== null, 'Owner plan index is missing')
  const relative = paths.active.slice(paths.active.indexOf('/plans/') + 1)
  requireValue(
    !index.includes(paths.active) && !index.includes(relative),
    'Plan index retains a stale active plan reference'
  )
  for (const match of index.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)/g)) {
    const target = decodeURIComponent(match[1].split('#')[0])
    const resolved = target.startsWith('/')
      ? target.slice(1)
      : path.posix.normalize(
          path.posix.join(path.posix.dirname(paths.index), target)
        )
    requireValue(
      resolved !== paths.active,
      'Plan index retains a stale active plan link'
    )
  }
  const oldDecisions = await read(reviewedSha, paths.decisions)
  const decisions = await read(headSha, paths.decisions)
  requireValue(
    oldDecisions !== null && decisions?.startsWith(oldDecisions),
    'Decision history must preserve existing text and append the closeout entry'
  )
  const addition = decisions.slice(oldDecisions.length)
  requireValue(
    addition.includes(paths.completed) && /\d{4}-\d{2}-\d{2}/.test(addition),
    'Decision history must append a dated entry linking the completed plan'
  )
  return {
    applicable: true,
    summary: `Plan closeout verified against reviewed source ${reviewedSha}.`
  }
}
