import type { SpatialDescriptor } from '@asyra/preset/spatial-contract'
import armchairPanels from './generated/armchair-panels.json'
import {
  bottleSurface,
  bottleContents,
  cutTrayGrooves,
  type TrayGrooves,
  type BottleRings
} from './pantry-details'
import { subtractSolid } from './solid-subtraction'
import { extrudeProfile } from './profile-extrusion'
import { upholsteredPanel, type UpholsteredPanel } from './upholstered-panel'
import { roundedTaper } from './rounded-turning'
import { recessPanel } from './recessed-panel'
import type { GeometryInstance } from './instances'
import furniture from '../../../../assets/asyra-office/models/furniture/furniture-model-spec.json'
import architecture from '../../../../assets/asyra-office/models/architecture/architecture-model-spec.json'
import pantry from '../../../../assets/asyra-office/models/pantry/pantry-model-spec.json'
import storage from '../../../../assets/asyra-office/models/storage/storage-model-spec.json'
import {
  append,
  bezier,
  box,
  cylinder,
  emptyMesh,
  tube,
  vec,
  type Mesh,
  type Vec
} from './geometry'

export type SurfaceKind =
  | 'plaster'
  | 'wood'
  | 'fabric'
  | 'metal'
  | 'ceramic'
  | 'leaf'
  | 'veined-leaf'
  | 'snake-leaf'
  | 'stone'
  | 'water'
  | 'plain'
  | 'porcelain-floral'
  | 'cork'
  | 'granulated'
  | 'ground-spice'
  | 'dried-herbs'
  | 'peppercorns'
export interface AssetPart {
  id: string
  mesh: Mesh
  color: number
  roughness: number
  metalness?: number
  environmentIntensity?: number
  emissive?: number
  emissiveIntensity?: number
  optics?: Extract<SpatialDescriptor, { kind: 'mesh' }>['optics']
  opacity?: number
  material: SurfaceKind
  instances?: GeometryInstance[]
  distant?: { mesh: Mesh; maxError: number }
  placement?: { position: Vec; rotation: number; scale: Vec }
}
type Component = Partial<UpholsteredPanel> & {
  partId: string
  profileVerticesXZMetres?: number[][]
  extrusionYMetres?: [number, number]
  primitive?: string
  shape?: string
  size?: number[]
  sizeMetres?: number[]
  centre?: number[]
  centreMetres?: number[]
  material: string
  radius?: number
  bevelMetres?: number
  edgeRadius?: number
  height?: number
  length?: number
  axis?: string
  bottomCentre?: number[]
  topCentre?: number[]
  bottomWidth?: number
  topWidth?: number
  rotationXDegrees?: number
  panelRecess?: {
    innerWidth: number
    innerHeight: number
    depth: number
    border: number
  }
  grooves?: TrayGrooves
  rings?: BottleRings
  profileZR?: number[][]
  sourcePartId?: string
  fillRatio?: number
  wallInsetMetres?: number
  centreXY?: number[]
  segments?: number[][][]
  subtract?: { size: number[]; centre: number[]; radius?: number }[]
}
interface Batch {
  materials: Record<
    string,
    { baseColorSRGB: string; roughness: number; alpha?: number }
  >
  modules: {
    moduleId: string
    components: Component[]
    normalizeBackAssembly?: {
      targetRearY: number
      targetTopZ: number
      parts: string[]
    }
    insetFields?: {
      owner: string
      centreXMetres: number
      outerWidthMetres: number
      borderWidthMetres: number
      recessMetres: number
      fields: { centreZMetres: number; outerHeightMetres: number }[]
    }
  }[]
}
const batches = [furniture, architecture, pantry, storage] as unknown as Batch[]
const materialKind = (name: string): SurfaceKind => {
  if (/oak|wood/.test(name)) return 'wood'
  if (/sage|orange/.test(name)) return 'fabric'
  if (/plaster|cap/.test(name)) return 'plaster'
  if (/iron|frame|grey/.test(name)) return 'metal'
  return 'plain'
}

