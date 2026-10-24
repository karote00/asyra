import type {
  ComponentDefinition,
  PropertyComponentDefinition
} from '@asyra/core'
import { RenderMesh, type EngineNeutralRenderStrategy } from '@asyra/render'
import type { PropertySchema } from '@asyra/utils'
import { SPATIAL_PROPERTY, readSpatialDescriptor } from './spatial-contract.js'
import type { SpatialMesh } from './spatial-layer.js'

export const SPATIAL_MESH_COMPONENT = 'spatial-mesh'
export const SPATIAL_MESH_PROPERTY = 'spatial-mesh-data'
export const SPATIAL_MODEL_REGISTRATION = Object.freeze({
  owner: Object.freeze({ packageName: '@asyra/preset', name: 'spatial-model' })
})
const descriptor = readSpatialDescriptor({
  kind: 'mesh',
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  shape: { kind: 'box', size: [1, 1, 1] },
  color: 0xffffff,
  opacity: 1,
  wireframe: false,
  selectable: true
}) as SpatialMesh
export const SPATIAL_MESH_SCHEMA: PropertySchema = {
  type: SPATIAL_MESH_PROPERTY,
  fields: [
    {
      key: 'descriptor',
      kind: 'object',
      defaultValue: descriptor,
      validate(value) {
        try {
          return readSpatialDescriptor(value).kind === 'mesh'
        } catch {
          return false
        }
      }
    },
    {
      key: 'visible',
      kind: 'boolean',
      defaultValue: true,
      validate: (value) => typeof value === 'boolean'
    }
  ]
}
export const SPATIAL_MESH_PROPERTY_DEFINITION: PropertyComponentDefinition = {
  type: SPATIAL_MESH_PROPERTY,
  registration: SPATIAL_MODEL_REGISTRATION,
  defaults: { descriptor, visible: true }
}
export const SPATIAL_MESH_COMPONENT_DEFINITION: ComponentDefinition = {
  type: SPATIAL_MESH_COMPONENT,
  idPrefix: 'mesh',
  namePrefix: 'Mesh',
  registration: SPATIAL_MODEL_REGISTRATION,
  properties: [
    {
      name: 'spatial',
      type: SPATIAL_MESH_PROPERTY,
      alias: ['descriptor', 'visible']
    }
  ]
}
const meshes = new WeakMap<
  object,
  { mesh: RenderMesh; descriptor: SpatialMesh }
>()
export const SPATIAL_MESH_RENDER_STRATEGY: EngineNeutralRenderStrategy<{
  descriptor: SpatialMesh
  visible: boolean
}> = (graphic, data) => {
  const accepted = readSpatialDescriptor(data.descriptor)
  if (accepted.kind !== 'mesh' || typeof data.visible !== 'boolean')
    throw new Error('Invalid spatial mesh model')
  let state = meshes.get(graphic)
  if (!state) {
    const mesh = new RenderMesh({ [SPATIAL_PROPERTY]: accepted })
    mesh.projectionIdentity = { visualId: data.id, elementId: data.id }
    graphic.addChild(mesh)
    state = { mesh, descriptor: accepted }
    meshes.set(graphic, state)
  } else if (state.descriptor !== accepted) {
    state.mesh.update({ [SPATIAL_PROPERTY]: accepted })
    state.descriptor = accepted
  }
  graphic.visible = data.visible
}
Object.assign(SPATIAL_MESH_RENDER_STRATEGY, {
  directPropertyKeys: ['descriptor', 'visible']
})
