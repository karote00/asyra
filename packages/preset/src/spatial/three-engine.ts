import { createShadowFrame } from './shadow-frame.js'
import { TransmissionCapture } from './transmission-capture.js'
import { ReflectionEnvironment } from './reflection-environment.js'
import { EmissiveBloom, requireBloomRenderer } from './emissive-bloom.js'
import {
  DEFAULT_SPATIAL_LIGHTING,
  readSpatialLighting,
  readSpatialBloom,
  type SpatialPresentationOptions
} from './lighting.js'
import { SPATIAL_ENGINE_CAPABILITIES } from './lazy-engine.js'
import { SurfaceTextureStore } from './surface-textures.js'
import * as THREE from 'three'
import {
  RenderEngineCapabilities,
  isSpatialQuery,
  type RenderEngineSpatialQuery,
  type RenderEngineSpatialResult,
  type RenderEngineSpatialHit,
  type SpatialVector,
  type SpatialRay,
  UnsupportedRenderEngineCapabilityError
} from '@asyra/render-engine'
import type {
  RenderEngine,
  RenderEngineCommand,
  RenderEngineCommandResult,
  RenderEngineInitializeOptions,
  RenderEngineInitializeResult,
  RenderEngineDestroyResult,
  RenderEngineObjectHandle,
  RenderEngineResourceHandle,
  RenderEngineObjectProperties,
  RenderEngineQuery,
  RenderEngineQueryResult,
  RenderEngineInteractionEvent,
  RenderEngineInteractionListener,
  RenderEngineFrameCallback,
  RenderEnginePaint,
  RenderEnginePoint
} from '@asyra/render-engine'
import {
  readSpatialDescriptor,
  sameSpatialShape,
  SPATIAL_PROPERTY,
  type SpatialDescriptor,
  type SpatialShape
} from './spatial-contract.js'
import { disposeObject, drawGraphics } from './graphics.js'

export interface GraphicsDriver {
  domElement: HTMLCanvasElement
  autoClear: boolean
  shadowMap?: { enabled: boolean; type: THREE.ShadowMapType }
  getContext?: () => WebGLRenderingContext | WebGL2RenderingContext
  setSize(width: number, height: number, updateStyle?: boolean): void
  setPixelRatio(ratio: number): void
  setClearColor(color: number | string, alpha?: number): void
  clear(): void
  clearDepth(): void
  render(scene: THREE.Scene, camera: THREE.Camera): void
  dispose(): void
}

const usesSoftwareRenderer = (driver: GraphicsDriver): boolean => {
  if (!driver.getContext || !driver.shadowMap) return false
  const gl = driver.getContext()
  const extension = gl.getExtension('WEBGL_debug_renderer_info') as {
    UNMASKED_RENDERER_WEBGL: number
  } | null
  if (!extension) return false
  const renderer = gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
  return (
    typeof renderer === 'string' &&
    /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(renderer)
  )
}

export interface EnginePlatform {
  createDriver?: () => GraphicsDriver
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (id: number) => void
}

const createDefaultDriver = (): GraphicsDriver => {
  const driver = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  driver.toneMapping = THREE.ACESFilmicToneMapping
  driver.shadowMap.enabled = true
  driver.shadowMap.type = THREE.PCFSoftShadowMap
  return driver
}

export type { SpatialLighting } from './lighting.js'
export interface SpatialEngineOptions extends SpatialPresentationOptions {
  readDescriptor?: (value: unknown) => SpatialDescriptor
}

interface ObjectRecord {
  handle: RenderEngineObjectHandle
  type: 'container' | 'graphics' | 'mesh'
  properties: RenderEngineObjectProperties
  spatial?: SpatialDescriptor
  visual: THREE.Group
  content: THREE.Object3D | null
  parent: ObjectRecord | null
  children: ObjectRecord[]
}

const makeGeometry = (shape: SpatialShape): THREE.BufferGeometry => {
  switch (shape.kind) {
    case 'box':
      return new THREE.BoxGeometry(...shape.size)
    case 'sphere':
      return new THREE.SphereGeometry(shape.radius, 32, 20)
    case 'capsule':
      return new THREE.CapsuleGeometry(shape.radius, shape.length, 8, 24)
    case 'triangles': {
      const geometry = new THREE.BufferGeometry()
      // Admitted arrays are frozen. Copy by index into the final owned GPU
      // buffers, avoiding generic iterable conversion and index array expansion.
      for (const [name, values] of [
        ['position', shape.positions],
        ['color', shape.colors],
        ['normal', shape.normals],
        ['uv', shape.uvs]
      ] as const) {
        if (!values) continue
        const array = new Float32Array(values.length)
        for (let i = 0; i < values.length; i++) array[i] = values[i]
        geometry.setAttribute(
          name,
          new THREE.BufferAttribute(array, name === 'uv' ? 2 : 3)
        )
      }
      const indices =
        shape.positions.length / 3 > 65535
          ? new Uint32Array(shape.indices.length)
          : new Uint16Array(shape.indices.length)
      for (let i = 0; i < shape.indices.length; i++)
        indices[i] = shape.indices[i]
      geometry.setIndex(new THREE.BufferAttribute(indices, 1))
      if (!shape.normals) geometry.computeVertexNormals()
      return geometry
    }
  }
}

const numberProperty = (
  properties: RenderEngineObjectProperties,
  key: string,
  fallback: number
) => {
  const value = properties[key]
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`Invalid render property: ${key}`)
  return value
}

