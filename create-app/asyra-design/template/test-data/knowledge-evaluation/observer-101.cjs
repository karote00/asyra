/* global window, module */
// Local recording only. No product auto-fit or mirrored scene geometry.
function installRecordingObserver(core, host = window) {
  let dirty = true,
    scheduled = null,
    disposed = false
  let value = {
    bounds: null,
    rootCount: 0,
    measurements: 0,
    measurementMs: 0,
    invalidations: 0,
    errors: []
  }
  const measure = () => {
    scheduled = null
    if (disposed || !dirty) return
    dirty = false
    const started = host.performance.now()
    try {
      const workspaceId = core.getCurrentWorkspaceId()
      const roots = core.getElementData(workspaceId)?.children ?? []
      let bounds = null
      for (let offset = 0; offset < roots.length; offset += 200) {
        for (const item of core.measureElementContentBounds(
          roots.slice(offset, offset + 200)
        )) {
          const b = item.bounds
          if (!b || (b.width === 0 && b.height === 0)) continue
          for (const point of [
            { x: b.x, y: b.y },
            { x: b.x + b.width, y: b.y },
            { x: b.x, y: b.y + b.height },
            { x: b.x + b.width, y: b.y + b.height }
          ]) {
            const p = core.elementLocalToWorkspace(item.elementId, point)
            if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y))
              throw new Error('Invalid canonical bounds')
            bounds ??= { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y }
            bounds.minX = Math.min(bounds.minX, p.x)
            bounds.minY = Math.min(bounds.minY, p.y)
            bounds.maxX = Math.max(bounds.maxX, p.x)
            bounds.maxY = Math.max(bounds.maxY, p.y)
          }
        }
      }
      value = { ...value, bounds, rootCount: roots.length }
    } catch (error) {
      value.errors.push({
        message: error.message,
        at: new Date().toISOString()
      })
    } finally {
      value.measurements++
      value.measurementMs += host.performance.now() - started
    }
  }
  const stopPublication = core.subscribeToSharedPublication(() => {
    dirty = true
    value.invalidations++
  })
  const stopFrame = core.subscribeToFrameComplete(() => {
    if (dirty && scheduled === null && !disposed)
      scheduled = host.requestAnimationFrame(measure)
  })
  measure()
  return {
    snapshot: () => ({
      ...value,
      bounds: value.bounds && { ...value.bounds },
      errors: [...value.errors]
    }),
    refresh: () => {
      dirty = true
      measure()
    },
    stop: () => {
      disposed = true
      stopPublication()
      stopFrame()
      if (scheduled !== null) host.cancelAnimationFrame(scheduled)
    }
  }
}
module.exports = { installRecordingObserver }
