import type { DesignTools, Rectangle, Point } from './index.js'
import core, {
  defineFeature,
  runTransaction,
  undoWithRenderPolicy,
  redoWithRenderPolicy
} from '@asyra/core'
import { applyPreset, PresetDefaults } from '@asyra/preset'

const workspace = 'workspace'

const emptyDocument = () => ({
  version: '1.0.0',
  props: {},
  sceneTree: {
    workspace,
    workspaceList: [workspace],
    elements: {
      [workspace]: {
        id: workspace,
        name: 'Workspace',
        type: 'workspace',
        parentId: '',
        visible: true,
        lock: false,
        children: []
      }
    }
  }
})

// Pixi releases GPU resources by losing the WebGL context. A borrowed
// element needs a restored context before its owner can mount another editor.
async function releaseRuntime(target: HTMLCanvasElement) {
  const gl =
    core.getCanvas() === target &&
    (target.getContext('webgl2') ?? target.getContext('webgl'))
  const extension = gl && gl.getExtension('WEBGL_lose_context')

  if (!extension) {
    await core.resetRuntime()

    return
  }

  const listeners = new globalThis.AbortController()
  const { signal } = listeners
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined
  const restored = new Promise<void>((resolve, reject) => {
    target.addEventListener('webglcontextrestored', () => resolve(), {
      once: true,
      signal
    })
    target.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault()
        globalThis.setTimeout(() => extension.restoreContext(), 0)
        timer = globalThis.setTimeout(
          () => reject(new Error('Canvas context restoration timed out')),
          5000
        )
      },
      { once: true, signal }
    )
  })

  try {
    await core.resetRuntime()
    if (gl.isContextLost()) {
      await restored
    }
  } finally {
    globalThis.clearTimeout(timer)
    listeners.abort()
  }
}

export async function start(
  target: HTMLCanvasElement,
  options: { document?: unknown; disabledFeatures: Set<string> }
): Promise<
  DesignTools & {
    destroy(): Promise<void>
    updateAvailability(next: Set<string>): void
  }
