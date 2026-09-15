import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { createSyntheticBasketInput } from '../basket-interface'
import { QuadrupedRobotSourceOwner } from '../quadruped-robot-source'
import { QuadrupedRobotEnvelopeOwner } from '../quadruped-robot-envelopes'

describe('complete quadruped pose envelopes', () => {
  it.each([
    [0.6, 0.2, 1],
    [0.2, 0.1, 0.3],
    [0.4, 0.15, 0.6]
  ])(
    'includes all original robot and basket vertices for %j',
    (width, height, length) => {
      const owner = new QuadrupedRobotSourceOwner()
      const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
      const mount = owner.mount(
        source,
        createSyntheticBasketInput([width, height, length])
      )
      const envelopes = new QuadrupedRobotEnvelopeOwner(owner)
      for (const name of [
        'travel',
        'bilateralHarvest',
        'basketPlacement'
      ] as const) {
        const pose = owner.evaluate(
          source,
          source.definition.presets[name],
          mount
        )
        const result = envelopes.prepare(pose)
        expect(result.contributors.length).toBe(
          source.parts.length + mount.parts.length
        )
        expect(result.fixedBodyWidth).toBeLessThanOrEqual(0.8)
        expect(result).not.toHaveProperty('safe')
        expect(result).not.toHaveProperty('route')
        for (const contributor of result.contributors) {
          const transform = contributor.transform
          for (
            let offset = 0;
            offset < contributor.part.shape.positions.length;
            offset += 3
          ) {
            const point = new Vector3(
              ...(contributor.part.shape.positions.slice(
                offset,
                offset + 3
              ) as [number, number, number])
            )
              .applyQuaternion(new Quaternion(...transform.rotation))
              .add(new Vector3(...transform.position))
            point.toArray().forEach((value, axis) => {
              expect(value).toBeGreaterThanOrEqual(contributor.bounds.min[axis])
              expect(value).toBeLessThanOrEqual(contributor.bounds.max[axis])
            })
          }
        }
        expect(envelopes.prepare(pose)).toBe(result)
        if (name === 'travel') {
          const arms = result.contributors.filter(
            (item) => item.kind === 'arm' || item.kind === 'tool'
          )
          // The 0.80 m contract limits fixed body parts; folded arms retain their own envelope.
          for (const item of arms) {
            const side = item.part.id.startsWith('left') ? 'left' : 'right'
            const rootX =
              source.definition.stages[side].mount.position[0] +
              source.definition.arms.filter((arm) => arm.side === side)[0].mount
                .position[0]
            expect(item.bounds.min[0]).toBeGreaterThan(rootX - 0.1)
            expect(item.bounds.max[0]).toBeLessThan(rootX + 0.1)
          }
        }
      }
      expect(owner.work.robotBuilds).toBe(1)
      const lastPose = owner.lastPose
      if (!lastPose) throw new Error('Missing final pose')
      owner.clear()
      expect(() => envelopes.prepare(lastPose)).toThrow()
    }
  )
})
describe('basket material separation', () => {
  it.each([
    [0.6, 0.2, 1],
    [0.2, 0.1, 0.3],
    [0.4, 0.15, 0.6]
  ])(
    'keeps stage and arm material out of basket walls for %j',
    (width, height, length) => {
      const owner = new QuadrupedRobotSourceOwner()
      const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
      const mount = owner.mount(
        source,
        createSyntheticBasketInput([width, height, length])
      )
      const envelopes = new QuadrupedRobotEnvelopeOwner(owner)
      const candidates = owner.candidatePoses(source, mount)
      for (const state of Object.values(candidates)) {
        const result = envelopes.prepare(owner.evaluate(source, state, mount))
        const basket = result.contributors.filter(
          (item) => item.kind === 'basket'
        )
        const moving = result.contributors.filter((item) =>
          ['stage', 'arm', 'tool'].includes(item.kind)
        )
        const overlaps: string[] = []
        for (const a of moving)
          for (const b of basket) {
            const separated = [0, 1, 2].some(
              (axis) =>
                a.bounds.max[axis] < b.bounds.min[axis] ||
                b.bounds.max[axis] < a.bounds.min[axis]
            )
            if (!separated) overlaps.push(a.part.id + ' / ' + b.part.id)
          }
        expect(overlaps, overlaps.join('\n')).toEqual([])
      }
    }
  )
})
