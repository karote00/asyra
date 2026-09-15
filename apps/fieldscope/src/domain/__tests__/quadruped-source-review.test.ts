import { describe, expect, it } from 'vitest'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { createSyntheticBasketInput } from '../basket-interface'
import { QuadrupedRobotSourceOwner } from '../quadruped-robot-source'
import { createQuadrupedSourceReview } from '../quadruped-source-review'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('runtime canonical review inputs', () => {
  it('retains one source and all mounted materials through three canonical poses', () => {
    const owner = new QuadrupedRobotSourceOwner()
    const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
    const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
    const candidates = owner.candidatePoses(source, mount)
    expect(Object.keys(candidates)).toHaveLength(3)
    for (const state of Object.values(candidates)) {
      const pose = owner.evaluate(source, state, mount)
      expect(pose.parts).toEqual([...source.parts, ...mount.parts])
      for (const part of pose.parts) {
        const sourcePart = [...source.parts, ...mount.parts].find(
          (item) => item.id === part.id
        )
        expect(part.shape).toBe(sourcePart?.shape)
      }
    }
    expect(owner.work.robotBuilds).toBe(1)
    expect(owner.work.basketBuilds).toBe(1)
    expect(owner.work.fkEvaluations).toBe(3)
    const poses = {
      travel: owner.evaluate(source, candidates.travel, mount),
      bilateralHarvest: owner.evaluate(
        source,
        candidates.bilateralHarvest,
        mount
      ),
      basketPlacement: owner.evaluate(source, candidates.basketPlacement, mount)
    }
    const review = createQuadrupedSourceReview(owner, poses)
    expect(review.parts.map((part) => part.id)).toEqual(
      [...source.parts, ...mount.parts].map((part) => part.id)
    )
    review.parts.forEach((part, index) =>
      expect(part.shape).toBe(poses.travel.parts[index].shape)
    )
    for (const chain of review.rig.armChains)
      expect(chain.jointIds).toHaveLength(6)
    for (const chain of review.rig.legChains)
      expect(chain.jointIds).toHaveLength(4)
    for (const side of ['left', 'right'] as const)
      expect(review.rig.stageJointIds[side]).toHaveLength(7)
    const directory = resolve('.artifacts/quadruped-source-review')
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      resolve(directory, 'runtime.json'),
      JSON.stringify(review) + '\n'
    )
    owner.clear()
    expect(() => createQuadrupedSourceReview(owner, poses)).toThrow(/Stale/)
  })
})
