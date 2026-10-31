/* global module */
const fields = ['minX', 'minY', 'maxX', 'maxY']

function createRecordingBoundsFit(fit) {
  let previous = null
  return async (bounds) => {
    if (!bounds || fields.some((field) => !Number.isFinite(bounds[field]))) {
      return
    }
    if (bounds.maxX < bounds.minX || bounds.maxY < bounds.minY) {
      return
    }
    if (bounds.maxX === bounds.minX && bounds.maxY === bounds.minY) {
      return
    }
    const scale = Math.max(
      1,
      ...fields.map((field) => Math.abs(bounds[field])),
      ...fields.map((field) => Math.abs(previous?.[field] ?? 0))
    )
    const tolerance = Number.EPSILON * 64 * scale
    if (
      previous &&
      fields.every(
        (field) => Math.abs(previous[field] - bounds[field]) <= tolerance
      )
    ) {
      return
    }
    const snapshot = Object.fromEntries(
      fields.map((field) => [field, bounds[field]])
    )
    await fit({
      reason: previous ? 'bounds-changed' : 'first',
      bounds: snapshot
    })
    previous = snapshot
  }
}

module.exports = { createRecordingBoundsFit }
