export { VERSION as pixiVersion } from 'pixi.js'
import {
  Application,
  BlurFilter,
  Container,
  DefaultShader,
  Graphics,
  Sprite,
  Text,
  Texture,
  extensions,
  type BatcherOptions,
  type WebGLRenderer
} from 'pixi.js'
import { MeshMaterialBatcher } from '../mesh-material-batch.js'
import { measureRetainedProjection } from './retained-hierarchy-browser-probe.js'

/** Same-SDK independent-program control; never installed by the app. */
class IndependentProgramBatcher extends MeshMaterialBatcher {
  constructor(options: BatcherOptions) {
    super(options)
    const reference = new DefaultShader(this.maxTextures)

    this.shader.glProgram = reference.glProgram
    reference.destroy()
  }
}

export async function measureSharedPrograms(shared: boolean, roots: number) {
  const implementation = shared
    ? MeshMaterialBatcher
    : IndependentProgramBatcher

  extensions.remove(MeshMaterialBatcher)
  extensions.add(implementation)
  try {
    return await measureRetainedProjection('isolated', roots, 4000 / roots)
  } finally {
    extensions.remove(implementation)
    extensions.add(MeshMaterialBatcher)
  }
}

export function verifyProgramOwnership() {
  const first = new MeshMaterialBatcher({ maxTextures: 4 })
  const second = new MeshMaterialBatcher({ maxTextures: 4 })
  const smaller = new MeshMaterialBatcher({ maxTextures: 2 })
  const program = first.shader.glProgram
  const sameProgram = program === second.shader.glProgram
  const separateShaders = first.shader !== second.shader
  const capacitySeparated = program !== smaller.shader.glProgram

  first.destroy()
  const survivorUsable = Boolean(second.shader.glProgram.vertex)

  second.destroy()
  smaller.destroy()

  return { sameProgram, separateShaders, capacitySeparated, survivorUsable }
}

export async function verifyProgramContextRestore() {
  const app = new Application()

  await app.init({
    width: 64,
    height: 48,
    preference: 'webgl',
    autoStart: false,
    preserveDrawingBuffer: true
  })
  try {
    for (const [x, color, alpha] of [
      [3, 0xff0000, 0.5],
      [29, 0x00ff00, 1]
    ]) {
      const group = new Container({ isRenderGroup: true, x, y: 5, alpha })

      group.addChild(new Graphics().rect(0, 0, 20, 30).fill(color))
      app.stage.addChild(group)
    }

    const renderer = app.renderer as WebGLRenderer
    const gl = renderer.gl
    const extension = gl.getExtension('WEBGL_lose_context')

    if (!extension) {
      throw new Error('Context-loss regression requires WEBGL_lose_context')
    }

    const capture = () => {
      app.render()
      gl.finish()

      return (app.canvas as HTMLCanvasElement).toDataURL('image/png')
    }

    const before = capture()
    const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM)

    const event = (name: string, action: () => void) =>
      new Promise<void>((resolve, reject) => {
        const listener = () => {
          clearTimeout(timer)
          resolve()
        }

        const timer = setTimeout(() => {
          app.canvas.removeEventListener(name, listener)
          reject(new Error(`Missing ${name}`))
        }, 10_000)

        app.canvas.addEventListener(name, listener, { once: true })
        action()
      })

    await event('webglcontextrestored', () =>
      renderer.context.forceContextLoss()
    )
    const restored = capture()
    const newProgram = gl.getParameter(gl.CURRENT_PROGRAM)

    app.stage.children[0].x += 4
    const moved = capture()

    return {
      samePixels: before === restored,
      newNativeProgram: oldProgram !== newProgram,
      changedPixels: moved !== restored,
      error: gl.getError()
    }
  } finally {
    app.destroy(true, { children: true })
  }
}

