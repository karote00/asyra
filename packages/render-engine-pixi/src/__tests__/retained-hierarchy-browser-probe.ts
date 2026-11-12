export { VERSION as pixiVersion } from 'pixi.js'
import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Matrix,
  RenderTexture,
  type WebGLRenderer
} from 'pixi.js'
import {
  RetainedHierarchyProbe,
  type ProjectionMode
} from './retained-hierarchy-probe.js'

type Phase =
  | 'redraw'
  | 'translate'
  | 'reparent'
  | 'reparent-query'
  | 'reparent-capture'
  | 'reparent-direct-capture'

export async function measureRetainedProjection(
  mode: ProjectionMode,
  roots: number,
  perRoot: number
) {
  const app = new Application()

  await app.init({
    width: 640,
    height: 400,
    preference: 'webgl',
    antialias: true,
    autoStart: false,
    backgroundColor: 0xffffff,
    preserveDrawingBuffer: true
  })
  const probe = new RetainedHierarchyProbe(mode, roots, perRoot)

  app.stage.addChild(probe.scene)
  const gl = (app.renderer as WebGLRenderer).gl
  const outside = new Graphics().rect(0, 0, 10, 10).fill(0xff00ff)

  probe.scene.addChild(outside)

  const paint = () => {
    probe.flush()
    app.render()
    gl.finish()
  }

  const move = (target: boolean) =>
    probe.accept(
      [0, 1, 2, 3].map((id) => ({
        id,
        parent: target ? ('target' as const) : ('source' as const),
        x: target ? -40 : 0,
        y: target ? -60 : 0
      }))
    )

  const reset = () => {
    move(false)
    probe.moveGroup('source', 0, 0)
    paint()
  }

  const capture = (png = false) => {
    const prepared = probe.captureTarget('target')
    const wasRenderGroup = prepared.target.isRenderGroup

    try {
      const canvas = app.renderer.extract.canvas({
        target: prepared.target,
        resolution: 1,
        clearColor: 0xffffff,
        antialias: true
      }) as HTMLCanvasElement

      gl.finish()

      return {
        clones: prepared.clones,
        width: canvas.width,
        height: canvas.height,
        png: png ? canvas.toDataURL('image/png') : ''
      }
    } finally {
      if (!wasRenderGroup) {
        prepared.target.disableRenderGroup()
      }

      prepared.release()
    }
  }

  const captureDirect = (png = false) => {
    if (mode !== 'retained') {
      return capture(png)
    }

    const bounds = probe.bounds('target')
    const texture = RenderTexture.create({
      width: Math.ceil(bounds.width),
      height: Math.ceil(bounds.height),
      resolution: 1,
      antialias: true
    })
    const group = probe.groups.target

    group.updateLocalTransform()
    const inverse = group.localTransform.clone().invert()
    let first = true

    try {
      for (const id of probe.members.target) {
        const root = probe.roots[id]
        const wasRenderGroup = root.isRenderGroup

        root.updateLocalTransform()
        const transform = new Matrix(1, 0, 0, 1, -bounds.x, -bounds.y)
          .append(inverse)
          .append(root.localTransform)

        try {
          app.renderer.render({
            container: root,
            target: texture,
            transform,
            clear: first,
            clearColor: 0xffffff
          })
          first = false
        } finally {
          if (!wasRenderGroup) {
            root.disableRenderGroup()
          }
        }
      }

      const canvas = app.renderer.extract.canvas({
        target: texture
      }) as HTMLCanvasElement

      gl.finish()

      return {
        clones: 0,
        width: canvas.width,
        height: canvas.height,
        png: png ? canvas.toDataURL('image/png') : ''
      }
    } finally {
      texture.destroy(true)
    }
  }

  const samples: Record<string, number[]> = {}
  const clones: Record<string, number[]> = {}
  const phases: Phase[] = [
    'redraw',
    'translate',
    'reparent',
    'reparent-query',
    'reparent-capture',
    'reparent-direct-capture'
  ]

  try {
    paint()

    const canvas = () =>
      (
        app.renderer.extract.canvas({
          target: probe.scene,
          frame: new Rectangle(0, 0, 640, 400),
          resolution: 1,
          clearColor: 0xffffff,
          antialias: true
        }) as HTMLCanvasElement
      ).toDataURL('image/png')

    const initial = canvas()

    move(true)
    paint()
    const beforeCapture = canvas()
    const coldStart = performance.now()

    const coldCapture = capture(true)
    const coldMs = performance.now() - coldStart

    paint()
    const afterCapture = canvas()
    const groupBounds = probe.bounds('target')
    const directCapture = captureDirect(true)

    paint()
    const afterDirectCapture = canvas()

    // Complete correctness evidence includes the changed content and live scene
    // after capture, not only an isolated target image.
    probe.leaves[0].clear().rect(0, 0, 6, 6).fill(0xff0000)
    paint()
    const editedCapture = capture(true)

    probe.leaves[0].clear().rect(0, 0, 6, 6).fill(0x66bb99)
    reset()
    for (const phase of phases) {
      samples[phase] = []
      clones[phase] = []
      for (let i = -6; i < 24; i++) {
        reset()
        const start = performance.now()
        let copied = 0

        if (phase === 'translate') {
          probe.moveGroup('source', 7, 0)
        }

        if (phase.startsWith('reparent')) {
          move(true)
        }

        if (phase === 'reparent-query') {
          probe.bounds('target')
        }

        if (phase === 'reparent-capture') {
          copied = capture().clones
        }

        if (phase === 'reparent-direct-capture') {
          copied = captureDirect().clones
        }

        paint()
        if (i >= 0) {
          samples[phase].push(performance.now() - start)
          clones[phase].push(copied)
        }
      }
    }

    reset()
    move(true)
    paint()
    const domain = probe.scene.renderGroup

    if (!domain) {
      throw new Error('Missing measurement domain')
    }

    const prototype = Object.getPrototypeOf(domain) as {
      addChild: (child: Container) => void
    }
    const originalMembership = prototype.addChild
    const leafSet = new Set<Container>(probe.leaves)
    let membershipLeaves = 0

    prototype.addChild = function (child: Container) {
      if (leafSet.has(child)) {
        membershipLeaves++
      }

      originalMembership.call(this, child)
    }

    try {
      captureDirect()
      paint()
    } finally {
      prototype.addChild = originalMembership
    }

    const directWork = { membershipLeaves }

    reset()
    const restored = canvas()
    const policyIntact =
      probe.roots.every(
        (root) => root.isRenderGroup === (mode === 'isolated')
      ) &&
      Object.values(probe.groups).every(
        (group) => group.isRenderGroup === (mode === 'isolated')
      )
    // Inspect independent work in a separate pass; instrumentation is not timed.
    const originalDraw = gl.drawElements.bind(gl)
    const originalMatrix = gl.uniformMatrix3fv.bind(gl)
    const originalProgram = gl.useProgram.bind(gl)
    const programs = new Set<WebGLProgram>([
      gl.getParameter(gl.CURRENT_PROGRAM)
    ])
    let draws = 0,
      matrices = 0,
      programBinds = 0

    gl.drawElements = (...args: Parameters<typeof gl.drawElements>) => {
      draws++
      originalDraw(...args)
    }

    gl.uniformMatrix3fv = (...args: Parameters<typeof gl.uniformMatrix3fv>) => {
      matrices++
      originalMatrix(...args)
    }

    gl.useProgram = (program) => {
      programBinds++
      if (program) {
        programs.add(program)
      }

      originalProgram(program)
    }

    try {
      paint()
    } finally {
      gl.drawElements = originalDraw
      gl.uniformMatrix3fv = originalMatrix
      gl.useProgram = originalProgram
    }

    return {
      mode,
      policyIntact,
      directWork,
      roots,
      perRoot,
      samples,
      clones,
      coldMs,
      groupBounds,
      work: { draws, matrices, programBinds, programs: programs.size },
      images: {
        initial,
        beforeCapture,
        afterCapture,
        afterDirectCapture,
        directCapture: directCapture.png,
        restored,
        capture: coldCapture.png,
        editedCapture: editedCapture.png
      },
      capture: {
        width: coldCapture.width,
        height: coldCapture.height,
        clones: coldCapture.clones
      },
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION)
    }
  } finally {
    // The probe owns live paint contexts; captures only borrow them.
    probe.dispose()
    app.destroy(true)
  }
}

