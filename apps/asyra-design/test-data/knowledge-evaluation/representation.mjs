import { Buffer } from 'node:buffer'

const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const list = (value) => (Array.isArray(value) ? value : [])
const stable = (value) => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']'
  if (!object(value)) return JSON.stringify(value)
  return (
    '{' +
    Object.keys(value)
      .sort()
      .map((key) => JSON.stringify(key) + ':' + stable(value[key]))
      .join(',') +
    '}'
  )
}

/** Offline observations only: authored input is not proof of rendering or intent. */
export function observeRepresentation(call) {
  const input = call?.inputValue
  const unavailable = {
    callId: call?.callId ?? null,
    inputAvailable: false,
    visualQuality: 'unverified'
  }
  if (!object(input) || !object(input.draft)) return unavailable
  const counts = {
    surfaceGrids: 0,
    projectedFaces: 0,
    patterns: 0,
    materialOccurrences: 0,
    inlineMaterials: 0,
    templateUses: 0,
    sharedUses: 0,
    cellMaterialEntries: 0,
    cellMaterialBytes: 0,
    distinctCellMaterials: 0
  }
  const unique = new Set()
  const fill = (value, cell = false) => {
    if (value === undefined) return
    counts.materialOccurrences++
    if (object(value) && typeof value.template === 'string')
      counts.templateUses++
    else if (object(value) && typeof value.shared === 'string')
      counts.sharedUses++
    else counts.inlineMaterials++
    if (cell) {
      counts.cellMaterialEntries++
      counts.cellMaterialBytes += Buffer.byteLength(JSON.stringify(value))
      unique.add(stable(value))
    }
  }
  const visit = (node) => {
    if (!object(node)) return
    if (node.type === 'surface-grid') {
      counts.surfaceGrids++
      for (const motif of list(node.motifs)) {
        if (!object(motif)) continue
        if (Array.isArray(motif.fills))
          motif.fills.forEach((value) => fill(value, true))
        else fill(motif.fill)
      }
    } else {
      if (node.type === 'projected-face') counts.projectedFaces++
      if (node.type === 'pattern' || node.type === 'vector-pattern')
        counts.patterns++
      fill(node.fill)
      for (const face of list(node.faces)) visit(face)
      if (object(node.template)) visit(node.template)
    }
    for (const child of list(node.children)) visit(child)
  }
  visit(input.draft)
  counts.distinctCellMaterials = unique.size
  return {
    callId: call.callId,
    inputAvailable: true,
    executionStatus: call.status ?? 'unknown',
    inputBytes: Buffer.byteLength(JSON.stringify(input)),
    ...counts,
    declaredAssumptions: input.draft.brief?.assumptions ?? [],
    visualQuality: 'unverified'
  }
}

export function observeKnowledgeUse(calls) {
  const delivered = calls
    .filter(
      (call) =>
        call.tool === 'read_knowledge' &&
        call.status === 'usable' &&
        Array.isArray(call.outputValue?.documents)
    )
    .flatMap((call) =>
      call.outputValue.documents
        .filter(
          (doc) =>
            object(doc) && typeof doc.text === 'string' && doc.text.length > 0
        )
        .map((doc) => ({
          callId: call.callId,
          target: doc.target,
          source: doc.source
        }))
    )
  return {
    delivered,
    representations: calls
      .filter((call) =>
        ['prepare_design', 'prepare_and_apply_design'].includes(call.tool)
      )
      .map(observeRepresentation),
    adoption: 'not-inferred-from-delivery',
    efficacy: 'unverified'
  }
}