/** Exercise ordinary textured content and nested effect targets as well as vectors. */
export async function verifyMixedProgramContent(shared: boolean) {
  const implementation = shared
    ? MeshMaterialBatcher
    : IndependentProgramBatcher

  extensions.remove(MeshMaterialBatcher)
  extensions.add(implementation)
  const app = new Application()
  let texture: Texture | undefined

  try {
    await app.init({
      width: 180,
      height: 120,
      preference: 'webgl',
      autoStart: false,
      antialias: true,
      preserveDrawingBuffer: true,
      backgroundColor: 0xffffff
    })
    const source = document.createElement('canvas')

    source.width = 16
    source.height = 16
    const context = source.getContext('2d')

    if (!context) {
      throw new Error('Missing fixture canvas')
    }

    context.fillStyle = '#00bbff'
    context.fillRect(0, 0, 16, 16)
    context.fillStyle = '#003399'
    context.fillRect(0, 0, 8, 8)
    texture = Texture.from(source)
    const group = new Container({ isRenderGroup: true, x: 20, y: 15 })
    const nested = new Container({
      isRenderGroup: true,
      x: 9,
      y: 8,
      alpha: 0.65
    })
    const effect = new Graphics().circle(34, 28, 8).fill(0xff6600)
    const filter = new BlurFilter({ strength: 1, quality: 2 })

    effect.filters = [filter]
    nested.addChild(new Sprite({ texture, width: 32, height: 32 }), effect)
    group.addChild(
      new Graphics().rect(0, 0, 90, 70).fill(0xddddee),
      nested,
      new Text({
        text: 'Group 42',
        x: 4,
        y: 46,
        style: { fontFamily: 'Arial', fontSize: 14, fill: 0x112233 }
      })
    )
    app.stage.addChild(
      group,
      new Graphics().rect(22, 17, 12, 12).fill(0x00ff00)
    )
    const gl = (app.renderer as WebGLRenderer).gl

    const frame = () => {
      app.render()
      gl.finish()

      return (app.canvas as HTMLCanvasElement).toDataURL('image/png')
    }

    const initial = frame()
    const selected = app.renderer.extract.canvas({
      target: group
    }) as HTMLCanvasElement
    const capture = selected.toDataURL('image/png')
    const captureContext = selected.getContext('2d')

    if (!captureContext) {
      throw new Error('Missing capture pixels')
    }

    const selectedPixel = Array.from(
      captureContext.getImageData(4, 4, 1, 1).data
    )
    const restored = frame()

    nested.x += 5
    effect.tint = 0x66bbff
    const edited = frame()
    const error = gl.getError()
    const bounds = { width: selected.width, height: selected.height }

    filter.destroy()

    return {
      images: { initial, capture, restored, edited },
      bounds,
      error,
      selectedPixel
    }
  } finally {
    app.destroy(true, { children: true })
    texture?.destroy(true)
    extensions.remove(implementation)
    extensions.add(MeshMaterialBatcher)
  }
}

