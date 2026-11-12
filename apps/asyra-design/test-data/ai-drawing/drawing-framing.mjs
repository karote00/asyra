/** Recording navigation only; document mutations remain owned by the App. */
export const createDrawingFraming = (source) => {
  let revision = 0
  let renderedRevision = -1
  let inspectedRevision = -1
  let paused = false
  let disposed = false
  let viewport = source.readViewport()

  const sameView = (a, b) => a.scale === b.scale && a.x === b.x && a.y === b.y

  const stops = [
    source.observeChanges(() => {
      revision++
    }),
    source.observeFrames(() => {
      renderedRevision = revision
    })
  ]

  return {
    tick() {
      if (disposed) {
        return { status: 'disposed' }
      }

      const current = source.readViewport()

      const navigated = !sameView(current, viewport)

      if (paused && !navigated) {
        return { status: 'paused' }
      }

      if (!navigated && revision === inspectedRevision) {
        return { status: 'idle' }
      }

      if (renderedRevision !== revision || !source.isSettled()) {
        return { status: 'pending' }
      }

      const area = source.readArea()

      if (!area || area.width <= 0 || area.height <= 0) {
        return { status: 'pending' }
      }

      const bounds = source.readBounds()

      inspectedRevision = revision
      viewport = current
      if (!bounds) {
        paused = false

        return { status: 'empty', revision }
      }

      const outside =
        bounds.minX * current.scale + current.x < area.x ||
        bounds.maxX * current.scale + current.x > area.x + area.width ||
        bounds.minY * current.scale + current.y < area.y ||
        bounds.maxY * current.scale + current.y > area.y + area.height

      if (navigated) {
        const wasPaused = paused

        paused = outside

        if (paused) {
          return { status: 'paused', revision }
        }

        return { status: wasPaused ? 'resumed' : 'visible', revision }
      }

      if (!outside) {
        return { status: 'visible', revision }
      }

      source.fit()
      viewport = source.readViewport()

      return { status: 'fitted', revision }
    },

    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      stops.forEach((stop) => stop())
    }
  }
}

export const installDrawingFraming = async () => {
  const [{ core }, { viewportApis }, { observeDesignChanges }] =
    await Promise.all([
      import('../../src/testing/runtime-access.ts'),
      import('../../src/common-apis/viewport.ts'),
      import('../../src/common-apis/design-review.ts')
    ])

  return createDrawingFraming({
    observeChanges: observeDesignChanges,

    observeFrames: (listener) => core.subscribeToFrameComplete(listener),

    isSettled: () => core.isTransactionBoundaryIdle(),

    readBounds: () => core.getAllElementsBounds(),

    readArea: () =>
      globalThis.document
        .getElementById('viewport-anchor')
        ?.getBoundingClientRect(),

    readViewport: () => ({
      ...viewportApis.getPosition(),
      scale: viewportApis.getScale()
    }),

    fit: () => viewportApis.zoomFit()
  })
}