const SCREEN_PROPERTIES = new Set([
  'x',
  'y',
  'width',
  'height',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
  'visible',
  'renderable',
  'label',
  'alpha',
  'angle',
  'rotation',
  'zIndex',
  'eventMode',
  'cursor',
  'batched',
  SPATIAL_PROPERTY
])

/** A CUSTOM visual engine. It owns no editable state or analysis semantics. */
export class ThreeEngine implements RenderEngine {
  private readonly instanceDetail = new WeakMap<
    THREE.InstancedMesh,
    {
      instances: unknown
      world: THREE.Matrix4
      view: THREE.Matrix4
      projection: THREE.Matrix4
      geometry: THREE.BufferGeometry
      height: number
      error: number
      pixelRatio: number
      pixelError: number
    }
  >()
  private readonly surfaceTextures = new SurfaceTextureStore()

  readonly name = 'Preset CUSTOM Three.js 0.185.1'
  readonly capabilities = new Set<string>(SPATIAL_ENGINE_CAPABILITIES)
  private readonly objects = new Map<RenderEngineObjectHandle, ObjectRecord>()
  private readonly resources = new Map<
    RenderEngineResourceHandle,
    { color: number | string; alpha: number }
  >()
  private readonly listeners = new Set<RenderEngineInteractionListener>()
  private readonly scene = new THREE.Scene()
  private readonly screen = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000)
  private readonly screenCamera = new THREE.OrthographicCamera(
    0,
    1,
    0,
    1,
    -10000,
    10000
  )
  private driver: GraphicsDriver | null = null
  private bloom?: EmissiveBloom
  private readonly reflections = new ReflectionEnvironment()
  private readonly transmissionCapture = new TransmissionCapture()
  private root: ObjectRecord | null = null
  private width = 1
  private height = 1
  private pixelRatio = 1
  private frame: number | null = null
  private frameGeneration = 0
  private destroyed = false
  private readonly pointerDisposers: (() => void)[] = []

  constructor(
    private readonly platform: EnginePlatform = {},
    private readonly options: SpatialEngineOptions = {}
  ) {
    this.camera.position.set(3, 2, 3)
    this.camera.lookAt(0, 0, 0)
    this.screenCamera.position.z = 100
  }

  initialize(
    options: RenderEngineInitializeOptions
  ): RenderEngineInitializeResult {
    if (this.destroyed || this.driver)
      throw new Error('Engine is not available for initialization')
    this.validateSize(options.width, options.height)
    const lighting = readSpatialLighting(
      this.options.lighting ?? DEFAULT_SPATIAL_LIGHTING
    )
    try {
      this.driver = this.platform.createDriver?.() ?? createDefaultDriver()
      this.driver.autoClear = false
      const softwareRenderer =
        this.options.softwareShadowFallback !== false &&
        usesSoftwareRenderer(this.driver)
      if (softwareRenderer && this.driver.shadowMap)
        this.driver.shadowMap.enabled = false
      this.pixelRatio = Math.min(
        options.resolution ?? globalThis.devicePixelRatio ?? 1,
        2
      )
      this.driver.setPixelRatio(this.pixelRatio)
      if (this.options.bloom !== undefined) {
        this.bloom = new EmissiveBloom(
          requireBloomRenderer(this.driver),
          readSpatialBloom(this.options.bloom)
        )
      }
      this.driver.setClearColor(options.backgroundColor ?? 0x101b29, 1)
      this.resize(options.width, options.height)
      this.root = this.create('container', {})
      this.scene.add(new THREE.HemisphereLight(...lighting.hemisphere))
      const key = new THREE.DirectionalLight(
        lighting.keyColor ?? 0xffffff,
        lighting.keyIntensity ?? 2.6
      )
      key.position.set(...lighting.keyPosition)
      key.castShadow = !softwareRenderer && (lighting.castShadows ?? true)
      key.shadow.mapSize.set(1024, 1024)
      Object.assign(key.shadow.camera, {
        left: -lighting.shadowExtent,
        right: lighting.shadowExtent,
        top: lighting.shadowExtent,
        bottom: -lighting.shadowExtent,
        near: 0.1,
        far: lighting.shadowFar
      })
      // Scale receiver offset to the world-space PCF footprint, not a fixed scene unit.
      key.shadow.normalBias =
        (2 * lighting.shadowExtent * 1.5) / key.shadow.mapSize.x
      key.shadow.bias = -0.0001
      this.scene.add(key)
      const fill = new THREE.DirectionalLight(
        lighting.fillColor ?? 0xffffff,
        lighting.fillIntensity ?? 1.2
      )
      fill.position.set(...lighting.fillPosition)
      this.scene.add(fill)
      this.attachPointerListeners(this.driver.domElement)
      return {
        surface: this.driver.domElement,
        inputTarget: this.driver.domElement,
        runtime: Object.freeze({ name: this.name }),
        root: this.root.handle
      }
    } catch (error) {
      this.destroy()
      throw error
    }
  }

  execute(command: RenderEngineCommand): RenderEngineCommandResult {
    this.assertActive()
    let object: RenderEngineObjectHandle | undefined
    let resource: RenderEngineResourceHandle | undefined
    let status: 'applied' | 'noop' = 'applied'
    switch (command.type) {
      case 'create-object':
        object = this.create(
          command.objectType,
          command.properties ?? {}
        ).handle
        break
      case 'update-object':
        this.update(this.owned(command.object), command.properties)
        break
      case 'destroy-object':
        this.remove(this.owned(command.object))
        break
      case 'append-child': {
        const parent = this.owned(command.parent),
          child = this.owned(command.child)
        for (
          let current: ObjectRecord | null = parent;
          current;
          current = current.parent
        ) {
          if (current === child) throw new Error('Render hierarchy cycle')
        }
        if (child === this.root)
          throw new Error('Cannot reparent the engine root')
        this.detach(child)
        child.parent = parent
        parent.children.push(child)
        break
      }
      case 'remove-child': {
        const parent = this.owned(command.parent),
          child = this.owned(command.child)
        if (child.parent === parent) this.detach(child)
        else status = 'noop'
        break
      }
      case 'set-child-index': {
        const parent = this.owned(command.parent),
          child = this.owned(command.child)
        if (
          child.parent !== parent ||
          !Number.isInteger(command.index) ||
          command.index < 0 ||
          command.index >= parent.children.length
        )
          throw new Error('Invalid child index')
        parent.children.splice(parent.children.indexOf(child), 1)
        parent.children.splice(command.index, 0, child)
        break
      }
      case 'draw': {
        const record = this.owned(command.object)
        if (record.type !== 'graphics')
          throw new Error('Draw requires a graphics object')
        const content = drawGraphics(command.operations, (paint) =>
          this.paint(paint)
        )
        this.replaceContent(record, content)
        break
      }
      case 'create-resource': {
        if (command.descriptor.kind !== 'paint')
          throw new Error('Unsupported resource descriptor')
        const value = command.descriptor.data as RenderEnginePaint
        const paint = this.paint(value)
        resource = Object.freeze({}) as RenderEngineResourceHandle
        this.resources.set(resource, paint)
        break
      }
      case 'destroy-resource':
        if (!this.resources.delete(command.resource))
          throw new Error('Foreign or destroyed resource handle')
        break
      case 'resize':
        this.resize(command.width, command.height)
        break
      case 'set-viewport':
        if (
          ![
            command.position.x,
            command.position.y,
            command.scale.x,
            command.scale.y
          ].every(Number.isFinite)
        )
          throw new Error('Invalid screen viewport')
        this.screen.position.set(command.position.x, command.position.y, 0)
        this.screen.scale.set(command.scale.x, command.scale.y, 1)
        break
      case 'flush': {
        const draw = createShadowFrame(this.requireDriver())
        this.syncProjection()
        this.updateInstanceDetail()
        const driver = this.requireDriver()
        const width = Math.max(1, Math.round(this.width * this.pixelRatio))
        const height = Math.max(1, Math.round(this.height * this.pixelRatio))
        this.transmissionCapture.render(
          driver as THREE.WebGLRenderer,
          this.scene,
          this.camera,
          width,
          height,
          draw,
          () => {
            driver.clear()
            draw(this.scene, this.camera)
          }
        )
        this.bloom?.render(this.scene, this.camera)
        this.requireDriver().clearDepth()
        this.requireDriver().render(this.screen, this.screenCamera)
        break
      }
    }
    return { commandType: command.type, status, object, resource }
  }

  query(query: RenderEngineQuery): RenderEngineQueryResult {
    this.assertActive()
    if (query.type === 'measure-text')
      throw new UnsupportedRenderEngineCapabilityError(this.name, [
        RenderEngineCapabilities.TEXT_MEASUREMENT
      ])
    if (query.type === 'snapshot')
      throw new UnsupportedRenderEngineCapabilityError(this.name, [
        RenderEngineCapabilities.SNAPSHOT
      ])
    if (query.type === 'get-local-content-bounds')
      throw new UnsupportedRenderEngineCapabilityError(this.name, [
        RenderEngineCapabilities.LOCAL_CONTENT_BOUNDS
      ])
    this.syncProjection()
    if (isSpatialQuery(query)) return this.spatialQuery(query)
    if (query.type === 'hit-test')
      return { type: 'hit', target: this.pick(query.point), point: query.point }
    const record = this.owned(query.object)
    if (query.type === 'get-bounds') {
      const bounds = new THREE.Box3().setFromObject(record.visual)
      if (bounds.isEmpty())
        return { type: 'bounds', bounds: { x: 0, y: 0, width: 0, height: 0 } }
      const points: THREE.Vector3[] = []
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z])
            points.push(new THREE.Vector3(x, y, z))
      if (record.spatial)
        points.forEach((p) => {
          p.project(this.camera)
          p.set(((p.x + 1) * this.width) / 2, ((1 - p.y) * this.height) / 2, 0)
        })
      const minX = Math.min(...points.map((p) => p.x)),
        minY = Math.min(...points.map((p) => p.y))
      return {
        type: 'bounds',
        bounds: {
          x: minX,
          y: minY,
          width: Math.max(...points.map((p) => p.x)) - minX,
          height: Math.max(...points.map((p) => p.y)) - minY
        }
      }
    }
    if (record.spatial)
      throw new Error(
        'Spatial local/global conversion requires an explicit 3D contract; screen queries are not 3D poses'
      )
    const point = new THREE.Vector3(query.point.x, query.point.y, 0)
    if (query.type === 'to-local') record.visual.worldToLocal(point)
    else record.visual.localToWorld(point)
    return { type: 'point', point: { x: point.x, y: point.y } }
  }

  subscribeToInteraction(
    listener: RenderEngineInteractionListener
  ): () => void {
    if (this.destroyed) throw new Error('Engine is not active')
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  dispatchInteraction(event: RenderEngineInteractionEvent): void {
    this.assertActive()
    if (event.target) this.owned(event.target)
    for (const listener of [...this.listeners]) listener(event)
  }

  requestFrame(callback: RenderEngineFrameCallback): void {
    this.assertActive()
    this.cancelFrame()
    const request =
      this.platform.requestFrame ??
      globalThis.requestAnimationFrame.bind(globalThis)
    const generation = ++this.frameGeneration
    this.frame = request((time) => {
      if (this.destroyed || generation !== this.frameGeneration) return
      this.frame = null
      this.frameGeneration++
      callback(time)
    })
  }

  cancelFrame(): void {
    this.frameGeneration++
    if (this.frame === null) return
    const cancel =
      this.platform.cancelFrame ??
      globalThis.cancelAnimationFrame.bind(globalThis)
    cancel(this.frame)
    this.frame = null
  }

  destroy(): RenderEngineDestroyResult {
    if (this.destroyed)
      return {
        destroyedObjects: 0,
        destroyedResources: 0,
        alreadyDestroyed: true
      }
    this.cancelFrame()
    const result = {
      destroyedObjects: this.objects.size,
      destroyedResources: this.resources.size,
      alreadyDestroyed: false
    }
    this.destroyed = true
    this.pointerDisposers.splice(0).forEach((dispose) => dispose())
    this.listeners.clear()
    for (const record of this.objects.values()) disposeObject(record.visual)
    this.objects.clear()
    this.resources.clear()
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) object.dispose()
    })
    this.scene.clear()
    this.screen.clear()
    this.reflections.dispose()
    this.transmissionCapture.dispose()
    this.bloom?.dispose()
    this.bloom = undefined
    this.driver?.dispose()
    this.driver = null
    this.root = null
    return result
  }

  private assertActive(): void {
    if (this.destroyed || !this.driver) throw new Error('Engine is not active')
  }
  private requireDriver(): GraphicsDriver {
    this.assertActive()
    if (!this.driver) throw new Error('Engine driver is unavailable')
    return this.driver
  }
  private owned(handle: RenderEngineObjectHandle): ObjectRecord {
    const record = this.objects.get(handle)
    if (!record) throw new Error('Foreign or destroyed object handle')
    return record
  }
  private create(
    type: ObjectRecord['type'],
    properties: RenderEngineObjectProperties
  ): ObjectRecord {
    const record: ObjectRecord = {
      handle: Object.freeze({}) as RenderEngineObjectHandle,
      type,
      properties: {},
      visual: new THREE.Group(),
      content: null,
      parent: null,
      children: []
    }
    try {
      this.update(record, properties)
    } catch (error) {
      disposeObject(record.visual)
      throw error
    }
    this.objects.set(record.handle, record)
    return record
  }
  private update(
    record: ObjectRecord,
    patch: RenderEngineObjectProperties
  ): void {
    const properties = { ...record.properties, ...patch }
    for (const key of Object.keys(properties))
      if (!SCREEN_PROPERTIES.has(key))
        throw new Error(`Unsupported screen property: ${key}`)
    if (
      numberProperty(properties, 'skewX', 0) !== 0 ||
      numberProperty(properties, 'skewY', 0) !== 0 ||
      numberProperty(properties, 'alpha', 1) !== 1
    )
      throw new Error(
        'Unsupported screen skew or alpha; use spatial appearance for 3D meshes'
      )
    const spatial =
      properties[SPATIAL_PROPERTY] === undefined
        ? undefined
        : (this.options.readDescriptor ?? readSpatialDescriptor)(
            properties[SPATIAL_PROPERTY]
          )
    if (spatial?.kind === 'camera' && record.type !== 'container')
      throw new Error('Camera requires a spatial container')
    if (spatial?.kind === 'mesh' && record.type !== 'mesh')
      throw new Error('Spatial geometry requires a mesh')
    if (record.type === 'mesh' && spatial?.kind !== 'mesh')
      throw new Error('CUSTOM meshes require an explicit spatial descriptor')
    const x = numberProperty(properties, 'x', 0),
      y = numberProperty(properties, 'y', 0)
    const sx = numberProperty(properties, 'scaleX', 1),
      sy = numberProperty(properties, 'scaleY', 1)
    const rotation = numberProperty(properties, 'rotation', 0)
    const order = numberProperty(properties, 'zIndex', 0)
    let content: THREE.Object3D | null = null
    const previous = record.spatial
    const reusable =
      spatial?.kind === 'mesh' &&
      previous?.kind === 'mesh' &&
      record.content instanceof THREE.Mesh &&
      sameSpatialShape(previous.shape, spatial.shape) &&
      previous.surface === spatial.surface &&
      Boolean(previous.distant) === Boolean(spatial.distant) &&
      (!previous.distant ||
        !spatial.distant ||
        sameSpatialShape(previous.distant.shape, spatial.distant.shape))
    if (
      reusable &&
      spatial?.kind === 'mesh' &&
      previous?.kind === 'mesh' &&
      record.content instanceof THREE.Mesh &&
      (Boolean(previous.instances) !== Boolean(spatial.instances) ||
        previous.instances?.length !== spatial.instances?.length)
    ) {
      const old = record.content
      content = spatial.instances
        ? new THREE.InstancedMesh(
            old.geometry,
            old.material,
            spatial.instances.length
          )
        : new THREE.Mesh(old.geometry, old.material)
      if (spatial.distant && spatial.instances) {
        const source = old.children[0]
        if (!(source instanceof THREE.InstancedMesh))
          throw new Error('Missing instance detail geometry')
        const distant = new THREE.InstancedMesh(
          source.geometry,
          source.material,
          spatial.instances.length
        )
        content.frustumCulled = false
        distant.frustumCulled = false
        content.add(distant)
      }
      // Geometry/material ownership transfers; retire only superseded instance buffers.
      old.traverse((child) => {
        if (child instanceof THREE.InstancedMesh) child.dispose()
      })
      old.clear()
      old.removeFromParent()
      record.content = null
    }
    if (
      !content &&
      spatial?.kind === 'mesh' &&
      Object.prototype.hasOwnProperty.call(patch, SPATIAL_PROPERTY) &&
      !reusable
    ) {
      const geometry = makeGeometry(spatial.shape)
      const material = new THREE.MeshPhysicalMaterial({
        color: spatial.color,
        vertexColors:
          spatial.shape.kind === 'triangles' && Boolean(spatial.shape.colors),
        opacity: spatial.opacity,
        transparent: spatial.opacity < 1,
        wireframe: spatial.wireframe,
        side: THREE.DoubleSide,
        roughness: spatial.roughness ?? 0.65,
        metalness: spatial.metalness ?? 0.12,
        emissive: spatial.emissive ?? 0,
        emissiveIntensity: spatial.emissiveIntensity ?? 0,
        depthWrite: spatial.opacity >= 1
      })
      this.reflections.apply(
        material,
        spatial.environmentIntensity ?? 0,
        this.requireDriver()
      )
      if (spatial.surface) this.surfaceTextures.apply(material, spatial.surface)
      content = spatial.instances
        ? new THREE.InstancedMesh(geometry, material, spatial.instances.length)
        : new THREE.Mesh(geometry, material)
      if (spatial.distant && spatial.instances) {
        const distant = new THREE.InstancedMesh(
          makeGeometry(spatial.distant.shape),
          material.clone(),
          spatial.instances.length
        )
        distant.frustumCulled = false
        content.frustumCulled = false
        content.add(distant)
        geometry.computeBoundingSphere()
      }
    }
    const previousInstances =
      record.spatial?.kind === 'mesh' ? record.spatial.instances : undefined
    record.properties = properties
    record.spatial = spatial
    if (content) this.replaceContent(record, content)
    if (spatial?.kind === 'mesh') {
      if (
        record.content instanceof THREE.InstancedMesh &&
        spatial.instances &&
        !spatial.distant &&
        (content || previousInstances !== spatial.instances)
      ) {
        const matrix = new THREE.Matrix4()
        const translation = new THREE.Vector3()
        const rotation = new THREE.Quaternion()
        const scale = new THREE.Vector3(1, 1, 1)
        spatial.instances.forEach((instance, index) => {
          matrix.compose(
            translation.fromArray(instance.position),
            rotation.fromArray(instance.rotation),
            scale.fromArray(instance.scale ?? [1, 1, 1])
          )
          ;(record.content as THREE.InstancedMesh).setMatrixAt(index, matrix)
        })
        record.content.instanceMatrix.needsUpdate = true
        record.content.computeBoundingBox()
        record.content.computeBoundingSphere()
      }
      if (record.content instanceof THREE.Mesh) {
        record.content.castShadow = spatial.castShadow ?? false
        record.content.receiveShadow = spatial.receiveShadow ?? false
        const material = record.content.material as THREE.MeshPhysicalMaterial
        const transparent = spatial.opacity < 1
        if (
          material.transparent !== transparent ||
          material.wireframe !== spatial.wireframe
        )
          material.needsUpdate = true
        material.color.setHex(spatial.color)
        material.opacity = spatial.opacity
        material.transparent = transparent
        material.depthWrite = !transparent
        material.wireframe = spatial.wireframe
        material.roughness = spatial.roughness ?? 0.65
        material.metalness = spatial.metalness ?? 0.12
        const optics = spatial.optics
        const side = optics ? THREE.FrontSide : THREE.DoubleSide
        if (material.side !== side) material.needsUpdate = true
        material.side = side
        material.transmission = optics?.transmission ?? 0
        this.transmissionCapture.apply(material, optics?.captureLayer)
        material.ior = optics?.ior ?? 1.5
        material.thickness = optics?.thickness ?? 0
        material.attenuationColor.setHex(optics?.attenuationColor ?? 0xffffff)
        material.attenuationDistance = optics?.attenuationDistance ?? Infinity
        this.reflections.apply(
          material,
          spatial.environmentIntensity ?? 0,
          this.requireDriver()
        )
        material.emissive.setHex(spatial.emissive ?? 0)
        material.emissiveIntensity = spatial.emissiveIntensity ?? 0
        for (const child of record.content.children)
          if (child instanceof THREE.InstancedMesh) {
            ;(child.material as THREE.MeshPhysicalMaterial).copy(material)
            this.transmissionCapture.apply(
              child.material as THREE.MeshPhysicalMaterial,
              optics?.captureLayer
            )
            child.receiveShadow = record.content.receiveShadow
            child.castShadow = record.content.castShadow
          }
      }
      record.visual.position.fromArray(spatial.position)
      record.visual.quaternion.fromArray(spatial.rotation)
      record.visual.scale.fromArray(spatial.scale ?? [1, 1, 1])
    } else {
      record.visual.position.set(x, y, 0)
      record.visual.rotation.set(0, 0, rotation)
      record.visual.scale.set(sx, sy, 1)
    }
    record.visual.renderOrder = order
  }
  /** Completed geometry is reused; only visible instance matrices change per frame. */
  private updateInstanceDetail(): void {
    this.scene.updateMatrixWorld(true)
    this.camera.updateMatrixWorld(true)
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
    )
    const pixelsPerUnit =
      (this.height *
        this.pixelRatio *
        Math.abs(this.camera.projectionMatrix.elements[5])) /
      2
    const matrix = new THREE.Matrix4(),
      world = new THREE.Matrix4(),
      center = new THREE.Vector3(),
      sphere = new THREE.Sphere()
    for (const record of this.objects.values()) {
      const spatial = record.spatial,
        full = record.content
      if (
        spatial?.kind !== 'mesh' ||
        !spatial.distant ||
        !spatial.instances ||
        !(full instanceof THREE.InstancedMesh) ||
        !record.visual.visible
      )
        continue
      const distant = full.children[0]
      if (
        !(distant instanceof THREE.InstancedMesh) ||
        !full.geometry.boundingSphere
      )
        throw new Error('Missing instance detail geometry')
      const previous = this.instanceDetail.get(full)
      if (
        previous &&
        previous.instances === spatial.instances &&
        previous.geometry === full.geometry &&
        previous.height === this.height &&
        previous.pixelRatio === this.pixelRatio &&
        previous.pixelError === (spatial.distant.pixelError ?? 2) &&
        previous.error === spatial.distant.maxError &&
        previous.world.equals(record.visual.matrixWorld) &&
        previous.view.equals(this.camera.matrixWorldInverse) &&
        previous.projection.equals(this.camera.projectionMatrix)
      )
        continue
      let fullCount = 0,
        distantCount = 0
      for (const instance of spatial.instances) {
        matrix.compose(
          new THREE.Vector3(...instance.position),
          new THREE.Quaternion(...instance.rotation),
          new THREE.Vector3(...(instance.scale ?? [1, 1, 1]))
        )
        world.multiplyMatrices(record.visual.matrixWorld, matrix)
        sphere.copy(full.geometry.boundingSphere).applyMatrix4(world)
        if (!frustum.intersectsSphere(sphere)) continue
        center.copy(sphere.center).applyMatrix4(this.camera.matrixWorldInverse)
        const nearestDepth = Math.max(0.001, -center.z - sphere.radius)
        const errorPixels =
          (spatial.distant.maxError *
            world.getMaxScaleOnAxis() *
            pixelsPerUnit) /
          nearestDepth
        if (errorPixels <= (spatial.distant.pixelError ?? 2))
          distant.setMatrixAt(distantCount++, matrix)
        else full.setMatrixAt(fullCount++, matrix)
      }
      full.count = fullCount
      distant.count = distantCount
      full.instanceMatrix.needsUpdate = true
      distant.instanceMatrix.needsUpdate = true
      this.instanceDetail.set(full, {
        instances: spatial.instances,
        geometry: full.geometry,
        height: this.height,
        pixelRatio: this.pixelRatio,
        pixelError: spatial.distant.pixelError ?? 2,
        error: spatial.distant.maxError,
        world: record.visual.matrixWorld.clone(),
        view: this.camera.matrixWorldInverse.clone(),
        projection: this.camera.projectionMatrix.clone()
      })
    }
  }

  private replaceContent(record: ObjectRecord, content: THREE.Object3D): void {
    if (record.content) disposeObject(record.content)
    record.content = content
    record.visual.add(content)
  }
  private detach(record: ObjectRecord): void {
    if (record.parent)
      record.parent.children.splice(record.parent.children.indexOf(record), 1)
    record.parent = null
    record.visual.removeFromParent()
  }
  private remove(record: ObjectRecord): void {
    if (record === this.root)
      throw new Error('Use destroy to release the engine root')
    this.detach(record)
    for (const child of [...record.children]) this.detach(child)
    disposeObject(record.visual)
    this.objects.delete(record.handle)
  }
  private validateSize(width: number, height: number): void {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0 ||
      width > 16384 ||
      height > 16384
    )
      throw new Error('Invalid surface size')
  }
  private resize(width: number, height: number): void {
    this.validateSize(width, height)
    this.width = width
    this.height = height
    this.requireDriver().setSize(width, height)
    this.bloom?.setSize(width, height, this.pixelRatio)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.screenCamera.right = width
    this.screenCamera.bottom = height
    this.screenCamera.updateProjectionMatrix()
  }
  private syncProjection(): void {
    let cameraCount = 0
    const walk = (
      record: ObjectRecord,
      visible: boolean,
      screenParent: THREE.Object3D
    ) => {
      const shown =
        visible &&
        record.properties.visible !== false &&
        record.properties.renderable !== false
      record.visual.visible = shown
      if (record.spatial) {
        this.scene.add(record.visual)
        if (record.spatial.kind === 'camera' && shown) {
          if (++cameraCount > 1)
            throw new Error('Only one active spatial camera is supported')
          const camera = record.spatial
          this.camera.position.fromArray(camera.position)
          this.camera.lookAt(...camera.target)
          this.camera.fov = camera.fov
          this.camera.near = camera.near
          this.camera.far = camera.far
          this.camera.updateProjectionMatrix()
        }
      } else screenParent.add(record.visual)
      record.children.forEach((child) =>
        walk(child, shown, record.spatial ? screenParent : record.visual)
      )
    }
    for (const record of this.objects.values()) record.visual.removeFromParent()
    if (this.root) walk(this.root, true, this.screen)
    this.scene.updateMatrixWorld(true)
    this.screen.updateMatrixWorld(true)
    this.camera.updateMatrixWorld(true)
    this.screenCamera.updateMatrixWorld(true)
  }
  private pickScreen(
    point: RenderEnginePoint
  ): RenderEngineObjectHandle | null {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
      throw new Error('Invalid screen point')
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x >= this.width ||
      point.y >= this.height
    )
      return null
    const ray = new THREE.Raycaster()
    const screenPoint = new THREE.Vector2(
      (point.x / this.width) * 2 - 1,
      1 - (point.y / this.height) * 2
    )
    ray.setFromCamera(screenPoint, this.screenCamera)
    const screenRecords = [...this.objects.values()].filter(
      (record) =>
        !record.spatial &&
        record.type === 'graphics' &&
        record.visual.visible &&
        record.visual.parent !== null &&
        record.properties.eventMode !== 'none'
    )
    const screenHits = ray.intersectObjects(
      screenRecords.map((record) => record.visual),
      true
    )
    for (const intersection of screenHits) {
      for (
        let visual: THREE.Object3D | null = intersection.object;
        visual;
        visual = visual.parent
      ) {
        const record = screenRecords.find((item) => item.visual === visual)
        if (record) return record.handle
      }
    }
    return null
  }
  private pick(point: RenderEnginePoint): RenderEngineObjectHandle | null {
    const result = this.spatialQuery({ type: 'spatial-pick', point })
    if (result.type !== 'spatial-pick')
      throw new Error('Invalid picking result')
    return result.overlay ?? result.hit?.object ?? null
  }

  private vector(value: THREE.Vector3): SpatialVector {
    return [value.x, value.y, value.z]
  }
  private point(value: SpatialVector): THREE.Vector3 {
    if (
      !Array.isArray(value) ||
      value.length !== 3 ||
      !value.every(Number.isFinite)
    )
      throw new Error('Invalid spatial point')
    return new THREE.Vector3(...value)
  }
  private spatialRecords(): ObjectRecord[] {
    const records: ObjectRecord[] = []
    const visit = (record: ObjectRecord) => {
      records.push(record)
      record.children.forEach(visit)
    }
    if (this.root) visit(this.root)
    return records
  }
  private spatialObject(handle: RenderEngineObjectHandle): ObjectRecord {
    const record = this.owned(handle)
    if (!this.spatialRecords().includes(record))
      throw new Error('Detached spatial object')
    return record
  }
  private spatialMatrix(
    record: ObjectRecord,
    index: number | undefined,
    world: boolean
  ): THREE.Matrix4 {
    const matrix = world
      ? record.visual.matrixWorld.clone()
      : new THREE.Matrix4()
    if (index !== undefined) {
      const instances =
        record.spatial?.kind === 'mesh' ? record.spatial.instances : undefined
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        !instances ||
        index >= instances.length
      )
        throw new Error('Invalid source instance index')
      const instance = instances[index]
      matrix.multiply(
        new THREE.Matrix4().compose(
          new THREE.Vector3(...instance.position),
          new THREE.Quaternion(...instance.rotation),
          new THREE.Vector3(...(instance.scale ?? [1, 1, 1]))
        )
      )
    }
    return matrix
  }
  private spatialQuery(
    query: RenderEngineSpatialQuery
  ): RenderEngineSpatialResult {
    if (query.type === 'spatial-pick') {
      const ray = this.spatialQuery({ type: 'spatial-ray', point: query.point })
      if (ray.type !== 'spatial-ray')
        throw new Error('Invalid screen ray result')
      if (!ray.ray) return { type: 'spatial-pick', overlay: null, hit: null }
      const overlay = this.pickScreen(query.point)
      return {
        type: 'spatial-pick',
        overlay,
        hit: overlay ? null : (this.spatialHits(ray.ray)[0] ?? null)
      }
    }
    if (query.type === 'spatial-project') {
      const point = this.point(query.point)
      const clip = new THREE.Vector4(point.x, point.y, point.z, 1)
        .applyMatrix4(this.camera.matrixWorldInverse)
        .applyMatrix4(this.camera.projectionMatrix)
      if (clip.w === 0)
        return {
          type: 'spatial-projection',
          point: null,
          depth: null,
          inFrustum: false
        }
      const x = clip.x / clip.w,
        y = clip.y / clip.w,
        z = clip.z / clip.w
      if (![x, y, z].every(Number.isFinite))
        throw new Error('Nonfinite spatial projection')
      return {
        type: 'spatial-projection',
        point: {
          x: ((x + 1) * this.width) / 2,
          y: ((1 - y) * this.height) / 2
        },
        depth: z,
        inFrustum:
          clip.w > 0 && Math.abs(x) <= 1 && Math.abs(y) <= 1 && Math.abs(z) <= 1
      }
    }
    if (query.type === 'spatial-ray') {
      const { x, y } = query.point
      if (![x, y].every(Number.isFinite))
        throw new Error('Invalid surface point')
      if (x < 0 || y < 0 || x >= this.width || y >= this.height)
        return { type: 'spatial-ray', ray: null }
      const ray = new THREE.Raycaster()
      ray.setFromCamera(
        new THREE.Vector2((x / this.width) * 2 - 1, 1 - (y / this.height) * 2),
        this.camera
      )
      return {
        type: 'spatial-ray',
        ray: {
          origin: this.vector(ray.ray.origin),
          direction: this.vector(ray.ray.direction)
        }
      }
    }
    if (query.type === 'spatial-raycast')
      return { type: 'spatial-hits', hits: this.spatialHits(query.ray) }
    const record = this.spatialObject(query.object)
    if (query.type === 'spatial-convert') {
      if (
        record.spatial?.kind !== 'mesh' ||
        !['local', 'world'].includes(query.to)
      )
        throw new Error('Invalid spatial conversion')
      const matrix = this.spatialMatrix(record, query.instanceIndex, true)
      if (query.to === 'local') matrix.invert()
      return {
        type: 'spatial-point',
        point: this.vector(this.point(query.point).applyMatrix4(matrix))
      }
    }
    if (!['local', 'world'].includes(query.space))
      throw new Error('Invalid bounds space')
    if (query.instanceIndex !== undefined)
      this.spatialMatrix(record, query.instanceIndex, false)
    if (
      record.spatial?.kind !== 'mesh' ||
      !(record.content instanceof THREE.Mesh)
    )
      return { type: 'spatial-bounds', bounds: null }
    const geometry = record.content.geometry
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    const local = geometry.boundingBox
    if (!local || local.isEmpty())
      return { type: 'spatial-bounds', bounds: null }
    const result = new THREE.Box3()
    let indices: (number | undefined)[] = [undefined]
    if (query.instanceIndex !== undefined) indices = [query.instanceIndex]
    else if (record.spatial.instances)
      indices = record.spatial.instances.map((_, index) => index)
    for (const index of indices)
      result.union(
        local
          .clone()
          .applyMatrix4(
            this.spatialMatrix(record, index, query.space === 'world')
          )
      )
    return {
      type: 'spatial-bounds',
      bounds: { min: this.vector(result.min), max: this.vector(result.max) }
    }
  }
  private spatialHits(input: SpatialRay): RenderEngineSpatialHit[] {
    const origin = this.point(input.origin),
      direction = this.point(input.direction)
    const length = direction.length()
    if (!Number.isFinite(length) || length === 0)
      throw new Error('Invalid spatial ray direction')
    direction.divideScalar(length)
    const ray = new THREE.Raycaster(origin, direction),
      hits: RenderEngineSpatialHit[] = []
    for (const record of this.spatialRecords()) {
      const spatial = record.spatial,
        content = record.content
      if (
        spatial?.kind !== 'mesh' ||
        !spatial.selectable ||
        !record.visual.visible ||
        record.visual.parent !== this.scene ||
        !(content instanceof THREE.Mesh)
      )
        continue
      // Borrow the owned full geometry/material. No GPU resource or LoD slot is created.
      const mesh = new THREE.Mesh(content.geometry, content.material)
      const indices = spatial.instances
        ? spatial.instances.map((_, index) => index)
        : [undefined]
      for (const index of indices) {
        mesh.matrixWorld.copy(this.spatialMatrix(record, index, true))
        const intersections: THREE.Intersection[] = []
        mesh.raycast(ray, intersections)
        intersections.sort((a, b) => a.distance - b.distance)
        const hit = intersections[0]
        if (!hit) continue
        hits.push({
          object: record.handle,
          ...(index === undefined
            ? {}
            : {
                instanceIndex: index,
                ...(spatial.instances?.[index].id === undefined
                  ? {}
                  : { instanceId: spatial.instances[index].id })
              }),
          distance: hit.distance,
          point: this.vector(hit.point)
        })
      }
    }
    return hits.sort((a, b) => a.distance - b.distance)
  }

  private paint(paint: RenderEnginePaint): {
    color: number | string
    alpha: number
  } {
    if (!paint || typeof paint !== 'object') throw new Error('Invalid paint')
    let base = { color: paint.color ?? 0xffffff, alpha: paint.alpha ?? 1 }
    if (paint.resource) {
      const stored = this.resources.get(paint.resource)
      if (!stored) throw new Error('Foreign or destroyed resource handle')
      base = { color: stored.color, alpha: paint.alpha ?? stored.alpha }
    }
    if (!Number.isFinite(base.alpha) || base.alpha < 0 || base.alpha > 1)
      throw new Error('Invalid paint opacity')
    return base
  }
  private attachPointerListeners(canvas: HTMLCanvasElement): void {
    const types = [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel',
      'pointerover',
      'pointerout'
    ] as const
    for (const type of types) {
      const handler = (event: Event) => {
        if (this.destroyed) return
        const pointer = event as PointerEvent,
          rect = canvas.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        const position = {
          x: ((pointer.clientX - rect.left) * this.width) / rect.width,
          y: ((pointer.clientY - rect.top) * this.height) / rect.height
        }
        const result = this.query({ type: 'hit-test', point: position })
        this.dispatchInteraction({
          type,
          pointerId: pointer.pointerId ?? 0,
          button: pointer.button,
          buttons: pointer.buttons,
          position,
          modifiers: {
            altKey: pointer.altKey,
            ctrlKey: pointer.ctrlKey,
            metaKey: pointer.metaKey,
            shiftKey: pointer.shiftKey
          },
          target: result.type === 'hit' ? result.target : null,
          timestamp: event.timeStamp
        })
      }
      canvas.addEventListener(type, handler)
      this.pointerDisposers.push(() =>
        canvas.removeEventListener(type, handler)
      )
    }
  }
}
