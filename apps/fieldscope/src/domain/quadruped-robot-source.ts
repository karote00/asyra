import type { Point3 } from './greenhouse'
import {
  composeRigidTransform,
  evaluateArticulatedTransforms
} from './walking-robot-kinematics'
import {
  MAX_WALKING_BODY_WIDTH,
  type WalkingRigidTransform
} from './walking-robot-definition'
import { interval, subtract } from './scalar-arithmetic'
import templateData from './assets/quadruped-source-template-2.json'
import {
  instantiateSourceModule,
  instantiateSourcePanel,
  readQuadrupedTemplate
} from './quadruped-source-template'
import {
  type WalkingRobotBody,
  type WalkingRobotJoint,
  type WalkingRobotPart,
  type WalkingPatchReference
} from './walking-robot-source'
import {
  readQuadrupedRobotDefinition,
  type QuadrupedRobotDefinition
} from './quadruped-robot-definition'
import { readBasketMountInput, type BasketMountInput } from './basket-interface'
import {
  evaluateQuadrupedRobotPose,
  createQuadrupedCandidatePoses,
  type QuadrupedRobotPoseResult
} from './quadruped-robot-kinematics'

const template = readQuadrupedTemplate(templateData)
function modulePort(id: string, portId: string): Point3 {
  const port = template.modules
    .find((module) => module.id === id)
    ?.ports.find((port) => port.id === portId)
  if (!port)
    throw new Error('Missing material attachment port: ' + id + '/' + portId)
  return port.position
}
type Material = ReturnType<typeof instantiateSourceModule> & {
  readonly faceTags?: Readonly<Record<number, string>>
}
function templateMaterial(id: string, size?: Point3): Material {
  const module = template.modules.find((item) => item.id === id)
  if (!module) throw new Error('Missing source module: ' + id)
  return instantiateSourceModule(module, size)
}
function boxMaterial(
  size: Point3,
  material: string,
  family?: string
): Material {
  if (family)
    return {
      ...templateMaterial(family, size),
      faceTags: { 24: 'y-high', 30: 'y-low' }
    }
  const module = template.modules.find(
    (item) =>
      item.material === material &&
      item.dimensions.kind === 'rigid' &&
      item.size.every((value, axis) => value === size[axis])
  )
  if (!module)
    throw new Error(
      'Unsupported rigid box dimensions: ' + material + ' ' + size.join(',')
    )
  return {
    ...instantiateSourceModule(module),
    faceTags: { 24: 'y-high', 30: 'y-low' }
  }
}

export const rigidFrame = (
  position: Point3 = [0, 0, 0]
): WalkingRigidTransform => ({ position, rotation: [0, 0, 0, 1] })
export function freezeSource<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeSource(child)
    Object.freeze(value)
  }
  return value
}
export interface QuadrupedRobotPart extends WalkingRobotPart {
  readonly sourceModuleId: string
  readonly kind: 'fixed' | 'stage' | 'arm' | 'tool' | 'leg' | 'basket' | 'mount'
}
interface MaterialConnection {
  readonly id: string
  readonly parent: readonly WalkingPatchReference[]
  readonly child: readonly WalkingPatchReference[]
}
interface SlidingInterface {
  readonly jointId: string
  readonly parent: QuadrupedRobotPart
  readonly child: QuadrupedRobotPart
  readonly parentCavity: readonly WalkingPatchReference[]
}
function materialReferences(
  part: QuadrupedRobotPart,
  face: string
): WalkingPatchReference[] {
  const patches = part.patches.filter((patch) =>
    patch.id.startsWith(part.id + '-source-' + face + '-')
  )
  if (!patches.length)
    throw new Error('Missing original connection face: ' + part.id + '/' + face)
  return patches.map((patch) => ({ part, patch, localFrame: part.localFrame }))
}
function materialConnection(
  id: string,
  parent: QuadrupedRobotPart,
  parentFace: string,
  child: QuadrupedRobotPart,
  childFace: string
): MaterialConnection {
  return {
    id,
    parent: materialReferences(parent, parentFace),
    child: materialReferences(child, childFace)
  }
}
interface Chain {
  readonly id: string
  readonly jointIds: readonly string[]
  readonly rootBodyId: string
  readonly terminalBodyId: string
  readonly activePoint: Point3
}
export interface QuadrupedRobotSource {
  readonly id: string
  readonly definition: QuadrupedRobotDefinition
  readonly parts: readonly QuadrupedRobotPart[]
  readonly rig: {
    readonly bodies: readonly WalkingRobotBody[]
    readonly joints: readonly WalkingRobotJoint[]
    readonly armChains: readonly Chain[]
    readonly legChains: readonly Chain[]
    readonly stageJointIds: Readonly<
      Record<'left' | 'right', readonly string[]>
    >
  }
  readonly contacts: {
    readonly sliders: readonly SlidingInterface[]
    readonly pivots: readonly {
      jointId: string
      parent: readonly WalkingPatchReference[]
      child: readonly WalkingPatchReference[]
    }[]
    readonly connections: readonly {
      id: string
      parent: readonly WalkingPatchReference[]
      child: readonly WalkingPatchReference[]
    }[]
    readonly feet: readonly WalkingPatchReference[]
    readonly cutters: readonly WalkingPatchReference[]
    readonly bearings: readonly {
      jointId: string
      parent: readonly WalkingPatchReference[]
      child: readonly WalkingPatchReference[]
    }[]
  }
  readonly massProperties: {
    readonly totalMassKg: number
    readonly bodies: readonly {
      bodyId: string
      massKg: number
      localCoM: Point3
    }[]
  }
}
export interface QuadrupedBasketMount {
  readonly source: QuadrupedRobotSource
  readonly input: BasketMountInput
  readonly parts: readonly QuadrupedRobotPart[]
  readonly contacts: {
    readonly connections: readonly MaterialConnection[]
    readonly supports: readonly WalkingPatchReference[]
    readonly supportPairs: readonly {
      id: string
      parent: readonly WalkingPatchReference[]
      child: readonly WalkingPatchReference[]
    }[]
  }
  readonly opening: { readonly min: Point3; readonly max: Point3 }
}
type BodyDraft = Omit<WalkingRobotBody, 'parts'> & {
  parts: QuadrupedRobotPart[]
}
function materialPart(
  definition: QuadrupedRobotDefinition,
  id: string,
  bodyId: string,
  kind: QuadrupedRobotPart['kind'],
  material: string,
  size: Point3,
  frame: WalkingRigidTransform,
  builder: Material,
  face?: { offset: number; count: number; name: string }
): QuadrupedRobotPart {
  if (
    !builder.positions.length ||
    !builder.positions.every(Number.isFinite) ||
    builder.regions().some((region) => region.kind !== 'closed-solid')
  )
    throw new Error('Incomplete quadruped material')
  const regions = builder.regions()
  const nativePatches = regions.flatMap((region) =>
    ['x-low', 'x-high', 'y-low', 'y-high', 'z-low', 'z-high', 'cavity'].flatMap(
      (tag) => {
        const patches = builder.patches.filter(
          (patch) =>
            patch.regionId === region.id && patch.id.startsWith(tag + '-')
        )
        return patches.length
          ? [
              {
                id: id + '-source-' + tag + '-' + region.id,
                region,
                ranges: patches.flatMap((patch) => patch.ranges)
              }
            ]
          : []
      }
    )
  )
  return {
    id,
    sourceModuleId: builder.moduleId,
    bodyId,
    kind,
    size,
    localFrame: frame,
    shape: {
      kind: 'triangles',
      positions: builder.positions,
      indices: builder.indices
    },
    regions,
    patches: [
      ...(face
        ? regions.flatMap((region) => {
            const patches = builder.patches.filter(
              (patch) =>
                patch.regionId === region.id &&
                patch.id.startsWith(
                  (builder.faceTags?.[face.offset] ?? '') + '-'
                )
            )
            if (!patches.length) return []
            return [
              {
                id: id + '-' + face.name + '-' + region.id,
                region,
                ranges: patches.flatMap((patch) => patch.ranges)
              }
            ]
          })
        : []),
      ...nativePatches
    ],
    material: { material, evidence: definition.evidence }
  }
}
function combinedMass(parts: readonly { massKg: number; localCoM: Point3 }[]) {
  const massKg = parts.reduce((sum, part) => sum + part.massKg, 0)
  const coordinate = (axis: number) =>
    parts.reduce((sum, part) => sum + part.massKg * part.localCoM[axis], 0) /
    massKg
  const localCoM: Point3 = [coordinate(0), coordinate(1), coordinate(2)]
  if (!Number.isFinite(massKg) || !localCoM.every(Number.isFinite))
    throw new Error('Unsupported aggregate mass')
  return { massKg, localCoM }
}
function validateFixedMaterialWidth(bodies: readonly BodyDraft[]) {
  const parts = bodies
    .flatMap((body) => body.parts)
    .filter((part) => part.kind === 'fixed')
  const fixedIds = new Set<string>(['base'])
  for (const part of parts) {
    let id: string | null = part.bodyId
    while (id && !fixedIds.has(id)) {
      const body = bodies.find((item) => item.id === id)
      if (!body || body.attachment !== 'fixed')
        throw new Error('Fixed material has a moving ancestor')
      fixedIds.add(id)
      id = body.parentBodyId
    }
  }
  const transforms = evaluateArticulatedTransforms(
    bodies.filter((body) => fixedIds.has(body.id)),
    [],
    new Map(),
    rigidFrame()
  )
  let min = Infinity,
    max = -Infinity
  for (const part of parts) {
    const bodyFrame = transforms.get(part.bodyId)
    if (!bodyFrame) throw new Error('Missing fixed material frame')
    const frame = composeRigidTransform(bodyFrame, part.localFrame)
    for (let offset = 0; offset < part.shape.positions.length; offset += 3) {
      const p = part.shape.positions
      const x = composeRigidTransform(
        frame,
        rigidFrame([p[offset], p[offset + 1], p[offset + 2]])
      ).position[0]
      min = Math.min(min, x)
      max = Math.max(max, x)
    }
  }
  if (subtract(interval(max), interval(min)).high > MAX_WALKING_BODY_WIDTH)
    throw new Error('body-width-exceeded')
}

