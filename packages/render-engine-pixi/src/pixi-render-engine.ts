import {
  RenderEngineCapabilities,
  type RenderEngine,
  type RenderEngineCapability,
  type RenderEngineCommand,
  type RenderEngineCommandResult,
  type RenderEngineDestroyResult,
  type RenderEngineDrawOperation,
  type RenderEngineFrameCallback,
  type RenderEngineInitializeOptions,
  type RenderEngineInitializeResult,
  type RenderEngineInteractionEvent,
  type RenderEngineInteractionListener,
  type RenderEngineInteractionType,
  type RenderEngineObjectHandle,
  type RenderEngineObjectProperties,
  type RenderEnginePaint,
  type RenderEngineQuery,
  type RenderEngineQueryResult,
  type RenderEngineResourceDescriptor,
  type RenderEngineResourceHandle
} from '@asyra/render-engine'
import {
  Application,
  Container,
  Graphics,
  Mesh,
  MeshGeometry,
  Rectangle,
  Text,
  Texture,
  Ticker,
  type FederatedPointerEvent
} from 'pixi.js'
import {
  createPixiOwnedResource,
  type PixiOwnedResource
} from './pixi-resources.js'

type PixiObject = Container | Graphics | Mesh

type StoredObjectHandle = RenderEngineObjectHandle &
  Readonly<{ kind: 'pixi-object'; id: string }>

type StoredResourceHandle = RenderEngineResourceHandle &
  Readonly<{ kind: 'pixi-resource'; id: string }>

type AppendHost = Readonly<{
  appendChild: (surface: unknown) => unknown
}>

type MeshProperties = Readonly<{
  positions?: ArrayLike<number>
  indices?: ArrayLike<number>
  uvs?: ArrayLike<number>
}>

const interactionTypes: readonly RenderEngineInteractionType[] = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'pointerover',
  'pointerout'
]

const isAppendHost = (value: unknown): value is AppendHost =>
  typeof value === 'object' &&
  value !== null &&
  'appendChild' in value &&
  typeof value.appendChild === 'function'

const toFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const toFloat32Array = (value: ArrayLike<number> | undefined) =>
  value ? Float32Array.from(value) : new Float32Array(0)

const toUint32Array = (value: ArrayLike<number> | undefined) =>
  value ? Uint32Array.from(value) : new Uint32Array(0)

export class PixiRenderEngine implements RenderEngine {
  private readonly textChildren = new WeakMap<Graphics, Text[]>()
  private readonly liveText = new Set<Text>()
  private textResolutionDirty = false

  readonly name = 'pixi'
  readonly capabilities: ReadonlySet<RenderEngineCapability> = new Set(
    Object.values(RenderEngineCapabilities)
  )

  private app: Application | null = null
  private rootHandle: StoredObjectHandle | null = null
  private readonly objects = new Map<RenderEngineObjectHandle, PixiObject>()
  private objectHandles = new WeakMap<PixiObject, RenderEngineObjectHandle>()
  private readonly resources = new Map<
    RenderEngineResourceHandle,
    PixiOwnedResource
  >()
  private readonly interactionListeners =
    new Set<RenderEngineInteractionListener>()
  private frameTicker: Ticker | null = null
  private frameHandler: ((ticker: Ticker) => void) | null = null
  private destroyed = false
  private nextHandleId = 1

  async initialize(
    options: RenderEngineInitializeOptions
  ): Promise<RenderEngineInitializeResult> {
    this.assertActive()
    if (this.app) {
      throw new Error('Pixi render engine is already initialized')
    }

    const app = new Application()
    const runtimeWindow = typeof window === 'undefined' ? null : window
    try {
      await app.init({
        width: options.width,
        height: options.height,
        antialias: options.antialias ?? true,
        resolution:
          options.resolution ??
          Math.min(runtimeWindow?.devicePixelRatio ?? 1, 2),
        autoDensity: options.autoDensity ?? true,
        autoStart: false,
        ...(options.backgroundColor !== undefined
          ? { backgroundColor: options.backgroundColor }
          : {}),
        ...(options.backgroundAlpha !== undefined
          ? { backgroundAlpha: options.backgroundAlpha }
          : {}),
        ...(runtimeWindow ? { resizeTo: runtimeWindow } : {})
      })

      app.stage.eventMode = 'static'
      this.app = app
      this.rootHandle = this.createObjectHandle('root')
      this.objectHandles.set(app.stage, this.rootHandle)
      this.attachInteractionEvents(app.stage)

      if (isAppendHost(options.host)) {
        options.host.appendChild(app.canvas)
      }

      return {
        surface: app.canvas,
        inputTarget: app.canvas,
        runtime: app,
        root: this.rootHandle
      }
    } catch (error) {
      this.detachInteractionEvents(app.stage)
      try {
        app.destroy(true)
      } catch {
        // Pixi plugins may not have completed initialization; preserve the
        // owner failure instead of replacing it with a partial-cleanup error.
      }
      this.app = null
      this.rootHandle = null
      this.objectHandles = new WeakMap()
      throw error
    }
  }