/** Actual GPU use after releasing a peer and an independently rendered context. */
export async function verifyLiveProgramLifetime() {
  const first = new Application()
  const second = new Application()
  const owner = new MeshMaterialBatcher({ maxTextures: 4 })
  const survivor = new MeshMaterialBatcher({ maxTextures: 4 })
  let firstDestroyed = false
  let ownerDestroyed = false
  let survivorDestroyed = false

  for (const app of [first, second]) {
    await app.init({
      width: 64,
      height: 32,
      preference: 'webgl',
      autoStart: false,
      preserveDrawingBuffer: true,
      backgroundColor: 0xffffff
    })
    for (const [x, tint] of [
      [4, 0xff0000],
      [32, 0x0000ff]
    ]) {
      const group = new Container({ isRenderGroup: true, x, y: 4, tint })

      group.addChild(new Graphics().rect(0, 0, 8, 8).fill(0xffffff))
      app.stage.addChild(group)
    }
  }

  const firstRenderer = first.renderer as WebGLRenderer
  const renderer = second.renderer as WebGLRenderer
  const gl = renderer.gl

  const frame = () => {
    second.render()
    gl.finish()

    return (second.canvas as HTMLCanvasElement).toDataURL('image/png')
  }

  const pixel = (x: number, y: number) => {
    const value = new Uint8Array(4)

    gl.readPixels(x, 31 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, value)

    return Array.from(value)
  }

  try {
    first.render()
    firstRenderer.shader.bind(owner.shader)
    const firstProgram = firstRenderer.gl.getParameter(
      firstRenderer.gl.CURRENT_PROGRAM
    )
    const before = frame()

    renderer.shader.bind(survivor.shader)
    const secondProgram = gl.getParameter(gl.CURRENT_PROGRAM)
    const sharedSource = owner.shader.glProgram === survivor.shader.glProgram

    owner.destroy()
    ownerDestroyed = true
    first.destroy(true, { children: true })
    firstDestroyed = true
    // Bind and draw through the still-live context after its peer is released.
    renderer.shader.bind(survivor.shader)
    const afterRelease = frame()
    const group = second.stage.children[0]

    group.x = 14
    group.tint = 0x00ff00
    group.alpha = 0.5
    frame()
    const cleared = pixel(6, 6)
    const moved = pixel(16, 6)
    const unchangedSibling = pixel(34, 6)
    const beforeCapture = frame()
    const selected = renderer.extract.canvas({
      target: group,
      clearColor: 0xffffff
    }) as HTMLCanvasElement
    const afterCapture = frame()
    const selectedContext = selected.getContext('2d')

    if (!selectedContext) {
      throw new Error('Missing live-owner capture pixels')
    }

    const captured = Array.from(selectedContext.getImageData(2, 2, 1, 1).data)
    const bounds = [selected.width, selected.height]
    const programSurvives = gl.isProgram(secondProgram)

    survivor.destroy()
    survivorDestroyed = true
    const late = new MeshMaterialBatcher({ maxTextures: 4 })

    renderer.shader.bind(late.shader)
    late.destroy()
    group.alpha = 1
    frame()
    const later = pixel(16, 6)
    const error = gl.getError()

    return {
      sharedSource,
      distinctNativePrograms: firstProgram !== secondProgram,
      sameAfterRelease: before === afterRelease,
      sameAfterCapture: beforeCapture === afterCapture,
      programSurvives,
      cleared,
      moved,
      unchangedSibling,
      captured,
      bounds,
      later,
      error
    }
  } finally {
    if (!firstDestroyed) {
      first.destroy(true, { children: true })
    }

    second.destroy(true, { children: true })
    if (!ownerDestroyed) {
      owner.destroy()
    }

    if (!survivorDestroyed) {
      survivor.destroy()
    }
  }
}

/** Observe real SDK retirement without forcing JS garbage collection. */
export async function observeRetiredProgramOwners(shared: boolean) {
  const implementation = shared
    ? MeshMaterialBatcher
    : IndependentProgramBatcher

  extensions.remove(MeshMaterialBatcher)
  extensions.add(implementation)
  const app = new Application()
  const retired: number[] = []
  let destroyCalls = 0
  let disposed = false

  try {
    await app.init({
      width: 32,
      height: 32,
      preference: 'webgl',
      autoStart: false
    })
    const pipe = app.renderer.renderPipes.batch as unknown as {
      _batchersByInstructionSet: Record<
        number,
        Record<string, MeshMaterialBatcher>
      >
    }

    app.render()
    for (let index = 0; index < 4; index++) {
      const group = new Container({ isRenderGroup: true })

      group.addChild(new Graphics().rect(0, 0, 8, 8).fill(0xff0000))
      app.stage.addChild(group)
      app.render()
      const instructions = group.renderGroup?.instructionSet

      if (!instructions) {
        throw new Error('Missing Group instruction owner')
      }

      retired.push(instructions.uid)
      for (const batcher of Object.values(
        pipe._batchersByInstructionSet[instructions.uid]
      )) {
        if (!(batcher instanceof MeshMaterialBatcher)) {
          continue
        }

        const destroy = batcher.destroy.bind(batcher)

        batcher.destroy = () => {
          destroyCalls++
          destroy()
        }
      }

      group.removeFromParent()
      group.destroy({ children: true })
      app.render()
    }

    const retainedAfterDelete = retired.filter(
      (id) => pipe._batchersByInstructionSet[id]
    ).length
    const retainedShaders = retired
      .flatMap((id) => Object.values(pipe._batchersByInstructionSet[id] ?? {}))
      .filter(
        (batcher) =>
          batcher instanceof MeshMaterialBatcher && batcher.shader?.glProgram
      ).length
    const destroyedAfterDelete = destroyCalls
    const gl = (app.renderer as WebGLRenderer).gl

    app.destroy(true, { children: true })
    disposed = true

    return {
      retired: retired.length,
      retainedAfterDelete,
      retainedShaders,
      destroyedAfterDelete,
      destroyedAfterRenderer: destroyCalls,
      contextLost: gl.isContextLost()
    }
  } finally {
    if (!disposed) {
      app.destroy(true, { children: true })
    }

    extensions.remove(implementation)
    extensions.add(MeshMaterialBatcher)
  }
}