function validateMaterialRepeats(parts: readonly QuadrupedRobotPart[]) {
  const counts = new Map<string, number>()
  for (const part of parts) {
    const count = (counts.get(part.sourceModuleId) ?? 0) + 1
    const module = template.modules.find(
      (module) => module.id === part.sourceModuleId
    )
    if (!module || count > module.maxRepeat)
      throw new Error('Unsupported material repeat count')
    counts.set(module.id, count)
  }
}

function buildSource(
  definition: QuadrupedRobotDefinition
): QuadrupedRobotSource {
  const bodies: BodyDraft[] = [
    { id: 'base', parentBodyId: null, attachment: 'root', parts: [] }
  ]
  const joints: WalkingRobotJoint[] = []
  const masses: { bodyId: string; massKg: number; localCoM: Point3 }[] = [
    {
      bodyId: 'base',
      ...combinedMass([definition.chassis, ...definition.platform.fixedParts])
    }
  ]
  const feet: WalkingPatchReference[] = [],
    bearings: {
      jointId: string
      parent: readonly WalkingPatchReference[]
      child: readonly WalkingPatchReference[]
    }[] = []
  const sliders: SlidingInterface[] = []
  const armChains: Chain[] = [],
    legChains: Chain[] = []
  const stageJointIds: Record<'left' | 'right', string[]> = {
    left: [],
    right: []
  }
  const body = (id: string) => {
    const result = bodies.find((item) => item.id === id)
    if (!result) throw new Error('Missing quadruped body')
    return result
  }
  const box = (
    bodyId: string,
    id: string,
    kind: QuadrupedRobotPart['kind'],
    size: Point3,
    centre: Point3,
    material = 'structural-cover'
  ) => {
    const builder = boxMaterial(size, material)
    let face: { offset: number; count: number; name: string } | undefined
    if (id.endsWith('-pad'))
      face = { offset: 30, count: 6, name: 'ground-contact' }
    if (id.endsWith('-blade--1-material'))
      face = { offset: 24, count: 6, name: 'blade-shear-contact' }
    if (id.endsWith('-blade-1-material'))
      face = { offset: 30, count: 6, name: 'blade-shear-contact' }
    body(bodyId).parts.push(
      materialPart(
        definition,
        id,
        bodyId,
        kind,
        material,
        size,
        rigidFrame(centre),
        builder,
        face
      )
    )
  }
  const fixed = (
    id: string,
    parent: string,
    frame: WalkingRigidTransform,
    massKg: number,
    localCoM: Point3 = [0, 0, 0]
  ) => {
    bodies.push({
      id,
      parentBodyId: parent,
      attachment: 'fixed',
      fixedFrame: frame,
      parts: []
    })
    masses.push({ bodyId: id, massKg, localCoM })
  }
  const attachModule = (
    bodyId: string,
    id: string,
    moduleId: string,
    kind: QuadrupedRobotPart['kind'],
    frame: WalkingRigidTransform = rigidFrame()
  ) => {
    const module = template.modules.find((item) => item.id === moduleId)
    if (!module) throw new Error('Missing material module')
    const part = materialPart(
      definition,
      id,
      bodyId,
      kind,
      module.material,
      module.size,
      frame,
      instantiateSourceModule(module)
    )
    body(bodyId).parts.push(part)
    return part
  }
  const joint = (
    id: string,
    parent: string,
    frame: WalkingRigidTransform,
    axis: WalkingRobotJoint['axis'],
    domain: readonly [number, number],
    massKg: number,
    localCoM: Point3 = [0, 0, 0],
    motion: WalkingRobotJoint['motion'] = 'revolute'
  ) => {
    bodies.push({ id, parentBodyId: parent, attachment: 'joint', parts: [] })
    masses.push({ bodyId: id, massKg, localCoM })
    joints.push({
      id,
      parentBodyId: parent,
      childBodyId: id,
      frame,
      axis,
      domain,
      motion
    })
    return id
  }
  // Separate housing and moving sleeve retain the clearance in original material.
  const bearing = (
    parent: string,
    child: string,
    axis: WalkingRobotJoint['axis'],
    frame: WalkingRigidTransform,
    kind: QuadrupedRobotPart['kind'],
    scale = 1
  ) => {
    const make = (
      bodyId: string,
      suffix: string,
      localFrame: WalkingRigidTransform,
      face?: { offset: number; count: number; name: string }
    ) => {
      const part = materialPart(
        definition,
        child + suffix,
        bodyId,
        bodyId === child && kind === 'fixed' ? 'leg' : kind,
        'joint-housing',
        [0.13 * scale, 0.13 * scale, 0.13 * scale],
        localFrame,
        (() => {
          const role = suffix.endsWith('thrust-race') ? 'race' : suffix.slice(1)
          let label = 'main'
          if (scale === 0.5) label = 'wrist'
          if (scale === 0.65) label = 'ankle'
          if (scale === 0.75) label = 'hip'
          const material = templateMaterial('bearing-' + label + '-' + role)
          const positions = [...material.positions]
          for (let offset = 0; offset < positions.length; offset += 3) {
            const [x, y, z] = positions.slice(offset, offset + 3)
            if (axis === 'y') positions.splice(offset, 3, z, x, y)
            if (axis === 'z') positions.splice(offset, 3, y, z, x)
          }
          return {
            ...material,
            positions,
            faceTags: { 0: 'x-low', 6: 'x-high' }
          }
        })(),
        face
      )
      body(bodyId).parts.push(part)
      return part
    }
    make(parent, '-housing', frame)
    make(parent, '-back-cap', frame)
    make(child, '-outer-cap', rigidFrame())
    const washer = make(parent, '-thrust-race', frame, {
      offset: 6,
      count: 6,
      name: 'bearing-contact'
    })
    const sleeve = make(child, '-sleeve', rigidFrame(), {
      offset: 0,
      count: 6,
      name: 'bearing-contact'
    })
    const axisIndex = ['x', 'y', 'z'].indexOf(axis)
    const plane = Math.max(
      ...washer.shape.positions.filter((_, index) => index % 3 === axisIndex)
    )
    const point = [0, 0, 0] as [number, number, number]
    point[axisIndex] = plane
    bearings.push({
      jointId: child,
      parent: washer.patches
        .filter((patch) => patch.id.includes('-bearing-contact-'))
        .map((patch) => ({
          part: washer,
          patch,
          localFrame: composeRigidTransform(frame, rigidFrame(point))
        })),
      child: sleeve.patches
        .filter((patch) => patch.id.includes('-bearing-contact-'))
        .map((patch) => ({
          part: sleeve,
          patch,
          localFrame: rigidFrame(point)
        }))
    })
  }
  const link = (
    bodyId: string,
    length: number,
    section: number,
    kind: QuadrupedRobotPart['kind'],
    moduleId = 'link-assembly'
  ) => {
    if (length < 0.2 || length > 1.14 || section !== 0.14)
      throw new Error('Unsupported link material profile')
    const material = templateMaterial(moduleId, [section, 0.08, length])
    body(bodyId).parts.push(
      materialPart(
        definition,
        bodyId + '-cover',
        bodyId,
        kind,
        'structural-cover',
        [section, 0.08, length],
        rigidFrame(),
        material
      )
    )
  }
  box(
    'base',
    'chassis',
    'fixed',
    definition.chassis.size,
    definition.chassis.centre
  )
  // A connected deck and disjoint outriggers leave both stage bores empty.
  const deck = definition.platform.fixedParts[0]
  if (!deck) throw new Error('Missing basket platform')
  body('base').parts.push(
    materialPart(
      definition,
      'platform-deck',
      'base',
      'fixed',
      'structural-metal',
      deck.size,
      rigidFrame(deck.centre),
      templateMaterial('platform-deck', deck.size)
    )
  )
  for (const sign of [-1, 1])
    box(
      'base',
      'stage-base-bridge-' + sign,
      'fixed',
      [0.028, 0.04, 0.14],
      [
        deck.centre[0] +
          sign *
            (modulePort('platform-deck', 'x-high')[0] -
              modulePort('stage-base-bridge', 'x-low')[0]),
        deck.centre[1],
        deck.centre[2]
      ],
      'structural-metal'
    )
  definition.platform.fixedParts
    .slice(1)
    .forEach((part, index) =>
      box(
        'base',
        'fixed-latch-housing-' + index,
        'fixed',
        part.size,
        part.centre,
        'structural-metal'
      )
    )
  for (const side of ['left', 'right'] as const) {
    const stage = definition.stages[side],
      { segmentCount, overlap, wall, clearance } = stage.telescope
    const [width, height, depth] = stage.fixedHousing.size
    if (
      overlap >= height ||
      stage.liftRange[1] >
        (segmentCount - 1) * (height - overlap) + Number.EPSILON ||
      Math.min(width, depth) - 2 * (segmentCount - 1) * (wall + clearance) <=
        2 * wall
    )
      throw new Error('Unsupported telescope geometry')
    let parent = side + '-stage-fixed'
    fixed(
      parent,
      'base',
      rigidFrame([stage.mount.position[0], 0, stage.mount.position[2]]),
      stage.fixedHousing.massKg
    )
    let previousShell: QuadrupedRobotPart | undefined
    for (let index = 0; index < segmentCount; index++) {
      const id = index === 0 ? parent : side + '-stage-' + index
      if (index > 0) {
        joint(
          id,
          parent,
          rigidFrame(),
          'y',
          [
            stage.liftRange[0] / (segmentCount - 1),
            stage.liftRange[1] / (segmentCount - 1)
          ],
          stage.movingMassKg / (segmentCount - 1),
          stage.movingLocalCoM,
          'prismatic'
        )
        stageJointIds[side].push(id)
      }
      const w = width - 2 * index * (wall + clearance),
        d = depth - 2 * index * (wall + clearance)
      const material = templateMaterial(
        index === 0 ? 'stage-housing' : 'stage-segment-' + index,
        [w, height, d]
      )
      const shell = materialPart(
        definition,
        id + '-shell',
        id,
        index === 0 ? 'fixed' : 'stage',
        'structural-metal',
        [w, height, d],
        rigidFrame([0, height / 2, 0]),
        material
      )
      body(id).parts.push(shell)
      if (previousShell)
        sliders.push({
          jointId: id,
          parent: previousShell,
          child: shell,
          parentCavity: materialReferences(previousShell, 'cavity')
        })
      previousShell = shell
      parent = id
    }
    const crown = side + '-shoulder-stage'
    fixed(crown, parent, rigidFrame([0, stage.mount.position[1], 0]), 0)
    const shoulderModule = 'shoulder-deck-' + side
    const rootHeight = definition.arms.find((arm) => arm.side === side)?.mount
      .position[1]
    if (rootHeight === undefined)
      throw new Error('Missing shoulder root height')
    const deckY =
      rootHeight +
      modulePort('bearing-main-back-cap', 'x-low')[0] -
      modulePort(shoulderModule, 'y-high')[1]
    attachModule(
      crown,
      crown + '-cover',
      shoulderModule,
      'stage',
      rigidFrame([0, deckY, 0])
    )
    const plugY =
      deckY +
      modulePort(shoulderModule, 'y-low')[1] -
      modulePort('shoulder-plug', 'y-high')[1]
    attachModule(
      crown,
      crown + '-plug',
      'shoulder-plug',
      'stage',
      rigidFrame([0, plugY, 0])
    )
    for (const arm of definition.arms.filter((item) => item.side === side)) {
      if (arm.wrist.length !== 0.15)
        throw new Error('Unsupported rigid wrist material profile')
      const id = side + '-' + arm.role
      const ids: string[] = []
      let parentId = crown
      const entries = [
        ['rootYaw', arm.mount, 0.08, [0, 0, 0]],
        [
          'rootPitch',
          rigidFrame(modulePort('shoulder-yoke', 'next-joint')),
          arm.upper.massKg,
          arm.upper.localCoM
        ],
        [
          'elbowPitch',
          rigidFrame([0, 0, arm.upper.length]),
          arm.forearm.massKg,
          arm.forearm.localCoM
        ],
        [
          'wristPitch',
          rigidFrame([0, 0, arm.forearm.length]),
          arm.wrist.massKg / 3,
          [0, 0, 0.015]
        ],
        [
          'wristYaw',
          rigidFrame(modulePort('wrist-pitch-carrier', 'next-joint')),
          arm.wrist.massKg / 3,
          [0, 0, 0.015]
        ],
        [
          'wristRoll',
          rigidFrame(modulePort('wrist-yaw-carrier', 'next-joint')),
          arm.wrist.massKg / 3,
          [0, 0, 0.008]
        ]
      ] as const
      for (const [name, frame, massKg, localCoM] of entries) {
        const child = joint(
          id + '-' + name,
          parentId,
          frame,
          definition.armAxes[name],
          arm.jointRanges[name],
          massKg,
          localCoM
        )
        bearing(
          parentId,
          child,
          definition.armAxes[name],
          frame,
          'arm',
          name.startsWith('wrist') ? 0.5 : 1
        )
        ids.push(child)
        if (name === 'wristPitch')
          attachModule(child, child + '-carrier', 'wrist-pitch-carrier', 'arm')
        if (name === 'wristYaw')
          attachModule(child, child + '-carrier', 'wrist-yaw-carrier', 'arm')
        if (name === 'wristRoll')
          attachModule(
            child,
            child + '-carrier',
            'wrist-tool-carrier',
            'arm',
            rigidFrame([
              0,
              0,
              modulePort('bearing-wrist-outer-cap', 'x-high')[0] -
                modulePort('wrist-tool-carrier', 'z-low')[2]
            ])
          )
        parentId = child
      }
      body(ids[0]).parts.push(
        materialPart(
          definition,
          id + '-root-yoke',
          ids[0],
          'arm',
          'structural-metal',
          [0.145, 0.179, 0.265],
          rigidFrame(),
          templateMaterial('shoulder-yoke')
        )
      )
      link(ids[1], arm.upper.length, arm.upper.section, 'arm')
      link(
        ids[2],
        arm.forearm.length,
        arm.forearm.section,
        'arm',
        'forearm-link'
      )
      const toolId = id + '-tool'
      const toolMass = combinedMass([arm.tool, arm.guard])
      fixed(
        toolId,
        parentId,
        rigidFrame([
          0,
          0,
          modulePort('bearing-wrist-outer-cap', 'x-high')[0] -
            modulePort('wrist-tool-carrier', 'z-low')[2] +
            modulePort('wrist-tool-carrier', 'z-high')[2]
        ]),
        toolMass.massKg,
        toolMass.localCoM
      )
      if (
        arm.tool.size.some(
          (value, axis) => value !== [0.08, 0.06, 0.12][axis]
        ) ||
        arm.guard.size.some((value, axis) => value !== [0.11, 0.08, 0.14][axis])
      )
        throw new Error('Unsupported rigid tool assembly profile')
      const palmModule = arm.role + '-palm'
      const palmPosition: Point3 = [0, 0, -modulePort(palmModule, 'z-low')[2]]
      attachModule(
        toolId,
        toolId + '-palm',
        palmModule,
        'tool',
        rigidFrame(palmPosition)
      )
      for (const sign of [-1, 1]) {
        const side = sign < 0 ? 'low' : 'high',
          opposite = sign < 0 ? 'high' : 'low'
        if (arm.role === 'holder') {
          attachModule(
            toolId,
            toolId + '-padded-finger-' + sign,
            'holder-finger',
            'tool',
            rigidFrame([
              modulePort(palmModule, 'x-' + side)[0] -
                modulePort('holder-finger', 'x-' + side)[0],
              0,
              palmPosition[2] +
                modulePort(palmModule, 'z-high')[2] -
                modulePort('holder-finger', 'z-low')[2]
            ])
          )
          attachModule(
            toolId,
            toolId + '-foliage-guide-' + sign,
            'foliage-guide',
            'tool',
            rigidFrame([
              modulePort(palmModule, 'x-' + side)[0] -
                modulePort('foliage-guide', 'x-' + opposite)[0],
              modulePort(palmModule, 'y-high')[1] -
                modulePort('foliage-guide', 'y-high')[1],
              palmPosition[2] +
                modulePort(palmModule, 'z-low')[2] -
                modulePort('foliage-guide', 'z-low')[2]
            ])
          )
        } else {
          const guardModule = sign < 0 ? 'cutter-guard-left' : 'cutter-guard'
          const parentPort = modulePort(palmModule, 'guard-' + sign),
            childPort = modulePort(guardModule, 'attachment')
          attachModule(
            toolId,
            toolId + '-guard-' + sign,
            guardModule,
            'tool',
            rigidFrame(
              parentPort.map(
                (value, axis) => value + palmPosition[axis] - childPort[axis]
              ) as unknown as Point3
            )
          )
          const blade = joint(
            toolId + '-blade-' + sign,
            toolId,
            rigidFrame(modulePort(palmModule, 'blade-axis-' + sign)),
            'y',
            [-0.24, 0.24],
            0
          )
          const bladeMaterial = templateMaterial('cutter-blade')
          const bladePart = materialPart(
            definition,
            blade + '-material',
            blade,
            'tool',
            'cutting-edge',
            [0.012, 0.006, 0.12 - 0.02],
            rigidFrame([
              0,
              -modulePort('cutter-blade', sign < 0 ? 'y-high' : 'y-low')[1],
              -modulePort('cutter-blade', 'z-low')[2]
            ]),
            { ...bladeMaterial, faceTags: { 24: 'y-high', 30: 'y-low' } },
            {
              offset: sign < 0 ? 24 : 30,
              count: 6,
              name: 'blade-shear-contact'
            }
          )
          body(blade).parts.push(bladePart)
        }
      }
      armChains.push({
        id,
        jointIds: ids,
        rootBodyId: ids[1],
        terminalBodyId: toolId,
        activePoint: arm.tool.activePoint
      })
    }
  }
  for (const leg of definition.legs) {
    const id = leg.side + '-' + leg.station
    const abduction = joint(
      id + '-hipAbduction',
      'base',
      leg.mount,
      'z',
      leg.jointRanges.hipAbduction,
      0
    )
    bearing('base', abduction, 'z', leg.mount, 'fixed', 0.75)
    const inward =
      (leg.side === 'left' ? 1 : -1) * (leg.station === 'front' ? 1 : -1)
    attachModule(
      'base',
      id + '-mount',
      'hip-base-mount-' + inward,
      'fixed',
      leg.mount
    )
    const hipModule = 'hip-yoke-' + -inward
    attachModule(abduction, id + '-hip-yoke', hipModule, 'leg')
    const down: WalkingRigidTransform = {
      position: modulePort(hipModule, 'next-joint'),
      rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
    }
    const hip = joint(
      id + '-hipPitch',
      abduction,
      down,
      'x',
      leg.jointRanges.hipPitch,
      leg.upper.massKg,
      leg.upper.localCoM
    )
    bearing(abduction, hip, 'x', down, 'leg')
    const kneeFrame = rigidFrame([0, 0, leg.upper.length])
    const knee = joint(
      id + '-kneePitch',
      hip,
      kneeFrame,
      'x',
      leg.jointRanges.kneePitch,
      leg.lower.massKg,
      leg.lower.localCoM
    )
    bearing(hip, knee, 'x', kneeFrame, 'leg')
    const ankleFrame = rigidFrame([0, 0, leg.lower.length])
    const ankle = joint(
      id + '-anklePitch',
      knee,
      ankleFrame,
      'x',
      leg.jointRanges.anklePitch,
      0
    )
    bearing(knee, ankle, 'x', ankleFrame, 'leg', 0.65)
    attachModule(
      ankle,
      id + '-ankle-carrier',
      'ankle-carrier',
      'leg',
      rigidFrame()
    )
    const foot = id + '-foot'
    fixed(
      foot,
      ankle,
      {
        position: [0, 0, modulePort('ankle-carrier', 'z-high')[2]],
        rotation: [0, 0, 0, 1]
      },
      leg.foot.massKg,
      [leg.foot.localCoM[0], leg.foot.localCoM[2], -leg.foot.localCoM[1]]
    )
    link(hip, leg.upper.length, leg.upper.section, 'leg')
    link(knee, leg.lower.length, leg.lower.section, 'leg', 'lower-leg-link')
    const footMaterial = templateMaterial('foot-pad', leg.foot.size)
    const permute = (point: Point3): Point3 => [point[0], point[2], -point[1]]
    const footPositions = footMaterial.positions.flatMap((_, i) =>
      i % 3 === 0
        ? permute([
            footMaterial.positions[i],
            footMaterial.positions[i + 1],
            footMaterial.positions[i + 2]
          ])
        : []
    )
    body(foot).parts.push(
      materialPart(
        definition,
        foot + '-pad',
        foot,
        'leg',
        'soft-contact',
        [leg.foot.size[0], leg.foot.size[2], leg.foot.size[1]],
        rigidFrame([0, 0, modulePort('foot-pad', 'y-high')[1]]),
        {
          ...footMaterial,
          positions: footPositions,
          ports: footMaterial.ports.map((port) => ({
            ...port,
            position: permute(port.position)
          })),
          faceTags: { 30: 'y-low' }
        },
        { offset: 30, count: 6, name: 'ground-contact' }
      )
    )
    const sole = body(foot).parts[0]
    const soleZ =
      modulePort('foot-pad', 'y-high')[1] - modulePort('foot-pad', 'y-low')[1]
    feet.push({
      part: sole,
      patch: sole.patches[0],
      localFrame: {
        position: [0, 0, soleZ],
        rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]
      }
    })
    legChains.push({
      id,
      jointIds: [abduction, hip, knee, ankle],
      rootBodyId: abduction,
      terminalBodyId: foot,
      activePoint: [0, 0, soleZ]
    })
  }
  const parts = bodies.flatMap((body) => body.parts)
  const connections: MaterialConnection[] = []
  const connect = (
    id: string,
    firstId: string,
    firstFace: string,
    secondId: string,
    secondFace: string
  ) => {
    const first = parts.find((part) => part.id === firstId),
      second = parts.find((part) => part.id === secondId)
    if (!first || !second) throw new Error('Missing connection part')
    connections.push(
      materialConnection(id, first, firstFace, second, secondFace)
    )
  }
  // Every closed bearing is physically connected through back-cap, race,
  // moving sleeve and outer-cap; the revolute face is separately declared.
  for (const bearing of bearings) {
    const id = bearing.jointId
    connect(
      id + '-housing-attachment',
      id + '-housing',
      'x-low',
      id + '-back-cap',
      'x-high'
    )
    connect(
      id + '-race-attachment',
      id + '-back-cap',
      'x-high',
      id + '-thrust-race',
      'x-low'
    )
    connect(
      id + '-cap-attachment',
      id + '-sleeve',
      'x-high',
      id + '-outer-cap',
      'x-low'
    )
  }
  for (const leg of definition.legs) {
    const id = leg.side + '-' + leg.station
    const inward =
      (leg.side === 'left' ? 1 : -1) * (leg.station === 'front' ? 1 : -1)
    connect(
      id + '-mount-to-base',
      'chassis',
      leg.side === 'left' ? 'x-low' : 'x-high',
      id + '-mount',
      inward === 1 ? 'x-high' : 'x-low'
    )
    connect(
      id + '-mount-to-bearing',
      id + '-mount',
      'z-high',
      id + '-hipAbduction-back-cap',
      'x-low'
    )
    connect(
      id + '-hip-carrier-root',
      id + '-hipAbduction-outer-cap',
      'x-high',
      id + '-hip-yoke',
      'z-low'
    )
    connect(
      id + '-hip-carrier-tip',
      id + '-hip-yoke',
      'x-high',
      id + '-hipPitch-back-cap',
      'x-low'
    )
    connect(
      id + '-upper-root',
      id + '-hipPitch-outer-cap',
      'x-high',
      id + '-hipPitch-cover',
      'x-low'
    )
    connect(
      id + '-upper-tip',
      id + '-hipPitch-cover',
      'x-high',
      id + '-kneePitch-back-cap',
      'x-low'
    )
    connect(
      id + '-lower-root',
      id + '-kneePitch-outer-cap',
      'x-high',
      id + '-kneePitch-cover',
      'x-low'
    )
    connect(
      id + '-lower-tip',
      id + '-kneePitch-cover',
      'x-high',
      id + '-anklePitch-back-cap',
      'x-low'
    )
    connect(
      id + '-ankle-carrier-root',
      id + '-anklePitch-outer-cap',
      'x-high',
      id + '-ankle-carrier',
      'x-low'
    )
    connect(
      id + '-sole-attachment',
      id + '-ankle-carrier',
      'z-high',
      id + '-foot-pad',
      'y-high'
    )
  }

  connect('chassis-to-platform', 'chassis', 'y-high', 'platform-deck', 'y-low')
  definition.platform.fixedParts
    .slice(1)
    .forEach((_, index) =>
      connect(
        'platform-latch-' + index,
        'platform-deck',
        'y-high',
        'fixed-latch-housing-' + index,
        'y-low'
      )
    )
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    connect(
      side + '-platform-bridge',
      'platform-deck',
      sign < 0 ? 'x-low' : 'x-high',
      'stage-base-bridge-' + sign,
      sign < 0 ? 'x-high' : 'x-low'
    )
    connect(
      side + '-bridge-stage',
      'stage-base-bridge-' + sign,
      sign < 0 ? 'x-low' : 'x-high',
      side + '-stage-fixed-shell',
      sign < 0 ? 'x-high' : 'x-low'
    )
    const finalId =
      side +
      '-stage-' +
      (definition.stages[side].telescope.segmentCount - 1) +
      '-shell'
    connect(
      side + '-stage-crown-plug',
      finalId,
      'cavity',
      side + '-shoulder-stage-plug',
      'x-low'
    )
    connect(
      side + '-crown-deck',
      side + '-shoulder-stage-plug',
      'y-high',
      side + '-shoulder-stage-cover',
      'y-low'
    )
  }
  const pivots: {
    jointId: string
    parent: WalkingPatchReference[]
    child: WalkingPatchReference[]
  }[] = []
  for (const arm of definition.arms) {
    const id = arm.side + '-' + arm.role,
      tool = id + '-tool'
    connect(
      id + '-stage-root',
      arm.side + '-shoulder-stage-cover',
      'y-high',
      id + '-rootYaw-back-cap',
      'x-low'
    )
    connect(
      id + '-yoke-root',
      id + '-rootYaw-outer-cap',
      'x-high',
      id + '-root-yoke',
      'y-low'
    )
    connect(
      id + '-yoke-tip',
      id + '-root-yoke',
      'x-high',
      id + '-rootPitch-back-cap',
      'x-low'
    )
    for (const [joint, next] of [
      ['rootPitch', 'elbowPitch'],
      ['elbowPitch', 'wristPitch']
    ]) {
      connect(
        id + '-' + joint + '-link-root',
        id + '-' + joint + '-outer-cap',
        'x-high',
        id + '-' + joint + '-cover',
        'x-low'
      )
      connect(
        id + '-' + joint + '-link-tip',
        id + '-' + joint + '-cover',
        'x-high',
        id + '-' + next + '-back-cap',
        'x-low'
      )
    }
    connect(
      id + '-pitch-carrier-root',
      id + '-wristPitch-outer-cap',
      'x-high',
      id + '-wristPitch-carrier',
      'x-low'
    )
    connect(
      id + '-pitch-carrier-tip',
      id + '-wristPitch-carrier',
      'y-high',
      id + '-wristYaw-back-cap',
      'x-low'
    )
    connect(
      id + '-yaw-carrier-root',
      id + '-wristYaw-outer-cap',
      'x-high',
      id + '-wristYaw-carrier',
      'y-low'
    )
    connect(
      id + '-yaw-carrier-tip',
      id + '-wristYaw-carrier',
      'z-high',
      id + '-wristRoll-back-cap',
      'x-low'
    )
    connect(
      id + '-roll-carrier',
      id + '-wristRoll-outer-cap',
      'x-high',
      id + '-wristRoll-carrier',
      'z-low'
    )
    connect(
      id + '-palm',
      id + '-wristRoll-carrier',
      'z-high',
      tool + '-palm',
      'z-low'
    )
    for (const sign of [-1, 1]) {
      const face = sign < 0 ? 'x-low' : 'x-high',
        opposite = sign < 0 ? 'x-high' : 'x-low'
      if (arm.role === 'holder') {
        connect(
          tool + '-finger-' + sign,
          tool + '-palm',
          'z-high',
          tool + '-padded-finger-' + sign,
          'z-low'
        )
        connect(
          tool + '-guide-' + sign,
          tool + '-palm',
          face,
          tool + '-foliage-guide-' + sign,
          opposite
        )
      } else {
        connect(
          tool + '-guard-' + sign,
          tool + '-palm',
          face,
          tool + '-guard-' + sign,
          opposite
        )
        const palm = parts.find((part) => part.id === tool + '-palm'),
          blade = parts.find(
            (part) => part.id === tool + '-blade-' + sign + '-material'
          )
        if (!palm || !blade) throw new Error('Missing cutter pivot material')
        pivots.push({
          jointId: tool + '-blade-' + sign,
          parent: materialReferences(palm, sign < 0 ? 'y-high' : 'y-low'),
          child: materialReferences(blade, sign < 0 ? 'y-low' : 'y-high')
        })
      }
    }
  }
  validateFixedMaterialWidth(bodies)
  const expectedDeck: Point3 = [
    definition.chassis.centre[0],
    definition.chassis.centre[1] +
      modulePort('chassis-shell', 'y-high')[1] -
      modulePort('platform-deck', 'y-low')[1],
    definition.chassis.centre[2]
  ]
  if (deck.centre.some((value, axis) => value !== expectedDeck[axis]))
    throw new Error('Unsupported deck attachment profile')
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1,
      stage = definition.stages[side]
    const expectedX =
      deck.centre[0] +
      sign *
        (modulePort('platform-deck', 'x-high')[0] +
          modulePort('stage-base-bridge', 'x-high')[0] -
          modulePort('stage-base-bridge', 'x-low')[0] +
          modulePort('stage-housing', 'x-high')[0])
    if (
      stage.mount.position[0] !== expectedX ||
      stage.mount.position[2] !== deck.centre[2] ||
      stage.fixedHousing.centre[0] !== expectedX ||
      stage.fixedHousing.centre[2] !== deck.centre[2] ||
      stage.fixedHousing.centre[1] !== stage.fixedHousing.size[1] / 2 ||
      stage.mount.rotation.some((value, axis) => value !== [0, 0, 0, 1][axis])
    )
      throw new Error('Unsupported stage bridge attachment profile')
  }
  const latchY =
    deck.centre[1] +
    modulePort('platform-deck', 'y-high')[1] -
    modulePort('latch-housing', 'y-low')[1]
  if (
    definition.platform.fixedParts
      .slice(1)
      .some((part) => part.centre[1] !== latchY)
  )
    throw new Error('Unsupported fixed latch attachment profile')
  validateMaterialRepeats(bodies.flatMap((body) => body.parts))
  return freezeSource({
    id: definition.definitionId + '-source',
    definition,
    parts: bodies.flatMap((item) => item.parts),
    rig: { bodies, joints, armChains, legChains, stageJointIds },
    contacts: {
      sliders,
      pivots,
      connections,
      feet,
      bearings,
      cutters: bodies
        .flatMap((body) => body.parts)
        .flatMap((part) =>
          part.patches
            .filter((patch) => patch.id.includes('blade-shear-contact'))
            .map((patch) => ({
              part,
              patch,
              localFrame: rigidFrame([
                part.localFrame.position[0],
                0,
                part.localFrame.position[2]
              ])
            }))
        )
    },
    massProperties: {
      totalMassKg: masses.reduce((sum, item) => sum + item.massKg, 0),
      bodies: masses
    }
  })
}
function buildMount(
  source: QuadrupedRobotSource,
  input: BasketMountInput
): QuadrupedBasketMount {
  if (input.basket.payloadKg !== 0) throw new Error('Missing load-geometry')
  const parts: QuadrupedRobotPart[] = [],
    supports: WalkingPatchReference[] = []
  const module = template.modules.find((module) => module.id === 'basket-panel')
  if (!module) throw new Error('Missing adjustable panel source')
  const panel = (
    id: string,
    kind: QuadrupedRobotPart['kind'],
    low: Point3,
    high: Point3,
    support = false
  ) => {
    const material = {
      ...instantiateSourcePanel(module, low, high),
      faceTags: { 24: 'y-high', 30: 'y-low' }
    }
    const size = high.map(
      (value, axis) => value - low[axis]
    ) as unknown as Point3
    let contactFace: { offset: number; count: number; name: string } | undefined
    if (support) contactFace = { offset: 24, count: 6, name: 'basket-contact' }
    else if (kind === 'basket')
      contactFace = { offset: 30, count: 6, name: 'basket-underside' }
    const part = materialPart(
      source.definition,
      id,
      'base',
      kind,
      kind === 'mount' ? 'structural-metal' : 'basket-material',
      size,
      rigidFrame(),
      material,
      contactFace
    )
    parts.push(part)
    if (support)
      supports.push({
        part,
        patch: part.patches[0],
        localFrame: rigidFrame([
          (low[0] + high[0]) / 2,
          high[1],
          (low[2] + high[2]) / 2
        ])
      })
    return part
  }
  const platformParts = source.parts.filter(
    (part) =>
      part.id === 'platform-deck' || part.id.startsWith('fixed-latch-housing-')
  )
  const top = (part: QuadrupedRobotPart) =>
    part.localFrame.position[1] +
    Math.max(...part.shape.positions.filter((_, i) => i % 3 === 1))
  const platformTop = Math.max(...platformParts.map(top))
  const [w, h, l] = input.basket.externalSize,
    [iw, ih, il] = input.basket.internalSize
  const [pw, pl] = source.definition.platform.padSize
  const crossbarTop = platformTop + 0.025,
    railTop = crossbarTop + 0.025
  const bottom = railTop + 0.02,
    floor = h - ih,
    floorTop = bottom + floor,
    basketTop = bottom + h
  const railEnd = Math.max(l / 2 + 0.015, 0.34)
  // Two transverse beams sit on the permanent housings; the adjustable rails
  // occupy the next physical layer and carry the four declared support pads.
  for (const sign of [-1, 1])
    panel(
      'basket-base-crossbar-' + sign,
      'mount',
      [-0.3, platformTop, sign * 0.3 - 0.04],
      [0.3, crossbarTop, sign * 0.3 + 0.04]
    )
  for (const [index, x] of [
    ...new Set(input.supports.map(([x]) => x))
  ].entries())
    panel(
      'basket-support-rail-' + index,
      'mount',
      [x - pw / 2, crossbarTop, -railEnd],
      [x + pw / 2, railTop, railEnd]
    )
  input.supports.forEach(([x, z], index) =>
    panel(
      'basket-support-' + index,
      'mount',
      [x - pw / 2, railTop, z - pl / 2],
      [x + pw / 2, bottom, z + pl / 2],
      true
    )
  )
  if (input.basket.bottom.kind === 'flat')
    panel(
      'basket-bottom',
      'basket',
      [-w / 2, bottom, -l / 2],
      [w / 2, floorTop, l / 2]
    )
  else {
    const padTop = bottom + floor / 2
    panel(
      'basket-bottom',
      'basket',
      [-w / 2, padTop, -l / 2],
      [w / 2, floorTop, l / 2]
    )
    input.basket.bottom.contacts.forEach(
      ({ centre: [x, z], size: [width, length] }, index) =>
        panel(
          'basket-bottom-pad-' + index,
          'basket',
          [x - width / 2, bottom, z - length / 2],
          [x + width / 2, padTop, z + length / 2]
        )
    )
  }
  panel(
    'basket-side--1',
    'basket',
    [-w / 2, floorTop, -l / 2],
    [-iw / 2, basketTop, l / 2]
  )
  panel(
    'basket-side-1',
    'basket',
    [iw / 2, floorTop, -l / 2],
    [w / 2, basketTop, l / 2]
  )
  panel(
    'basket-end--1',
    'basket',
    [-iw / 2, floorTop, -l / 2],
    [iw / 2, basketTop, -il / 2]
  )
  panel(
    'basket-end-1',
    'basket',
    [-iw / 2, floorTop, il / 2],
    [iw / 2, basketTop, l / 2]
  )
  const sideRailTop = bottom - 0.002
  panel(
    'basket-width-adjustment-beam',
    'mount',
    [-w / 2 - 0.015, railTop, -0.03],
    [w / 2 + 0.015, sideRailTop, 0.03]
  )
  for (const sign of [-1, 1]) {
    const lowX = sign < 0 ? -w / 2 - 0.015 : w / 2,
      highX = sign < 0 ? -w / 2 : w / 2 + 0.015
    panel(
      'basket-width-stop-' + sign,
      'mount',
      [lowX, sideRailTop, -0.03],
      [highX, bottom + 0.025, 0.03]
    )
    const lowZ = sign < 0 ? -l / 2 - 0.015 : l / 2
    const highZ = sign < 0 ? -l / 2 : l / 2 + 0.015
    const railMinX = Math.min(...input.supports.map(([x]) => x - pw / 2))
    const railMaxX = Math.max(...input.supports.map(([x]) => x + pw / 2))
    panel(
      'basket-retainer-crossbar-' + sign,
      'mount',
      [railMinX, railTop, lowZ],
      [railMaxX, bottom, highZ]
    )
    panel(
      'basket-length-latch-' + sign,
      'mount',
      [-0.025, bottom, lowZ],
      [0.025, bottom + input.retention.engagement, highZ]
    )
  }
  const undersides = parts
    .filter((part) =>
      input.basket.bottom.kind === 'flat'
        ? part.id === 'basket-bottom'
        : part.id.startsWith('basket-bottom-pad-')
    )
    .flatMap((part) => {
      const coordinates = [0, 1, 2].map((axis) =>
        part.shape.positions.filter((_, index) => index % 3 === axis)
      )
      const centre: Point3 = [
        (Math.min(...coordinates[0]) + Math.max(...coordinates[0])) / 2,
        Math.min(...coordinates[1]),
        (Math.min(...coordinates[2]) + Math.max(...coordinates[2])) / 2
      ]
      return part.patches
        .filter((patch) => patch.id.includes('-basket-underside-'))
        .map((patch) => ({ part, patch, localFrame: rigidFrame(centre) }))
    })
  if (!undersides.length)
    throw new Error('Missing original basket underside patches')
  const supportPairs = supports.map((support, index) => ({
    id: 'basket-support-' + index,
    parent: [support],
    child: undersides
  }))

  const connections: MaterialConnection[] = []
  const allParts = [...source.parts, ...parts]
  const requirePart = (id: string) => {
    const part = allParts.find((part) => part.id === id)
    if (!part) throw new Error('Missing mount connection part: ' + id)
    return part
  }
  const connect = (
    id: string,
    parent: string,
    parentFace: string,
    child: string,
    childFace: string
  ) =>
    connections.push(
      materialConnection(
        id,
        requirePart(parent),
        parentFace,
        requirePart(child),
        childFace
      )
    )
  for (const sign of [-1, 1]) {
    const crossbar = requirePart('basket-base-crossbar-' + sign)
    connections.push({
      id: 'basket-base-' + sign,
      parent: platformParts.flatMap((part) =>
        materialReferences(part, 'y-high')
      ),
      child: materialReferences(crossbar, 'y-low')
    })
    for (let i = 0; i < new Set(input.supports.map(([x]) => x)).size; i++) {
      connect(
        'basket-rail-base-' + sign + '-' + i,
        crossbar.id,
        'y-high',
        'basket-support-rail-' + i,
        'y-low'
      )
      connect(
        'basket-retainer-rail-' + sign + '-' + i,
        'basket-support-rail-' + i,
        'y-high',
        'basket-retainer-crossbar-' + sign,
        'y-low'
      )
    }
    connect(
      'basket-width-stop-' + sign,
      'basket-width-adjustment-beam',
      'y-high',
      'basket-width-stop-' + sign,
      'y-low'
    )
    connect(
      'basket-length-latch-' + sign,
      'basket-retainer-crossbar-' + sign,
      'y-high',
      'basket-length-latch-' + sign,
      'y-low'
    )
    for (const side of ['side', 'end'])
      connect(
        'basket-floor-' + side + '-' + sign,
        'basket-bottom',
        'y-high',
        'basket-' + side + '-' + sign,
        'y-low'
      )
    const stop = requirePart('basket-width-stop-' + sign),
      latch = requirePart('basket-length-latch-' + sign)
    connections.push({
      id: 'basket-width-retention-' + sign,
      parent: materialReferences(stop, sign < 0 ? 'x-high' : 'x-low'),
      child: ['basket-bottom', 'basket-side-' + sign].flatMap((id) =>
        materialReferences(requirePart(id), sign < 0 ? 'x-low' : 'x-high')
      )
    })
    connections.push({
      id: 'basket-length-retention-' + sign,
      parent: materialReferences(latch, sign < 0 ? 'z-high' : 'z-low'),
      child: ['basket-bottom', 'basket-end-' + sign].flatMap((id) =>
        materialReferences(requirePart(id), sign < 0 ? 'z-low' : 'z-high')
      )
    })
  }
  const railPositions = [...new Set(input.supports.map(([x]) => x))]
  railPositions.forEach((_, index) =>
    connect(
      'basket-width-beam-rail-' + index,
      'basket-support-rail-' + index,
      'y-high',
      'basket-width-adjustment-beam',
      'y-low'
    )
  )
  input.supports.forEach(([x], index) =>
    connect(
      'basket-pad-rail-' + index,
      'basket-support-rail-' + railPositions.indexOf(x),
      'y-high',
      'basket-support-' + index,
      'y-low'
    )
  )
  if (input.basket.bottom.kind === 'pads')
    input.basket.bottom.contacts.forEach((_, index) =>
      connect(
        'basket-pad-floor-' + index,
        'basket-bottom-pad-' + index,
        'y-high',
        'basket-bottom',
        'y-low'
      )
    )
  validateMaterialRepeats([...source.parts, ...parts])
  return freezeSource({
    source,
    input,
    parts,
    contacts: { supports, supportPairs, connections },
    opening: {
      min: [-iw / 2, basketTop, -il / 2],
      max: [iw / 2, basketTop, il / 2]
    }
  })
}
/** One current definition, attachment and pose; none is movement or load admission. */
export class QuadrupedRobotSourceOwner {
  private readonly issuedPoses = new WeakSet<QuadrupedRobotPoseResult>()
  readonly work = { robotBuilds: 0, basketBuilds: 0, fkEvaluations: 0 }
  private source: QuadrupedRobotSource | null = null
  private attachment: QuadrupedBasketMount | null = null
  private mountInput: unknown
  private mountKey: string | null = null
  private poseKey: string | null = null
  private candidates: ReturnType<typeof createQuadrupedCandidatePoses> | null =
    null
  private poseInput: unknown
  private pose: QuadrupedRobotPoseResult | null = null
  prepare(raw: unknown): QuadrupedRobotSource {
    const definition = readQuadrupedRobotDefinition(raw)
    if (this.source?.definition === definition) return this.source
    const next = buildSource(definition)
    this.clear()
    this.source = next
    this.work.robotBuilds++
    return next
  }
  read() {
    return this.source
  }
  isCurrent(source: QuadrupedRobotSource) {
    return this.source === source
  }
  isCurrentMount(mount: QuadrupedBasketMount) {
    return this.attachment === mount && this.isCurrent(mount.source)
  }
  isCurrentPose(pose: QuadrupedRobotPoseResult) {
    return (
      this.issuedPoses.has(pose) &&
      this.isCurrent(pose.source) &&
      this.isCurrentMount(pose.mount)
    )
  }
  mount(source: QuadrupedRobotSource, raw: unknown): QuadrupedBasketMount {
    if (!this.isCurrent(source)) throw new Error('Stale quadruped source')
    const input = readBasketMountInput(source.definition.platform, raw)
    const key = JSON.stringify(input)
    if (this.attachment && this.mountInput === raw && this.mountKey === key)
      return this.attachment
    const next = buildMount(source, input)
    this.attachment = next
    this.mountInput = raw
    this.mountKey = key
    this.candidates = null
    this.pose = null
    this.work.basketBuilds++
    return next
  }
  evaluate(
    source: QuadrupedRobotSource,
    raw: unknown,
    mount: QuadrupedBasketMount
  ): QuadrupedRobotPoseResult {
    if (!this.isCurrent(source) || !this.isCurrentMount(mount))
      throw new Error('Stale quadruped pose input')
    const key = JSON.stringify(raw)
    if (
      this.pose &&
      this.poseInput === raw &&
      this.poseKey === key &&
      this.pose.mount === mount
    )
      return this.pose
    this.pose = evaluateQuadrupedRobotPose(source, raw, mount)
    this.issuedPoses.add(this.pose)
    this.poseInput = raw
    this.poseKey = key
    this.work.fkEvaluations++
    return this.pose
  }
  candidatePoses(source: QuadrupedRobotSource, mount: QuadrupedBasketMount) {
    if (!this.isCurrent(source) || !this.isCurrentMount(mount))
      throw new Error('Stale candidate input')
    if (!this.candidates)
      this.candidates = createQuadrupedCandidatePoses(source, mount)
    return this.candidates
  }
  get lastPose() {
    return this.pose
  }
  clear() {
    this.source = null
    this.attachment = null
    this.mountInput = undefined
    this.mountKey = null
    this.poseKey = null
    this.candidates = null
    this.poseInput = undefined
    this.pose = null
  }
}
