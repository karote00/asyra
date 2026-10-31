function compactContext(context) {
  const {
    errors,
    warnings,
    notes,
    actions,
    criteria,
    specRefs,
    implementationRefs,
    manualCriteria,
    observations,
    blockers,
    ...identity
  } = context
  const truncatedFields = []
  const take = (name, values, limit) => {
    if (values.length > limit) {
      truncatedFields.push(name)
    }
    return values.slice(0, limit)
  }
  const text = (name, value) => {
    if (value.length > 1200) {
      truncatedFields.push(name)
    }
    return value.slice(0, 1200)
  }
  return {
    ...identity,
    errors: take('errors', errors, 12).map((error) => ({
      criterionId: error.criterionId,
      status: error.status,
      summary: text('error.summary', error.summary),
      detailsAvailable: Boolean(error.details?.length)
    })),
    warnings: take('warnings', warnings, 12).map((w) => ({
      id: w.id,
      kind: w.kind,
      summary: text('warning.summary', w.summary)
    })),
    actions: take('actions', actions, 20).map((action) => {
      const result = { ...action }
      delete result.inputs
      return result
    }),
    criteria: take('criteria', criteria, 24),
    specRefs: take('specRefs', specRefs, 16),
    implementationRefs: take('implementationRefs', implementationRefs, 16),
    manualCriteria: take('manualCriteria', manualCriteria, 24),
    blockers: take('blockers', blockers ?? [], 12).map((value) =>
      text('blocker', value)
    ),
    noteCount: notes.length,
    observationCount: observations?.length ?? 0,
    truncatedFields: [...new Set(truncatedFields)],
    evidenceUrl:
      '/api/evidence?flow=' +
      encodeURIComponent(context.flowId) +
      '&node=' +
      encodeURIComponent(context.nodeId)
  }
}
module.exports = { compactContext }
