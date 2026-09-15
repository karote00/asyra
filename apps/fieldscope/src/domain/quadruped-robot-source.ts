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
import { TriangleBuilder } from './mesh'
import {
  createAnnularSourceMaterial,
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
  readonly kind: 'fixed' | 'stage' | 'arm' | 'tool' | 'leg' | 'basket' | 'mount'
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
    readonly feet: readonly WalkingPatchReference[]
    readonly cutters: readonly WalkingPatchReference[]
    readonly bearings: readonly {
      jointId: string
      parent: WalkingPatchReference
      child: WalkingPatchReference
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
  readonly contacts: { readonly supports: readonly WalkingPatchReference[] }
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
  builder: TriangleBuilder,
  face?: { offset: number; count: number; name: string }
): QuadrupedRobotPart {
  if (
    !builder.positions.length ||
    !builder.positions.every(Number.isFinite) ||
    builder.regions().some((region) => region.kind !== 'closed-solid')
  )
    throw new Error('Incomplete quadruped material')
  const regions = builder.regions()
  return {
    id,
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
    patches: face
      ? regions.map((region) => ({
          id: id + '-' + face.name + '-' + region.id,
          region,
          ranges: [
            {
              indexStart: region.indexStart + face.offset,
              indexCount: face.count
            }
          ]
        }))
      : [],
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
      parent: WalkingPatchReference
      child: WalkingPatchReference
    }[] = []
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
    const builder = new TriangleBuilder()
    builder.box([0, 0, 0], size)
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
      inner: number,
      outer: number,
      low: number,
      high: number,
      localFrame: WalkingRigidTransform,
      face?: { offset: number; count: number; name: string }
    ) => {
      const part = materialPart(
        definition,
        child + suffix,
        bodyId,
        bodyId === child && kind === 'fixed' ? 'leg' : kind,
        'joint-housing',
        [0.11 * scale, 0.11 * scale, 0.11 * scale],
        localFrame,
        createAnnularSourceMaterial(
          axis,
          inner * scale,
          outer * scale,
          low * scale,
          high * scale
        ),
        face
      )
      body(bodyId).parts.push(part)
      return part
    }
    make(parent, '-housing', 0.04, 0.055, -0.04, -0.02, frame)
    const washer = make(
      parent,
      '-thrust-race',
      0.012,
      0.034,
      -0.024,
      -0.02,
      frame,
      { offset: 6, count: 6, name: 'bearing-contact' }
    )
    const sleeve = make(
      child,
      '-sleeve',
      0.012,
      0.034,
      -0.02,
      0.018,
      rigidFrame(),
      { offset: 0, count: 6, name: 'bearing-contact' }
    )
    const point: Point3 = [
      axis === 'x' ? -0.02 * scale : 0,
      axis === 'y' ? -0.02 * scale : 0,
      axis === 'z' ? -0.02 * scale : 0
    ]
    washer.patches.forEach((patch, index) =>
      bearings.push({
        jointId: child,
        parent: {
          part: washer,
          patch,
          localFrame: composeRigidTransform(frame, rigidFrame(point))
        },
        child: {
          part: sleeve,
          patch: sleeve.patches[index],
          localFrame: rigidFrame(point)
        }
      })
    )
  }
  const link = (
    bodyId: string,
    length: number,
    section: number,
    kind: QuadrupedRobotPart['kind']
  ) => {
    if (length <= 0.12 || section <= 0)
      throw new Error('Unsupported link material profile')
    const endClearance = Math.min(0.085, length * 0.3)
    box(
      bodyId,
      bodyId + '-cover',
      kind,
      [section, section, length - 2 * endClearance],
      [0, 0, length / 2]
    )
    box(
      bodyId,
      bodyId + '-root-neck',
      kind,
      [0.008, 0.008, 0.042],
      [0, 0, 0.045],
      'structural-metal'
    )
    box(
      bodyId,
      bodyId + '-tip-neck',
      kind,
      [0.012, 0.008, 0.06],
      [-0.03, 0, length - 0.055],
      'structural-metal'
    )
  }
  box(
    'base',
    'chassis',
    'fixed',
    definition.chassis.size,
    definition.chassis.centre
  )
  // Platform rails leave the side stage bores open; the declared fixed envelope is retained.
  const deck = definition.platform.fixedParts[0]
  if (!deck) throw new Error('Missing basket platform')
  for (const sign of [-1, 1]) {
    box(
      'base',
      'platform-rail-' + sign,
      'fixed',
      [0.05, deck.size[1], deck.size[2]],
      [sign * 0.15, deck.centre[1], deck.centre[2]]
    )
    box(
      'base',
      'platform-crossmember-' + sign,
      'fixed',
      [deck.size[0], deck.size[1], 0.04],
      [0, deck.centre[1], sign * 0.28]
    )
  }
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
      for (const sign of [-1, 1]) {
        box(
          id,
          id + '-side-' + sign,
          index === 0 ? 'fixed' : 'stage',
          [wall, height, d],
          [(sign * (w - wall)) / 2, height / 2, 0],
          'structural-metal'
        )
        box(
          id,
          id + '-face-' + sign,
          index === 0 ? 'fixed' : 'stage',
          [w - 2 * wall, height, wall],
          [0, height / 2, (sign * (d - wall)) / 2],
          'structural-metal'
        )
      }
      parent = id
    }
    const crown = side + '-shoulder-stage'
    fixed(crown, parent, rigidFrame([0, stage.mount.position[1], 0]), 0)
    box(crown, crown + '-bridge', 'stage', [0.04, 0.025, 0.8], [0, -0.015, 0])
    for (const arm of definition.arms.filter((item) => item.side === side)) {
      const sign = side === 'left' ? -1 : 1
      box(
        crown,
        side + '-' + arm.role + '-mount-crossbar',
        'stage',
        [0.25, 0.025, 0.02],
        [0, -0.015, arm.mount.position[2]]
      )
      box(
        crown,
        side + '-' + arm.role + '-mount-post',
        'stage',
        [0.012, 0.085, 0.012],
        [arm.mount.position[0] + sign * 0.045, 0.0175, arm.mount.position[2]],
        'structural-metal'
      )
      const id = side + '-' + arm.role
      const ids: string[] = []
      let parentId = crown
      const entries = [
        ['rootYaw', arm.mount, 0.08, [0, 0, 0]],
        [
          'rootPitch',
          rigidFrame([0, 0, 0.12]),
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
          rigidFrame([0, 0, arm.wrist.length * 0.4]),
          arm.wrist.massKg / 3,
          [0, 0, 0.015]
        ],
        [
          'wristRoll',
          rigidFrame([0, 0, arm.wrist.length * 0.4]),
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
          name.startsWith('wrist') ? 0.27 : 1
        )
        ids.push(child)
        parentId = child
      }
      box(
        ids[0],
        id + '-root-yoke',
        'arm',
        [0.012, 0.012, 0.055],
        [-0.03, 0, 0.075],
        'structural-metal'
      )
      link(ids[1], arm.upper.length, arm.upper.section, 'arm')
      link(ids[2], arm.forearm.length, arm.forearm.section, 'arm')
      const toolId = id + '-tool'
      const toolMass = combinedMass([arm.tool, arm.guard])
      fixed(
        toolId,
        parentId,
        rigidFrame([0, 0, arm.wrist.length * 0.2]),
        toolMass.massKg,
        toolMass.localCoM
      )
      const [tw, th, tl] = arm.tool.size
      box(
        toolId,
        toolId + '-palm',
        'tool',
        [tw, th, 0.02],
        [0, 0, 0.01],
        arm.role === 'holder' ? 'soft-contact' : 'structural-metal'
      )
      for (const sign of [-1, 1]) {
        if (arm.role === 'holder') {
          box(
            toolId,
            toolId + '-padded-finger-' + sign,
            'tool',
            [0.014, th / 2, tl - 0.02],
            [(sign * (tw - 0.014)) / 2, 0, (tl + 0.02) / 2],
            'soft-contact'
          )
          box(
            toolId,
            toolId + '-foliage-guide-' + sign,
            'tool',
            [0.008, 0.012, tl],
            [sign * (tw / 2 + 0.006), th / 2, tl / 2],
            'soft-contact'
          )
        } else {
          box(
            toolId,
            toolId + '-guard-' + sign,
            'tool',
            [0.01, arm.guard.size[1], arm.guard.size[2]],
            [(sign * (arm.guard.size[0] - 0.01)) / 2, 0, arm.guard.centre[2]],
            'structural-cover'
          )
          const blade = joint(
            toolId + '-blade-' + sign,
            toolId,
            rigidFrame([sign * 0.003, 0, 0.023]),
            'y',
            [-0.24, 0.24],
            0
          )
          box(
            blade,
            blade + '-material',
            'tool',
            [0.012, 0.006, tl - 0.02],
            [0, sign * 0.003, (tl - 0.02) / 2],
            'cutting-edge'
          )
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
    bearing('base', abduction, 'z', leg.mount, 'fixed')
    const down: WalkingRigidTransform = {
      position: [0, 0, leg.station === 'front' ? 0.12 : -0.12],
      rotation:
        leg.station === 'front'
          ? [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
          : [0, Math.SQRT1_2, -Math.SQRT1_2, 0]
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
    bearing(knee, ankle, 'x', ankleFrame, 'leg', 0.4)
    const foot = id + '-foot'
    fixed(
      foot,
      ankle,
      {
        position: [0, 0, 0.025],
        rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]
      },
      leg.foot.massKg,
      leg.foot.localCoM
    )
    link(hip, leg.upper.length, leg.upper.section, 'leg')
    link(knee, leg.lower.length, leg.lower.section, 'leg')
    box(
      foot,
      foot + '-pad',
      'leg',
      leg.foot.size,
      [0, -leg.foot.size[1] / 2, 0],
      'soft-contact'
    )
    const sole = body(foot).parts[0]
    feet.push({
      part: sole,
      patch: sole.patches[0],
      localFrame: rigidFrame([0, -leg.foot.size[1], 0])
    })
    legChains.push({
      id,
      jointIds: [abduction, hip, knee, ankle],
      rootBodyId: abduction,
      terminalBodyId: foot,
      activePoint: [0, -leg.foot.size[1], 0]
    })
  }
  validateFixedMaterialWidth(bodies)
  return freezeSource({
    id: definition.definitionId + '-source',
    definition,
    parts: bodies.flatMap((item) => item.parts),
    rig: { bodies, joints, armChains, legChains, stageJointIds },
    contacts: {
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
  const parts: QuadrupedRobotPart[] = []
  const supports: WalkingPatchReference[] = []
  const box = (
    id: string,
    kind: QuadrupedRobotPart['kind'],
    size: Point3,
    centre: Point3
  ) => {
    const builder = new TriangleBuilder()
    builder.box([0, 0, 0], size)
    const part = materialPart(
      source.definition,
      id,
      'base',
      kind,
      'basket-material',
      size,
      rigidFrame(centre),
      builder,
      id.startsWith('basket-support-')
        ? { offset: 24, count: 6, name: 'basket-contact' }
        : undefined
    )
    parts.push(part)
    if (part.patches.length)
      supports.push({
        part,
        patch: part.patches[0],
        localFrame: rigidFrame([centre[0], centre[1] + size[1] / 2, centre[2]])
      })
  }
  const [w, h, l] = input.basket.externalSize,
    [iw, ih, il] = input.basket.internalSize
  const platformTop = Math.max(
    ...source.definition.platform.fixedParts.map(
      (part) => part.centre[1] + part.size[1] / 2
    )
  )
  const bottom = platformTop + 0.02,
    floor = h - ih
  if (input.basket.bottom.kind === 'flat') {
    box('basket-bottom', 'basket', [w, floor, l], [0, bottom + floor / 2, 0])
  } else {
    // The synthetic material profile divides the declared floor depth into slab and pads.
    box(
      'basket-bottom',
      'basket',
      [w, floor / 2, l],
      [0, bottom + floor * 0.75, 0]
    )
    input.basket.bottom.contacts.forEach((contact, index) => {
      box(
        'basket-bottom-pad-' + index,
        'basket',
        [contact.size[0], floor / 2, contact.size[1]],
        [contact.centre[0], bottom + floor / 4, contact.centre[1]]
      )
    })
  }
  for (const sign of [-1, 1]) {
    box(
      'basket-side-' + sign,
      'basket',
      [(w - iw) / 2, ih, l],
      [(sign * (w + iw)) / 4, bottom + floor + ih / 2, 0]
    )
    box(
      'basket-end-' + sign,
      'basket',
      [iw, ih, (l - il) / 2],
      [0, bottom + floor + ih / 2, (sign * (l + il)) / 4]
    )
  }
  input.supports.forEach(([x, z], index) => {
    const [pw, pl] = source.definition.platform.padSize
    box(
      'basket-support-' + index,
      'mount',
      [pw, 0.02, pl],
      [x, platformTop + 0.01, z]
    )
  })
  for (const sign of [-1, 1]) {
    box(
      'basket-width-stop-' + sign,
      'mount',
      [0.015, 0.025, 0.06],
      [sign * (input.stopSpan[0] / 2 + 0.0075), bottom + 0.0125, 0]
    )
    box(
      'basket-length-latch-' + sign,
      'mount',
      [0.05, input.retention.engagement, 0.015],
      [
        0,
        bottom + input.retention.engagement / 2,
        sign * (input.stopSpan[1] / 2 + 0.0075)
      ]
    )
  }
  return freezeSource({
    source,
    input,
    parts,
    contacts: { supports },
    opening: {
      min: [-iw / 2, bottom + h, -il / 2],
      max: [iw / 2, bottom + h, il / 2]
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