  execute(command: RenderEngineCommand): RenderEngineCommandResult {
    const app = this.assertReady()

    switch (command.type) {
      case 'create-object': {
        const object = this.createPixiObject(
          command.objectType,
          command.properties
        )
        const handle = this.createObjectHandle(command.requestId)
        this.objects.set(handle, object)
        this.objectHandles.set(object, handle)
        return {
          commandType: command.type,
          status: 'applied',
          object: handle
        }
      }
      case 'update-object':
        this.applyObjectProperties(
          this.getOwnedObject(command.object),
          command.properties
        )
        return { commandType: command.type, status: 'applied' }
      case 'destroy-object': {
        const object = this.getOwnedObject(command.object)
        this.destroyPixiObject(object)
        this.objects.delete(command.object)
        return { commandType: command.type, status: 'applied' }
      }
      case 'append-child':
        this.textResolutionDirty = true
        this.getOwnedObject(command.parent).addChild(
          this.getOwnedObject(command.child)
        )
        return { commandType: command.type, status: 'applied' }
      case 'remove-child':
        this.textResolutionDirty = true
        this.getOwnedObject(command.parent).removeChild(
          this.getOwnedObject(command.child)
        )
        return { commandType: command.type, status: 'applied' }
      case 'set-child-index':
        this.getOwnedObject(command.parent).setChildIndex(
          this.getOwnedObject(command.child),
          command.index
        )
        return { commandType: command.type, status: 'applied' }
      case 'draw': {
        const object = this.getOwnedObject(command.object)
        if (!(object instanceof Graphics)) {
          throw new Error('Pixi draw commands require a graphics object')
        }
        command.operations.forEach((operation) =>
          this.applyDrawOperation(object, operation)
        )
        return { commandType: command.type, status: 'applied' }
      }
      case 'create-resource': {
        const handle = this.createResourceHandle(command.requestId)
        this.resources.set(handle, this.createOwnedResource(command.descriptor))
        return {
          commandType: command.type,
          status: 'applied',
          resource: handle
        }
      }
      case 'destroy-resource':
        this.destroyOwnedResource(command.resource)
        return { commandType: command.type, status: 'applied' }
      case 'resize':
        app.renderer.resize(command.width, command.height)
        return { commandType: command.type, status: 'applied' }
      case 'set-viewport':
        if (
          app.stage.scale.x !== command.scale.x ||
          app.stage.scale.y !== command.scale.y
        )
          this.textResolutionDirty = true
        app.stage.position.set(command.position.x, command.position.y)
        app.stage.scale.set(command.scale.x, command.scale.y)
        return { commandType: command.type, status: 'applied' }
      case 'flush':
        this.updateTextResolution()
        app.render()
        return { commandType: command.type, status: 'applied' }
    }
  }