> {
  const listeners = new globalThis.AbortController()
  const { signal } = listeners
  let active = true
  const disabled = options.disabledFeatures

  const requireFeature = (id: string) => {
    if (disabled.has(id)) {
      throw new Error('Disabled Design feature: ' + id)
    }
  }

  let tool =
    (['rectangle', 'select'] as const).find((id) => !disabled.has(id)) ?? null
  let gesture: { id: number; at: Point } | undefined
  let pending: Promise<unknown> | undefined
  let observer: ResizeObserver | undefined

  const assertActive = () => {
    if (!active) {
      throw new Error('Canvas is disposed')
    }
  }

  function drawRectangle({ x, y, width, height }: Rectangle) {
    requireFeature('rectangle')
    if (!active || pending) {
      throw new Error('Canvas is unavailable')
    }

    if (
      ![x, y, width, height].every(Number.isFinite) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(
        'A rectangle requires finite coordinates and positive dimensions'
      )
    }

    return runTransaction(() => {
      const id = core.createElementInParent(
        { type: 'rect', x, y, width, height },
        workspace
      )

      if (!id) {
        throw new Error('Rectangle creation failed')
      }

      return id
    })
  }

  const cancel = () => {
    const id = gesture?.id

    gesture = undefined
    if (id !== undefined && target.hasPointerCapture(id)) {
      target.releasePointerCapture(id)
    }
  }

  const destroy = async () => {
    active = false
    cancel()
    listeners.abort()
    observer?.disconnect()
    try {
      await pending
    } finally {
      await releaseRuntime(target)
    }
  }

  try {
    applyPreset(core, {
      defaults: [
        PresetDefaults.BASIC_SHAPES,
        PresetDefaults.CONTAINERS,
        PresetDefaults.SELECTION
      ]
    })
    core.setLoadSource({
      name: 'canvas-document',

      async load() {
        if (options.document === undefined) {
          return emptyDocument()
        }

        if (
          (options.document as { sceneTree?: { workspace?: unknown } } | null)
            ?.sceneTree?.workspace !== workspace ||
          core.preflightLoad(options.document).length
        ) {
          throw new Error('Invalid canvas document')
        }

        return options.document
      }
    })
    const { api } = defineFeature('canvas.edit', undefined, {
      api: {
        drawRectangle,

        selectAt(point: Point) {
          const id = core.getElementIdAtClientPos(point)

          runTransaction(() =>
            core.selectElements(id && id !== workspace ? [id] : [], {
              undoable: false
            })
          )
          core.getPresetDependencies().render.requestRender()
        },

        undo: () => undoWithRenderPolicy({ mode: 'atomic' }),

        redo: () => redoWithRenderPolicy({ mode: 'atomic' })
      }
    })

    await core.start(target, {
      width: Math.max(1, target.clientWidth),
      height: Math.max(1, target.clientHeight),
      backgroundColor: 0xffffff
    })
    if (core.getCanvas() !== target) {
      throw new Error('Renderer did not bind the requested canvas')
    }

    observer = new globalThis.ResizeObserver(() => {
      if (
        active &&
        target.clientWidth &&
        target.clientHeight &&
        (target.width !== target.clientWidth ||
          target.height !== target.clientHeight)
      ) {
        core.resizeRenderer(target.clientWidth, target.clientHeight)
      }
    })
    observer.observe(target)

    const point = (event: PointerEvent) => {
      const bounds = target.getBoundingClientRect()

      return {
        x: ((event.clientX - bounds.left) * target.width) / bounds.width,
        y: ((event.clientY - bounds.top) * target.height) / bounds.height
      }
    }

    const project = (p: Point) =>
      core.getMousePosInWorkspace({ clientX: p.x, clientY: p.y })

    target.addEventListener(
      'pointerdown',
      (event) => {
        if (
          !tool ||
          !event.isPrimary ||
          event.button !== 0 ||
          gesture ||
          pending
        ) {
          return
        }

        const p = point(event)

        if (tool === 'select') {
          api.selectAt(p)

          return
        }

        gesture = { id: event.pointerId, at: project(p) }
        target.setPointerCapture(event.pointerId)
      },
      { signal }
    )
    target.addEventListener(
      'pointerup',
      (event) => {
        if (gesture?.id !== event.pointerId) {
          return
        }

        const a = gesture.at
        const b = project(point(event))

        cancel()
        if (a.x !== b.x && a.y !== b.y) {
          api.drawRectangle({
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            width: Math.abs(a.x - b.x),
            height: Math.abs(a.y - b.y)
          })
        }
      },
      { signal }
    )
    for (const type of ['pointercancel', 'lostpointercapture'] as const) {
      target.addEventListener(
        type,
        (event) => {
          if (gesture?.id === event.pointerId) {
            cancel()
          }
        },
        { signal }
      )
    }

    const replay = async (
      direction: 'undo' | 'redo',
      event?: KeyboardEvent
    ) => {
      if (disabled.has(direction)) {
        if (event) {
          return
        }

        throw new Error('Disabled Design feature: ' + direction)
      }

      event?.preventDefault()
      assertActive()
      if (pending) {
        throw new Error('History operation in progress')
      }

      cancel()
      pending = api[direction]()
      try {
        await pending
      } finally {
        pending = undefined
      }
    }

    target.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          cancel()
        }

        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 'z' &&
          !event.repeat &&
          !pending
        ) {
          void replay(event.shiftKey ? 'redo' : 'undo', event)
        }
      },
      { signal }
    )

    return {
      updateAvailability(next) {
        assertActive()
        disabled.clear()
        for (const id of next) {
          disabled.add(id)
        }

        if (!tool || disabled.has(tool)) {
          cancel()
          tool =
            (['rectangle', 'select'] as const).find(
              (id) => !disabled.has(id)
            ) ?? null
        }
      },

      getTool() {
        assertActive()

        return tool
      },

      setTool(value) {
        assertActive()
        if (value !== 'rectangle' && value !== 'select') {
          throw new TypeError('Expected rectangle or select')
        }

        requireFeature(value)
        cancel()
        tool = value
      },

      drawRectangle: api.drawRectangle,

      getSelection() {
        assertActive()

        return core
          .getSelectedElementIds()
          .filter((id) => core.getElementMetadata(id))
      },

      undo: () => replay('undo'),

      redo: () => replay('redo'),

      save() {
        assertActive()

        return core.save()
      },

      destroy
    }
  } catch (error) {
    await destroy()
    throw error
  }
}
