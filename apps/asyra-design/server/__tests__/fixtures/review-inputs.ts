/** Build deliberately whole-view test judgments with explicit image dependencies. */
export const wholeViewJudgments = <T>(
  inspectionIds: readonly unknown[],
  checks: readonly T[]
) => ({
  inspectionIds,
  checks: checks.map((check) => ({ ...check, inspectionIds }))
})