  query(query: RenderEngineQuery): RenderEngineQueryResult {
    const app = this.assertReady()

    switch (query.type) {
      case 'snapshot': {
        if (
          !Number.isInteger(query.maxDimension) ||
          query.maxDimension < 1 ||
          query.maxDimension > 1024
        )
          throw new RangeError('Snapshot dimension must be between 1 and 1024')
        const target = this.getOwnedObject(query.object)
        const local = target.getLocalBounds()
        const bounds = {
          x: local.x,
          y: local.y,
          width: local.width,
          height: local.height
        }
        if (
          !Object.values(bounds).every(Number.isFinite) ||
          bounds.width <= 0 ||
          bounds.height <= 0
        )
          throw new Error('Snapshot target has no finite visible bounds')
        if (query.region) {
          const region = query.region
          if (
            ![region.x, region.y, region.width, region.height].every(
              Number.isFinite
            ) ||
            region.width <= 0 ||
            region.height <= 0 ||
            region.x < local.x ||
            region.y < local.y ||
            region.x + region.width > local.x + local.width ||
            region.y + region.height > local.y + local.height
          )
            throw new RangeError('Snapshot region must be inside target bounds')
          Object.assign(bounds, region)
        }
        // Pixi truncates extraction frames to whole local units before applying
        // resolution. Enclose fractional content explicitly and report the same
        // frame so image pixels and review coordinates describe one region.
        const enclosingSize = (size: number) =>
          Math.max(1, Math.ceil(size - Number.EPSILON * Math.max(1, size) * 4))
        bounds.width = enclosingSize(bounds.width)
        bounds.height = enclosingSize(bounds.height)
        if (
          query.nativeResolution &&
          Math.max(bounds.width, bounds.height) > query.maxDimension
        )
          throw new RangeError(
            'Native-resolution snapshot exceeds the capture limit; request a region within the limit. No downsampling was performed.'
          )
        const resolution = query.nativeResolution
          ? 1
          : Math.min(
              4,
              query.maxDimension / Math.max(bounds.width, bounds.height)
            )
        const canvas = this.withSnapshotTextResolution(target, resolution, () =>
          app.renderer.extract.canvas({
            target,
            frame: new Rectangle(
              bounds.x,
              bounds.y,
              bounds.width,
              bounds.height
            ),
            resolution,
            clearColor: '#ffffff',
            antialias: true
          })
        )
        const dataUrl = canvas.toDataURL?.('image/png')
        if (
          !Number.isInteger(canvas.width) ||
          !Number.isInteger(canvas.height) ||
          canvas.width < 1 ||
          canvas.height < 1 ||
          canvas.width > query.maxDimension ||
          canvas.height > query.maxDimension ||
          (query.nativeResolution &&
            (canvas.width !== bounds.width ||
              canvas.height !== bounds.height)) ||
          !dataUrl?.startsWith('data:image/png;base64,') ||
          dataUrl.length > 8 * 1024 * 1024
        )
          throw new Error('Snapshot image unavailable')
        return {
          type: 'snapshot',
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          bounds
        }
      }
      case 'get-local-content-bounds':
      case 'get-bounds': {
        const object = this.getOwnedObject(query.object)
        const bounds =
          query.type === 'get-local-content-bounds'
            ? object.getLocalBounds()
            : object.getBounds()
        return {
          type: 'bounds',
          bounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
          }
        }
      }
      case 'to-local': {
        const point = this.getOwnedObject(query.object).toLocal(query.point)
        return { type: 'point', point: { x: point.x, y: point.y } }
      }
      case 'to-global': {
        const point = this.getOwnedObject(query.object).toGlobal(query.point)
        return { type: 'point', point: { x: point.x, y: point.y } }
      }
      case 'hit-test': {
        const target = app.renderer.events.rootBoundary.hitTest(
          query.point.x,
          query.point.y
        ) as Container | null
        return {
          type: 'hit',
          target: this.findObjectHandle(target),
          point: query.point
        }
      }
    }
  }

  subscribeToInteraction(
    listener: RenderEngineInteractionListener
  ): () => void {
    this.assertActive()
    this.interactionListeners.add(listener)
    return () => {
      this.interactionListeners.delete(listener)
    }
  }

  requestFrame(callback: RenderEngineFrameCallback): void {
    this.assertReady()
    this.cancelFrame()
    const ticker = this.frameTicker ?? new Ticker()
    const frameHandler = (currentTicker: Ticker) => {
      if (this.frameHandler !== frameHandler) {
        return
      }
      this.cancelFrame()
      callback(currentTicker.lastTime)
    }
    this.frameTicker = ticker
    this.frameHandler = frameHandler
    ticker.add(frameHandler)
    ticker.start()
  }

  cancelFrame(): void {
    const ticker = this.frameTicker
    const frameHandler = this.frameHandler
    this.frameHandler = null
    if (!ticker || !frameHandler) {
      return
    }
    ticker.remove(frameHandler)
    ticker.stop()
  }

  destroy(): RenderEngineDestroyResult {
    if (this.destroyed) {
      return {
        destroyedObjects: 0,
        destroyedResources: 0,
        alreadyDestroyed: true
      }
    }

    const result: RenderEngineDestroyResult = {
      destroyedObjects: this.objects.size,
      destroyedResources: this.resources.size,
      alreadyDestroyed: false
    }

    this.cancelFrame()
    this.frameTicker?.destroy()
    this.frameTicker = null
    if (this.app) {
      this.detachInteractionEvents(this.app.stage)
    }
    for (const handle of [...this.resources.keys()]) {
      this.destroyOwnedResource(handle)
    }
    for (const object of [...this.objects.values()].reverse()) {
      this.destroyPixiObject(object)
    }
    this.objects.clear()
    this.interactionListeners.clear()
    this.app?.destroy(true)
    this.app = null
    this.rootHandle = null
    this.objectHandles = new WeakMap()
    this.destroyed = true
    return result
  }

  private readonly handlePixiInteraction = (
    event: FederatedPointerEvent
  ): void => {
    const normalizedEvent: RenderEngineInteractionEvent = {
      type: event.type as RenderEngineInteractionType,
      pointerId: event.pointerId,
      button: event.button,
      buttons: event.buttons,
      position: { x: event.global.x, y: event.global.y },
      modifiers: {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      },
      target: this.findObjectHandle(event.target as Container | null),
      timestamp: event.timeStamp
    }

    for (const listener of this.interactionListeners) {
      listener(normalizedEvent)
    }
  }

  private attachInteractionEvents(stage: Container): void {
    interactionTypes.forEach((type) => {
      stage.on(type, this.handlePixiInteraction)
    })
  }

  private detachInteractionEvents(stage: Container): void {
    interactionTypes.forEach((type) => {
      stage.off(type, this.handlePixiInteraction)
    })
  }

  private createPixiObject(
    objectType: 'container' | 'graphics' | 'mesh',
    properties: RenderEngineObjectProperties = {}
  ): PixiObject {
    let object: PixiObject
    switch (objectType) {
      case 'container':
        object = new Container()
        break
      case 'graphics':
        object = new Graphics()
        break
      case 'mesh': {
        const mesh = properties.geometry as MeshProperties | undefined
        const geometry = new MeshGeometry({
          positions: toFloat32Array(mesh?.positions),
          indices: toUint32Array(mesh?.indices),
          uvs: toFloat32Array(mesh?.uvs)
        })
        object = new Mesh({ geometry, texture: Texture.WHITE })
        break
      }
    }
    this.applyObjectProperties(object, properties, false)
    return object
  }

  private applyObjectProperties(
    object: PixiObject,
    properties: RenderEngineObjectProperties,
    updateGeometry = true
  ): void {
    const previousScaleX = object.scale.x,
      previousScaleY = object.scale.y
    const previousSkewX = object.skew.x,
      previousSkewY = object.skew.y
    const previousRotation = object.rotation
    const numericProperties = [
      'x',
      'y',
      'alpha',
      'angle',
      'rotation',
      'zIndex'
    ] as const
    numericProperties.forEach((property) => {
      const value = toFiniteNumber(properties[property])
      if (value !== undefined) {
        object[property] = value
      }
    })

    if (typeof properties.label === 'string') {
      object.label = properties.label
    }
    if (typeof properties.visible === 'boolean') {
      object.visible = properties.visible
    }
    if (typeof properties.renderable === 'boolean') {
      object.renderable = properties.renderable
    }
    if (typeof properties.eventMode === 'string') {
      object.eventMode = properties.eventMode as typeof object.eventMode
    }
    if (typeof properties.cursor === 'string') {
      object.cursor = properties.cursor as typeof object.cursor
    }
    if (typeof properties.batched === 'boolean') {
      if (object instanceof Graphics) {
        const batchMode = properties.batched ? 'auto' : 'no-batch'
        if (object.context.batchMode !== batchMode) {
          object.context.batchMode = batchMode
          object.context.dirty = true
        }
      } else {
        ;(object as PixiObject & { batched?: boolean }).batched =
          properties.batched
      }
    }

    const width = toFiniteNumber(properties.width)
    const height = toFiniteNumber(properties.height)
    if (width !== undefined && width > 0) {
      object.width = width
    }
    if (height !== undefined && height > 0) {
      object.height = height
    }

    const scaleX = toFiniteNumber(properties.scaleX)
    const scaleY = toFiniteNumber(properties.scaleY)
    if (scaleX !== undefined || scaleY !== undefined) {
      object.scale.set(scaleX ?? object.scale.x, scaleY ?? object.scale.y)
    }

    const skewX = toFiniteNumber(properties.skewX)
    const skewY = toFiniteNumber(properties.skewY)
    if (skewX !== undefined || skewY !== undefined) {
      object.skew.set(skewX ?? object.skew.x, skewY ?? object.skew.y)
    }

    if (
      previousScaleX !== object.scale.x ||
      previousScaleY !== object.scale.y ||
      previousSkewX !== object.skew.x ||
      previousSkewY !== object.skew.y ||
      previousRotation !== object.rotation
    )
      this.textResolutionDirty = true

    if (object instanceof Mesh) {
      const geometry = properties.geometry as MeshProperties | undefined
      if (geometry && updateGeometry) {
        object.geometry.positions = toFloat32Array(geometry.positions)
        object.geometry.uvs = toFloat32Array(geometry.uvs)
        object.geometry.indices = toUint32Array(geometry.indices)
        object.geometry.getBuffer('aPosition').update()
        object.geometry.getBuffer('aUV').update()
        object.geometry.getIndex().update()
      }
      const tint = toFiniteNumber(properties.tint)
      if (tint !== undefined) {
        object.tint = tint
      }
    }
  }

  private applyDrawOperation(
    graphics: Graphics,
    operation: RenderEngineDrawOperation
  ): void {
    switch (operation.type) {
      case 'clear':
        this.clearTextChildren(graphics)
        graphics.clear()
        break
      case 'text': {
        const text = new Text({
          text: operation.text,
          style: {
            fontFamily: operation.fontFamily,
            fontSize: operation.fontSize,
            fontWeight: operation.fontWeight,
            fontStyle: operation.fontStyle,
            align: operation.align,
            lineHeight: operation.lineHeight,
            letterSpacing: operation.letterSpacing,
            fill: operation.color,
            wordWrap: true,
            wordWrapWidth: operation.width,
            breakWords: true
          }
        })
        const remainingWidth = Math.max(0, operation.width - text.width)
        text.x = operation.x
        if (operation.align === 'right') text.x += remainingWidth
        if (operation.align === 'center') text.x += remainingWidth / 2
        text.y = operation.y
        graphics.addChild(text)
        this.liveText.add(text)
        this.textResolutionDirty = true
        const children = this.textChildren.get(graphics) ?? []
        children.push(text)
        this.textChildren.set(graphics, children)
        break
      }
      case 'rect':
        graphics.rect(
          operation.x,
          operation.y,
          operation.width,
          operation.height
        )
        break
      case 'ellipse':
        graphics.ellipse(
          operation.x,
          operation.y,
          operation.radiusX,
          operation.radiusY
        )
        break
      case 'circle':
        graphics.circle(operation.x, operation.y, operation.radius)
        break
      case 'poly':
        graphics.poly(
          operation.points as { x: number; y: number }[],
          operation.close
        )
        break
      case 'move-to':
        graphics.moveTo(operation.x, operation.y)
        break
      case 'line-to':
        graphics.lineTo(operation.x, operation.y)
        break
      case 'bezier-curve-to':
        graphics.bezierCurveTo(
          operation.controlPoint1.x,
          operation.controlPoint1.y,
          operation.controlPoint2.x,
          operation.controlPoint2.y,
          operation.destination.x,
          operation.destination.y
        )
        break
      case 'close-path':
        graphics.closePath()
        break
      case 'fill':
        graphics.fill(this.resolvePaint(operation.paint) as never)
        break
      case 'stroke':
        graphics.stroke({
          ...(this.resolvePaint(operation.paint) as object),
          width: operation.width
        } as never)
        break
    }
  }

  private resolvePaint(paint: RenderEnginePaint): unknown {
    if (paint.resource) {
      const resource = this.resources.get(paint.resource)
      if (!resource) {
        throw new Error('Pixi render engine does not own resource handle')
      }
      return resource.value
    }
    return {
      ...(paint.color !== undefined ? { color: paint.color } : {}),
      ...(paint.alpha !== undefined ? { alpha: paint.alpha } : {})
    }
  }

  private createOwnedResource(
    descriptor: RenderEngineResourceDescriptor
  ): PixiOwnedResource {
    return createPixiOwnedResource(descriptor)
  }

  private destroyOwnedResource(handle: RenderEngineResourceHandle): void {
    const resource = this.resources.get(handle)
    if (!resource) {
      throw new Error('Pixi render engine does not own resource handle')
    }
    resource.destroy?.()
    this.resources.delete(handle)
  }

  private updateTextResolution(): void {
    if (!this.textResolutionDirty) return
    this.textResolutionDirty = false
    const pixelRatio = this.assertReady().renderer.resolution
    for (const text of this.liveText) {
      const { a, b, c, d } = text.getGlobalTransform()
      const first = a * a + b * b,
        second = c * c + d * d
      const cross = a * c + b * d
      const scale = Math.sqrt(
        (first + second + Math.hypot(first - second, 2 * cross)) / 2
      )
      this.setTextResolution(text, pixelRatio * scale)
    }
  }

  private setTextResolution(text: Text, density: number): void {
    const width = Math.max(1, text.width),
      height = Math.max(1, text.height)
    const resolution = Math.min(
      4,
      density,
      4096 / Math.max(width, height),
      Math.sqrt((4 * 1024 * 1024) / (width * height))
    )
    if (
      Number.isFinite(resolution) &&
      resolution > 0 &&
      text.resolution !== resolution
    )
      text.resolution = resolution
  }

  private withSnapshotTextResolution<T>(
    target: Container,
    density: number,
    capture: () => T
  ): T {
    // Extraction renders in the target's local space. Compose only descendants'
    // linear transforms, so screen zoom and target placement cannot affect density.
    const restore: { text: Text; resolution: number }[] = []
    const pending = [{ object: target, a: 1, b: 0, c: 0, d: 1 }]
    try {
      while (pending.length) {
        const next = pending.pop()
        if (!next) break
        const { object, a, b, c, d } = next
        if (object instanceof Text && this.liveText.has(object)) {
          restore.push({ text: object, resolution: object.resolution })
          const first = a * a + b * b,
            second = c * c + d * d
          const scale = Math.sqrt(
            (first + second + Math.hypot(first - second, 2 * (a * c + b * d))) /
              2
          )
          this.setTextResolution(object, density * scale)
        }
        for (const child of object.children) {
          child.updateLocalTransform()
          const local = child.localTransform
          pending.push({
            object: child,
            a: a * local.a + c * local.b,
            b: b * local.a + d * local.b,
            c: a * local.c + c * local.d,
            d: b * local.c + d * local.d
          })
        }
      }
      return capture()
    } finally {
      for (const { text, resolution } of restore) {
        if (text.resolution !== resolution) text.resolution = resolution
      }
    }
  }

  private clearTextChildren(graphics: Graphics): void {
    for (const text of this.textChildren.get(graphics) ?? []) {
      graphics.removeChild(text)
      this.liveText.delete(text)
      text.destroy()
    }
    this.textChildren.delete(graphics)
  }

  private destroyPixiObject(object: PixiObject): void {
    if (object instanceof Graphics) this.clearTextChildren(object)
    object.parent?.removeChild(object)
    const ownedGeometry = object instanceof Mesh ? object.geometry : null
    try {
      object.destroy({
        children: false,
        texture: false,
        textureSource: false
      })
    } finally {
      ownedGeometry?.destroy()
    }
  }

  private getOwnedObject(handle: RenderEngineObjectHandle): PixiObject {
    if (handle === this.rootHandle) {
      return this.assertReady().stage
    }
    const object = this.objects.get(handle)
    if (!object) {
      throw new Error('Pixi render engine does not own object handle')
    }
    return object
  }

  private findObjectHandle(
    target: Container | null
  ): RenderEngineObjectHandle | null {
    let current = target
    while (current) {
      const handle = this.objectHandles.get(current)
      if (handle) {
        return handle
      }
      current = current.parent
    }
    return null
  }

  private createObjectHandle(requestId: string): StoredObjectHandle {
    return Object.freeze({
      kind: 'pixi-object',
      id: `${requestId}:${this.nextHandleId++}`
    }) as StoredObjectHandle
  }

  private createResourceHandle(requestId: string): StoredResourceHandle {
    return Object.freeze({
      kind: 'pixi-resource',
      id: `${requestId}:${this.nextHandleId++}`
    }) as StoredResourceHandle
  }

  private assertReady(): Application {
    this.assertActive()
    if (!this.app) {
      throw new Error('Pixi render engine is not initialized')
    }
    return this.app
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error('Pixi render engine is destroyed')
    }
  }
}

export const createPixiRenderEngine = (): RenderEngine => new PixiRenderEngine()
