import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { createSyntheticBasketInput } from '../basket-interface'
import { QuadrupedRobotSourceOwner } from '../quadruped-robot-source'

const fixture = () => {
  const owner = new QuadrupedRobotSourceOwner()
  const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
  const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
  return { owner, source, mount }
}
describe('quadruped canonical FK and candidate poses', () => {
  it('uses every declared joint and gives three poses from one immutable source', () => {
    const { owner, source, mount } = fixture()
    for (const joints of Object.values(source.definition.presets)) {
      const result = owner.evaluate(source, joints, mount)
      expect(result.source).toBe(source)
      expect(result.mount).toBe(mount)
      expect(owner.isCurrentPose({ ...result })).toBe(false)
      expect(result.bodyTransforms.length).toBe(source.rig.bodies.length)
      expect(result.frames.tools).toHaveLength(4)
      expect(result.frames.feet).toHaveLength(4)
      for (const foot of result.frames.feet) {
        expect(foot.position[1]).toBeCloseTo(0, 10)
        const up = new Vector3(0, 1, 0).applyQuaternion(
          new Quaternion(...foot.rotation)
        )
        expect(up.y).toBeCloseTo(1, 10)
      }
    }
    expect(owner.work.robotBuilds).toBe(1)
    expect(owner.work.basketBuilds).toBe(1)
  })

  it('moves only the selected side for a lift and pitches the entire arm about its actual root', () => {
    const { owner, source, mount } = fixture()
    const before = owner.evaluate(
      source,
      source.definition.presets.travel,
      mount
    )
    const lifted = structuredClone(source.definition.presets.travel)
    const raw = { ...lifted, lifts: { left: 0.4, right: 0 } }
    const after = owner.evaluate(source, raw, mount)
    for (const root of before.frames.armRoots) {
      const next = after.frames.armRoots.find(
        (item) => item.chainId === root.chainId
      )
      if (!next) throw new Error('Missing arm root')
      expect(next.position[1] - root.position[1]).toBeCloseTo(
        root.chainId.startsWith('left') ? 0.4 : 0,
        11
      )
    }
    const pitched = {
      ...source.definition.presets.travel,
      arms: source.definition.presets.travel.arms.map((arm, index) => ({
        ...arm,
        rootPitch: arm.rootPitch + (index === 0 ? 0.2 : 0)
      }))
    }
    const result = owner.evaluate(source, pitched, mount)
    expect(result.frames.armRoots[0].position).toEqual(
      before.frames.armRoots[0].position
    )
    expect(result.frames.tools[0].position).not.toEqual(
      before.frames.tools[0].position
    )
    expect(result.frames.tools[2]).toEqual(before.frames.tools[2])
    expect(() =>
      owner.evaluate(source, { ...pitched, definitionId: 'foreign' }, mount)
    ).toThrow()
    owner.clear()
    expect(() => owner.evaluate(source, pitched, mount)).toThrow()
  })
})

describe('quadruped candidate geometry obligations', () => {
  it.each([
    [0.6, 0.2, 1],
    [0.2, 0.1, 0.3],
    [0.4, 0.15, 0.6]
  ])(
    'places a holder through the actual opening for %j',
    (width, height, length) => {
      const owner = new QuadrupedRobotSourceOwner()
      const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
      const mount = owner.mount(
        source,
        createSyntheticBasketInput([width, height, length])
      )
      const candidates = owner.candidatePoses(source, mount)
      const placement = owner.evaluate(
        source,
        candidates.basketPlacement,
        mount
      )
      const holder = placement.frames.tools.find(
        (frame) => frame.chainId === 'left-holder'
      )
      if (!holder) throw new Error('Missing placement holder')
      const opening = mount.opening
      expect(holder.position[0]).toBeGreaterThan(opening.min[0])
      expect(holder.position[0]).toBeLessThan(opening.max[0])
      expect(holder.position[2]).toBeGreaterThan(opening.min[2])
      expect(holder.position[2]).toBeLessThan(opening.max[2])
      expect(holder.position[1]).toBeCloseTo(
        opening.min[1] + source.definition.referenceBaseHeight - 0.02,
        10
      )
      const direction = new Vector3(0, 0, 1).applyQuaternion(
        new Quaternion(...holder.rotation)
      )
      expect(direction.y).toBeCloseTo(-1, 10)
      expect(owner.candidatePoses(source, mount)).toBe(candidates)
    }
  )

  it('invalidates mutable basket and pose inputs instead of reusing stale geometry', () => {
    const { owner, source } = fixture()
    const basket = createSyntheticBasketInput([0.4, 0.15, 0.6])
    const first = owner.mount(source, basket)
    basket.basket.payloadKg = 25
    expect(() => owner.mount(source, basket)).toThrow(/load-geometry/)
    const pose = structuredClone(source.definition.presets.travel)
    const before = owner.evaluate(source, pose, first)
    const mutated = pose as { lifts: { left: number; right: number } }
    mutated.lifts.left = 0.3
    const after = owner.evaluate(source, pose, first)
    expect(
      after.frames.armRoots[0].position[1] -
        before.frames.armRoots[0].position[1]
    ).toBeCloseTo(0.3, 10)
  })
})

