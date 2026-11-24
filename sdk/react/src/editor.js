import core, {
  defineFeature,
  runTransaction,
  undoWithRenderPolicy,
  redoWithRenderPolicy
} from '@asyra/core'
import { applyPreset, PresetDefaults } from '@asyra/preset'

const { document, window, ResizeObserver } = globalThis
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

export async function start(documentId, actions) {
  const surface = document.querySelector('main')
  const toolbar = document.querySelector('nav')

  if (!toolbar.inert || toolbar.dataset.starting) {
    return
  }

  toolbar.dataset.starting = 'true'
  const [draw, select, undo, redo] = toolbar.querySelectorAll('button')
  const output = toolbar.querySelector('output')
  const preview = document.querySelector('#preview')
  const key = documentId == null ? null : '@asyra/react:document:' + documentId

  const report = (error) => {
    output.textContent = error.message ?? String(error)
  }

  let active = true
  let tool = draw
  let gesture
  let resizing
  let startup
  let replaying = false

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      return
    }

    active = false
    resizing?.disconnect()
    void Promise.resolve(startup)
      .catch(report)
      .then(() => core.destroy())
      .catch(report)
  })

  function drawRectangle({ x, y, width, height }) {
    if (!active || replaying) {
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

  const updateStatus = () => {
    const selected = core
      .getSelectedElementIds()
      .filter((id) => core.getElementMetadata(id))

    output.textContent = selected.length
      ? 'Selected: ' + core.getElementData(selected[0]).name
      : 'Ready'
  }

  const cancel = () => {
    gesture = undefined
    preview.hidden = true
  }

  const changeTool = (button) => {
    cancel()
    tool = button
    for (const item of [select, draw]) {
      item.setAttribute('aria-pressed', String(item === tool))
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

      load() {
        const saved = key === null ? null : window.localStorage.getItem(key)

        if (saved === null) {
          return emptyDocument()
        }

        const snapshot = JSON.parse(saved)

        if (
          snapshot?.sceneTree?.workspace !== workspace ||
          core.preflightLoad(snapshot).length
        ) {
          throw new Error('The saved canvas document is invalid')
        }

        return snapshot
      }
    })
    const feature = defineFeature('canvas.edit', undefined, {
      api: {
        drawRectangle,

        selectAt(point) {
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

    startup = core.start(surface, {
      width: Math.max(1, surface.clientWidth),
      height: Math.max(1, surface.clientHeight),
      backgroundColor: 0xffffff
    })
    await startup
    if (!active) {
      return
    }

    resizing = new ResizeObserver(() => {
      if (surface.clientWidth && surface.clientHeight) {
        core.resizeRenderer(surface.clientWidth, surface.clientHeight)
      }
    })
    resizing.observe(surface)
    draw.onclick = () => changeTool(draw)
    select.onclick = () => changeTool(select)

    const replay = async (command) => {
      if (replaying) {
        return
      }

      replaying = true
      cancel()
      try {
        await command()
        updateStatus()
      } catch (error) {
        report(error)
      } finally {
        replaying = false
      }
    }

    undo.onclick = () => replay(feature.api.undo)
    redo.onclick = () => replay(feature.api.redo)
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        cancel()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        void replay(event.shiftKey ? feature.api.redo : feature.api.undo)
      }
    })

    const point = (event) => {
      const bounds = surface.getBoundingClientRect()

      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }

    const toWorkspace = (p) =>
      core.getMousePosInWorkspace({ clientX: p.x, clientY: p.y })

    const rect = (a, b) => ({
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(a.x - b.x),
      height: Math.abs(a.y - b.y)
    })

    surface.onpointerdown = (event) => {
      if (!event.isPrimary || event.button !== 0 || gesture || replaying) {
        return
      }

      const at = point(event)

      if (tool === select) {
        feature.api.selectAt(at)
        updateStatus()

        return
      }

      gesture = { id: event.pointerId, at }
      surface.setPointerCapture(event.pointerId)
    }

    surface.onpointermove = (event) => {
      if (gesture?.id !== event.pointerId) {
        return
      }

      const box = rect(gesture.at, point(event))

      Object.assign(preview.style, {
        left: box.x + 'px',
        top: box.y + 'px',
        width: box.width + 'px',
        height: box.height + 'px'
      })
      preview.hidden = false
    }

    surface.onpointerup = (event) => {
      if (gesture?.id !== event.pointerId) {
        return
      }

      const box = rect(toWorkspace(gesture.at), toWorkspace(point(event)))

      cancel()
      if (box.width && box.height) {
        try {
          feature.api.drawRectangle(box)
          updateStatus()
        } catch (error) {
          report(error)
        }
      }
    }

    surface.onpointercancel = surface.onlostpointercapture = (event) => {
      if (gesture?.id === event.pointerId) {
        cancel()
      }
    }

    const addButton = (label, execute) => {
      const button = document.createElement('button')

      button.textContent = label
      button.onclick = async () => {
        try {
          await execute()
        } catch (error) {
          report(error)
        }
      }

      toolbar.insertBefore(button, output)
    }

    for (const action of actions) {
      addButton(action.label, () =>
        action.execute({ drawRectangle: feature.api.drawRectangle })
      )
    }

    if (key) {
      addButton('Save', async () => {
        const snapshot = await core.save()

        if (!active) {
          return
        }

        window.localStorage.setItem(key, JSON.stringify(snapshot))
        output.textContent = 'Saved'
      })
    }

    toolbar.inert = false
    updateStatus()
  } catch (error) {
    report(error)
  }
}