interface ObservedRow {
  id: string
  parentId: string
  local: number[]
  canonicalWorld: number[]
}

/** Replays the actual App's observed two-parent translation handoff. */
export function replayAcceptedHandoff(input: {
  initial: ObservedRow[]
  batches: { rows: ObservedRow[] }[]
}) {
  const probe = new RetainedHierarchyProbe('retained', input.initial.length, 1)
  const workspace = input.initial[0].parentId
  const ids = new Map(input.initial.map((row, index) => [row.id, index]))

  probe.leaves.forEach((leaf) => leaf.position.set(0, 0))
  try {
    return [input.initial, ...input.batches.map((batch) => batch.rows)].map(
      (rows) => {
        const grouped = rows.find((row) => row.parentId !== workspace)

        if (grouped) {
          probe.moveGroup(
            'target',
            grouped.canonicalWorld[0] - grouped.local[0],
            grouped.canonicalWorld[1] - grouped.local[1]
          )
        }

        probe.accept(
          rows.map((row) => {
            const id = ids.get(row.id)

            if (id === undefined) {
              throw new Error('Unknown recorded root')
            }

            return {
              id,
              parent: row.parentId === workspace ? 'source' : 'target',
              x: row.local[0],
              y: row.local[1]
            }
          })
        )
        probe.updateTransforms()

        return {
          expected: rows.map((row) => row.canonicalWorld),
          actual: probe.leaves.map((leaf) => {
            const position = leaf.getGlobalPosition()

            return [position.x, position.y]
          })
        }
      }
    )
  } finally {
    probe.dispose()
  }
}