function convexCells(pose: ReturnType<QuadrupedRobotSourceOwner['evaluate']>) {
  const transforms = new Map(
    pose.bodyTransforms.map((body) => [body.id, body.transform])
  )
  return pose.source.parts.flatMap((part) =>
    part.regions.map((region) => {
      const body = transforms.get(part.bodyId)
      if (!body) throw new Error('Missing source body')
      const vertices: Vector3[] = [],
        edges: Vector3[] = [],
        axes: Vector3[] = []
      const convert = (index: number) =>
        new Vector3(
          ...(part.shape.positions.slice(index * 3, index * 3 + 3) as [
            number,
            number,
            number
          ])
        )
          .applyQuaternion(new Quaternion(...part.localFrame.rotation))
          .add(new Vector3(...part.localFrame.position))
          .applyQuaternion(new Quaternion(...body.rotation))
          .add(new Vector3(...body.position))
      for (
        let offset = region.indexStart;
        offset < region.indexStart + region.indexCount;
        offset += 3
      ) {
        const a = convert(part.shape.indices[offset]),
          b = convert(part.shape.indices[offset + 1]),
          c = convert(part.shape.indices[offset + 2])
        vertices.push(a, b, c)
        const ab = b.clone().sub(a),
          ac = c.clone().sub(a)
        edges.push(ab, ac, c.clone().sub(b))
        axes.push(ab.clone().cross(ac))
      }
      return { part, vertices, edges, axes }
    })
  )
}
function separates(a: Vector3[], b: Vector3[], axis: Vector3) {
  if (axis.lengthSq() === 0) return false
  const pa = a.map((point) => point.dot(axis)),
    pb = b.map((point) => point.dot(axis))
  return (
    Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)
  )
}
// These source-local halfspaces are invariant under the declared revolute axis.
function axialSeparation(
  a: ReturnType<typeof convexCells>[number],
  b: ReturnType<typeof convexCells>[number],
  source: ReturnType<QuadrupedRobotSourceOwner['prepare']>
) {
  const extent = (part: typeof a.part, axis: number) => {
    const values = part.shape.positions.filter((_, index) => index % 3 === axis)
    return [Math.min(...values), Math.max(...values)]
  }
  for (const [parent, child] of [
    [a.part, b.part],
    [b.part, a.part]
  ]) {
    const joint = source.rig.joints.find(
      (item) =>
        item.parentBodyId === parent.bodyId &&
        item.childBodyId === child.bodyId &&
        item.motion === 'revolute'
    )
    if (
      !joint ||
      JSON.stringify(parent.localFrame) !== JSON.stringify(joint.frame) ||
      JSON.stringify(child.localFrame) !==
        JSON.stringify({ position: [0, 0, 0], rotation: [0, 0, 0, 1] })
    )
      continue
    const axis = ['x', 'y', 'z'].indexOf(joint.axis)
    const p = extent(parent, axis),
      c = extent(child, axis)
    if (p[1] <= c[0] || c[1] <= p[0]) return true
  }
  const ja = source.rig.joints.find(
    (item) => item.childBodyId === a.part.bodyId
  )
  const jb = source.rig.joints.find(
    (item) => item.childBodyId === b.part.bodyId
  )
  if (
    ja &&
    jb &&
    ja.motion === 'revolute' &&
    jb.motion === 'revolute' &&
    ja.parentBodyId === jb.parentBodyId &&
    ja.axis === jb.axis &&
    [ja.frame, jb.frame, a.part.localFrame, b.part.localFrame].every(
      (frame) => JSON.stringify(frame.rotation) === '[0,0,0,1]'
    )
  ) {
    const axis = ['x', 'y', 'z'].indexOf(ja.axis)
    const pa = extent(a.part, axis).map(
      (value) =>
        value + a.part.localFrame.position[axis] + ja.frame.position[axis]
    )
    const pb = extent(b.part, axis).map(
      (value) =>
        value + b.part.localFrame.position[axis] + jb.frame.position[axis]
    )
    if (pa[1] <= pb[0] || pb[1] <= pa[0]) return true
  }
  return false
}
function hasPositiveOverlap(
  a: ReturnType<typeof convexCells>[number],
  b: ReturnType<typeof convexCells>[number]
) {
  if (
    [
      new Vector3(1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, 0, 1),
      ...a.axes,
      ...b.axes
    ].some((axis) => separates(a.vertices, b.vertices, axis))
  )
    return false
  for (const edgeA of a.edges)
    for (const edgeB of b.edges)
      if (separates(a.vertices, b.vertices, edgeA.clone().cross(edgeB)))
        return false
  return true
}
describe('three candidate source body material separation', () => {
  it('rejects positive overlap across different bodies without joint exemptions', () => {
    const { owner, source, mount } = fixture()
    const overlaps = new Set<string>()
    for (const [name, joints] of Object.entries(
      owner.candidatePoses(source, mount)
    )) {
      const cells = convexCells(owner.evaluate(source, joints, mount))
      for (let i = 0; i < cells.length; i++)
        for (let j = i + 1; j < cells.length; j++) {
          if (cells[i].part.bodyId === cells[j].part.bodyId) continue
          if (
            hasPositiveOverlap(cells[i], cells[j]) &&
            !axialSeparation(cells[i], cells[j], source)
          )
            overlaps.add(
              name + ': ' + cells[i].part.id + ' / ' + cells[j].part.id
            )
        }
    }
    expect([...overlaps], [...overlaps].join('\n')).toEqual([])
  })
})
describe('basket placement in the authored arm root frame', () => {
  it.each([
    [0, Math.SQRT1_2, 0, Math.SQRT1_2],
    [Math.sin(0.1), 0, 0, Math.cos(0.1)]
  ])(
    'retains admitted mount rotation %j while entering the basket',
    (x, y, z, w) => {
      const owner = new QuadrupedRobotSourceOwner()
      const raw = JSON.parse(
        JSON.stringify(createSyntheticQuadrupedRobotDefinition())
      )
      raw.arms[0].mount.rotation = [x, y, z, w]
      const source = owner.prepare(raw)
      const mount = owner.mount(
        source,
        createSyntheticBasketInput([0.2, 0.1, 0.3])
      )
      const result = owner.evaluate(
        source,
        owner.candidatePoses(source, mount).basketPlacement,
        mount
      )
      const tool = result.frames.tools.find(
        (frame) => frame.chainId === 'left-holder'
      )
      if (!tool) throw new Error('Missing placement holder')
      expect(tool.position[0]).toBeGreaterThan(mount.opening.min[0])
      expect(tool.position[0]).toBeLessThan(mount.opening.max[0])
      expect(tool.position[2]).toBeGreaterThan(mount.opening.min[2])
      expect(tool.position[2]).toBeLessThan(mount.opening.max[2])
      expect(tool.position[1]).toBeCloseTo(
        source.definition.referenceBaseHeight + mount.opening.min[1] - 0.02,
        10
      )
      expect(
        new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...tool.rotation)).y
      ).toBeCloseTo(-1, 10)
    }
  )
})