/** Construct rounded source solids before evaluating the actual cavity. */
function carvedBox(
  size: Vec,
  cuts: { size: number[]; centre: number[]; radius?: number }[],
  centre: Vec,
  radius: number
): Mesh {
  let result = box(size, radius)
  for (const cut of cuts) {
    const cutter = emptyMesh()
    append(
      cutter,
      box(vec(cut.size), cut.radius ?? 0),
      vec(cut.centre.map((v, k) => v - centre[k]))
    )
    result = subtractSolid(result, cutter)
  }
  return result
}
function componentMesh(c: Component, components: Component[]): Mesh {
  const size = c.size ?? c.sizeMetres,
    centre = vec(c.centre ?? c.centreMetres ?? [0, 0, 0]),
    shape = c.primitive ?? c.shape
  let m: Mesh,
    position = centre
  if (c.profileVerticesXZMetres && c.extrusionYMetres) {
    m = extrudeProfile(
      c.profileVerticesXZMetres.map(([x, z]) => [z, x]),
      1,
      c.extrusionYMetres
    )
    position = [0, 0, 0]
  } else if (
    shape === 'rounded-box' ||
    shape === 'closed box' ||
    shape === 'box-union-input'
  )
    m = c.subtract
      ? carvedBox(
          vec(size ?? []),
          c.subtract,
          centre,
          c.radius ?? c.bevelMetres ?? 0
        )
      : box(vec(size ?? []), c.radius ?? c.bevelMetres ?? 0)
  else if (shape === 'cylinder' || shape === 'beveled-cylinder') {
    m =
      shape === 'beveled-cylinder' && c.edgeRadius
        ? roundedTaper(
            [0, 0, -(c.length ?? c.height ?? 0.01) / 2],
            [0, 0, (c.length ?? c.height ?? 0.01) / 2],
            c.radius ?? 0.01,
            c.radius ?? 0.01,
            c.edgeRadius
          )
        : cylinder(
            c.radius ?? 0.01,
            c.length ?? c.height ?? 0.01,
            c.radius ?? 0.01,
            48
          )
    const oriented = emptyMesh()
    append(
      oriented,
      m,
      [0, 0, 0],
      ({ X: [0, 90, 0], Y: [90, 0, 0] } as Record<string, Vec>)[
        c.axis ?? ''
      ] ?? [0, 0, 0]
    )
    m = oriented
  } else if (shape === 'tapered-square-leg') {
    const b = vec(c.bottomCentre ?? []),
      t = vec(c.topCentre ?? []),
      h = t[2] - b[2]
    m = box([c.topWidth ?? 0.03, c.topWidth ?? 0.03, h], c.radius ?? 0)
    position = [(t[0] + b[0]) / 2, (t[1] + b[1]) / 2, (t[2] + b[2]) / 2]
  } else if (shape === 'tapered-round-leg') {
    const b = vec(c.bottomCentre ?? []),
      t = vec(c.topCentre ?? [])
    m = roundedTaper(
      b,
      t,
      (c.bottomWidth ?? 0.03) / 2,
      (c.topWidth ?? 0.04) / 2,
      c.radius ?? 0.002
    )
    position = [0, 0, 0]
  } else if (shape === 'lathe-fill') {
    const source = components.find((part) => part.partId === c.sourcePartId)
    if (
      !source?.profileZR ||
      c.fillRatio === undefined ||
      c.wallInsetMetres === undefined
    )
      throw new Error(`Missing liquid cavity specification: ${c.partId}`)
    m = bottleContents(
      source.profileZR,
      source.rings,
      c.fillRatio,
      c.wallInsetMetres
    )
    position = [...(source.centreXY ?? [0, 0]), 0] as Vec
  } else if (shape === 'lathe') {
    m = bottleSurface(c.profileZR ?? [], c.rings)
    position = [...(c.centreXY ?? [0, 0]), 0] as Vec
  } else if (shape === 'upholstered-profile-panel') {
    m = upholsteredPanel(c as UpholsteredPanel)
    position = [0, 0, 0]
  } else if (shape === 'bezier-tube') {
    m = tube(
      (c.segments ?? []).flatMap((points, i) =>
        bezier(points.map(vec), 12).slice(i ? 1 : 0)
      ),
      c.radius ?? 0.01
    )
    position = [0, 0, 0]
  } else
    throw new Error(`Unsupported catalog component: ${c.partId} (${shape})`)
  const placed = emptyMesh()
  append(placed, m, position, [c.rotationXDegrees ?? 0, 0, 0])
  if (c.grooves)
    return cutTrayGrooves(placed, centre, vec(size ?? []), c.grooves)
  if (c.panelRecess) {
    if (!size) throw new Error('Door field requires source size')
    return recessPanel(placed, centre[1] - size[1] / 2, [
      {
        x: centre[0],
        z: centre[2],
        width: c.panelRecess.innerWidth,
        height: c.panelRecess.innerHeight,
        depth: c.panelRecess.depth,
        transition: 0.002
      }
    ])
  }
  return placed
}
export function catalogAsset(id: string): AssetPart[] {
  for (const batch of batches) {
    const module = batch.modules.find((m) => m.moduleId === id)
    if (!module) continue
    const back = module.normalizeBackAssembly
    const translation: Vec = [0, 0, 0]
    if (back) {
      const maxima = module.components
        .filter((c) => back.parts.includes(c.partId))
        .map((c) => {
          const size = c.size,
            centre = c.centre,
            r = c.radius
          if (!size || !centre || r === undefined)
            throw new Error('Back placement requires rounded dimensions')
          const angle = ((c.rotationXDegrees ?? 0) * Math.PI) / 180,
            cs = Math.abs(Math.cos(angle)),
            sn = Math.abs(Math.sin(angle))
          const hy = size[1] / 2 - r,
            hz = size[2] / 2 - r
          return [
            centre[1] + cs * hy + sn * hz + r,
            centre[2] + sn * hy + cs * hz + r
          ]
        })
      translation[1] = back.targetRearY - Math.max(...maxima.map((p) => p[0]))
      translation[2] = back.targetTopZ - Math.max(...maxima.map((p) => p[1]))
    }
    return module.components.map((c) => {
      const mat = batch.materials[c.material]
      if (!mat) throw new Error(`Missing material ${c.material}`)
      const prepared =
        id === 'lounge-armchair' &&
        (c.partId === 'left-arm' || c.partId === 'right-arm')
          ? armchairPanels.panels[c.partId]
          : undefined
      let mesh = prepared?.mesh ?? componentMesh(c, module.components)
      if (back?.parts.includes(c.partId))
        for (let i = 0; i < mesh.positions.length; i += 3)
          for (let k = 0; k < 3; k++) mesh.positions[i + k] += translation[k]
      if (module.insetFields?.owner === c.partId) {
        const inset = module.insetFields,
          size = c.size ?? c.sizeMetres,
          centre = c.centre ?? c.centreMetres
        if (!size || !centre)
          throw new Error('Inset owner requires size and centre')
        mesh = recessPanel(
          mesh,
          centre[1] - size[1] / 2,
          inset.fields.map((field) => ({
            x: inset.centreXMetres,
            z: field.centreZMetres,
            width: inset.outerWidthMetres - 2 * inset.borderWidthMetres,
            height: field.outerHeightMetres - 2 * inset.borderWidthMetres,
            depth: inset.recessMetres,
            transition: inset.recessMetres
          }))
        )
      }
      return {
        id: c.partId,
        mesh,
        color: parseInt(mat.baseColorSRGB.slice(1), 16),
        roughness: mat.roughness,
        ...(mat.alpha !== undefined && mat.alpha < 1
          ? { opacity: mat.alpha }
          : {}),
        material: materialKind(c.material),
        ...(prepared ? { distant: prepared.distant } : {})
      }
    })
  }
  throw new Error(`Unknown catalog asset: ${id}`)
}
export const part = (
  id: string,
  mesh: Mesh,
  color: number,
  material: SurfaceKind = 'plain',
  roughness = 0.85
): AssetPart => ({ id, mesh, color, material, roughness })
export function placeParts(
  parts: readonly AssetPart[],
  position: Vec,
  rotation = 0,
  scale: Vec = [1, 1, 1]
): AssetPart[] {
  if (scale.some((n) => !Number.isFinite(n) || n <= 0))
    throw new Error('Invalid assembly scale')
  return parts.map((p) => {
    if (p.instances) return { ...p, placement: { position, rotation, scale } }
    const mesh = emptyMesh()
    append(mesh, p.mesh, position, [0, 0, rotation], scale)
    let distant: AssetPart['distant']
    if (p.distant) {
      const reduced = emptyMesh()
      append(reduced, p.distant.mesh, position, [0, 0, rotation], scale)
      distant = {
        mesh: reduced,
        maxError: p.distant.maxError * Math.max(...scale)
      }
    }
    return { ...p, mesh, distant }
  })
}