/** Pool reset retains resources; final pool destruction releases those owners. */
export async function verifyPooledProgramLifetime(
  flushBeforeShutdown: boolean
) {
  const app = new Application()

  await app.init({
    width: 32,
    height: 32,
    preference: 'webgl',
    autoStart: false,
    preserveDrawingBuffer: true,
    background: 0xffffff
  })
  let disposed = false

  try {
    const group = new Container({ isRenderGroup: true })
    const shape = new Graphics().rect(0, 0, 8, 8).fill(0xff0000)

    group.addChild(shape)
    app.stage.addChild(group)
    app.render()
    const owner = group.renderGroup

    if (!owner) {
      throw new Error('Missing pooled instruction owner')
    }

    const instructions = owner.instructionSet
    const pipe = app.renderer.renderPipes.batch as unknown as {
      _batchersByInstructionSet: Record<
        number,
        Record<string, MeshMaterialBatcher>
      >
    }
    const batchers = pipe._batchersByInstructionSet[instructions.uid]
    const batcher = Object.values(batchers).find(
      (candidate) => candidate instanceof MeshMaterialBatcher
    )

    if (!batcher) {
      throw new Error('Missing pooled material batcher')
    }

    const destroy = batcher.destroy.bind(batcher)
    let destroyCalls = 0
    let geometryReleases = 0
    let shaderReleases = 0

    batcher.geometry.on('destroy', () => {
      geometryReleases++
    })
    batcher.shader.on('destroy', () => {
      shaderReleases++
    })

    batcher.destroy = () => {
      destroyCalls++
      destroy()
    }

    const sameOwners: boolean[] = []
    const gl = (app.renderer as WebGLRenderer).gl

    const pixel = () => {
      app.render()
      const result = new Uint8Array(4)

      gl.readPixels(2, 29, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result)

      return Array.from(result)
    }

    const initial = pixel()

    for (let index = 0; index < 8; index++) {
      group.disableRenderGroup()
      app.render()
      group.enableRenderGroup()
      app.render()
      sameOwners.push(
        group.renderGroup === owner &&
          group.renderGroup.instructionSet === instructions &&
          pipe._batchersByInstructionSet[instructions.uid] === batchers
      )
    }

    shape.clear().rect(0, 0, 8, 8).fill(0x00ff00)
    const edited = pixel()
    const capture = app.renderer.extract.canvas({ target: group })
    const context = capture.getContext('2d')

    if (!context) {
      throw new Error('Missing captured canvas context')
    }

    const extracted = Array.from(context.getImageData(2, 2, 1, 1).data)
    const following = pixel()
    const destroyedWhileReusing = destroyCalls

    // Leave the owner free in the pool to exercise renderer/global teardown order.
    group.disableRenderGroup()
    if (flushBeforeShutdown) {
      app.render()
    }

    const retainedWhilePooled =
      pipe._batchersByInstructionSet[instructions.uid] === batchers
    const error = gl.getError()

    app.destroy(true, { children: true })
    disposed = true

    return {
      sameOwners,
      initial,
      edited,
      extracted,
      following,
      destroyedWhileReusing,
      retainedWhilePooled,
      destroyedAfterShutdown: destroyCalls,
      geometryReleases,
      shaderReleases,
      retainedAfterShutdown: Boolean(
        pipe._batchersByInstructionSet[instructions.uid]
      ),
      error
    }
  } finally {
    if (!disposed) {
      app.destroy(true, { children: true })
    }
  }
}
