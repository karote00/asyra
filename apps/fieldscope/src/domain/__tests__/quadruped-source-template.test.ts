import { describe, expect, it } from 'vitest'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { QuadrupedRobotSourceOwner } from '../quadruped-robot-source'
import templateData from '../assets/quadruped-source-template-2.json'
import {
  readQuadrupedTemplate,
  instantiateSourceModule,
  instantiateSourcePanel
} from '../quadruped-source-template'

function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error('Missing required source fixture value')
  return value
}

describe('canonical template material publication', () => {
  it('retains shared panel planes exactly and changes only the admitted axial span', () => {
    const template = readQuadrupedTemplate(templateData)
    const panel = required(
      template.modules.find((module) => module.id === 'basket-panel')
    )
    const a = instantiateSourcePanel(
      panel,
      [-0.3, 0.213, -0.5],
      [0.3, 0.227, 0.5]
    )
    const b = instantiateSourcePanel(
      panel,
      [-0.3, 0.227, -0.5],
      [0.3, 0.247, -0.48]
    )
    expect(Math.max(...a.positions.filter((_, i) => i % 3 === 1))).toBe(
      Math.min(...b.positions.filter((_, i) => i % 3 === 1))
    )
    const module = required(
      template.modules.find((module) => module.id === 'link-assembly')
    )
    const length = 0.73,
      material = instantiateSourceModule(module, [0.14, 0.08, length])
    for (let i = 0; i < module.positions.length; i++) {
      const shift =
        i % 3 === 2
          ? (module.axialWeights?.[Math.floor(i / 3)] ?? 0) *
            (length - module.size[2])
          : 0
      expect(material.positions[i]).toBe(module.positions[i] + shift)
    }
    expect(material.ports.find((port) => port.id === 'root')?.position).toEqual(
      [0, 0, 0]
    )
    expect(material.ports.find((port) => port.id === 'tip')?.position).toEqual([
      0,
      0,
      length
    ])
    const rigid = required(
      template.modules.find((module) => module.id === 'foot-pad')
    )
    expect(() => instantiateSourceModule(rigid, [0.21, 0.05, 0.24])).toThrow()
  })

  it('proves every telescoping wall pair remains separated over the complete lift domain', () => {
    const source = new QuadrupedRobotSourceOwner().prepare(
      createSyntheticQuadrupedRobotDefinition()
    )
    const stages = source.parts.filter(
      (part) => part.id.startsWith('left-stage-') && part.id.endsWith('-shell')
    )
    expect(stages).toHaveLength(8)
    // Every stage axis is Y; immutable local XZ ranges are a full-domain oracle,
    // independent of lift samples and the pose implementation.
    const bounds = (
      part: (typeof stages)[number],
      region: (typeof stages)[number]['regions'][number],
      axis: number
    ) => {
      const values = part.shape.indices
        .slice(region.indexStart, region.indexStart + region.indexCount)
        .map((index) => part.shape.positions[index * 3 + axis])
      return [Math.min(...values), Math.max(...values)]
    }
    for (let i = 0; i < stages.length; i++)
      for (let j = i + 1; j < stages.length; j++)
        for (const first of stages[i].regions)
          for (const second of stages[j].regions)
            expect(
              [0, 2].some((axis) => {
                const a = bounds(stages[i], first, axis),
                  b = bounds(stages[j], second, axis)
                return a[1] < b[0] || b[1] < a[0]
              })
            ).toBe(true)
    for (const id of source.rig.stageJointIds.left) {
      const joint = required(source.rig.joints.find((joint) => joint.id === id))
      expect(joint.motion).toBe('prismatic')
      expect(joint.axis).toBe('y')
      expect(joint.frame.rotation).toEqual([0, 0, 0, 1])
    }
  })
  it('publishes outward positive-volume material for every original region', () => {
    const source = new QuadrupedRobotSourceOwner().prepare(
      createSyntheticQuadrupedRobotDefinition()
    )
    const failures: string[] = []
    for (const part of source.parts)
      for (const region of part.regions) {
        let volume6 = 0
        for (
          let offset = region.indexStart;
          offset < region.indexStart + region.indexCount;
          offset += 3
        ) {
          const [a, b, c] = part.shape.indices
            .slice(offset, offset + 3)
            .map((index) =>
              part.shape.positions.slice(index * 3, index * 3 + 3)
            )
          volume6 +=
            a[0] * (b[1] * c[2] - b[2] * c[1]) +
            a[1] * (b[2] * c[0] - b[0] * c[2]) +
            a[2] * (b[0] * c[1] - b[1] * c[0])
        }
        if (!(volume6 > 0)) failures.push(part.id + ':' + region.id)
      }
    expect(failures).toEqual([])
  })
  it('binds shoulder and sole interfaces to the authored ports and exact signed-axis material', () => {
    const source = new QuadrupedRobotSourceOwner().prepare(
      createSyntheticQuadrupedRobotDefinition()
    )
    const template = readQuadrupedTemplate(templateData)
    const shoulder = required(
      template.modules.find((module) => module.id === 'shoulder-yoke')
    )
    const port = required(
      shoulder.ports.find((port) => port.id === 'next-joint')
    )
    expect(port.position).toEqual([0, 0.14, 0.16])
    for (const chain of source.rig.armChains)
      expect(
        source.rig.joints.find((joint) => joint.id === chain.id + '-rootPitch')
          ?.frame.position
      ).toEqual(port.position)
    const footModule = required(
      template.modules.find((module) => module.id === 'foot-pad')
    )
    const permuted = footModule.positions.flatMap((_, i) =>
      i % 3 === 0
        ? [
            footModule.positions[i],
            footModule.positions[i + 2],
            -footModule.positions[i + 1]
          ]
        : []
    )
    for (const chain of source.rig.legChains) {
      const body = required(
        source.rig.bodies.find((body) => body.id === chain.terminalBodyId)
      )
      const foot = required(
        source.parts.find((part) => part.bodyId === body.id)
      )
      const carrier = required(
        source.parts.find((part) => part.id === chain.id + '-ankle-carrier')
      )
      expect(body.fixedFrame?.rotation).toEqual([0, 0, 0, 1])
      expect(foot.shape.positions).toEqual(permuted)
      expect(foot.shape.indices).toEqual(footModule.indices)
      const top =
        Math.min(...foot.shape.positions.filter((_, i) => i % 3 === 2)) +
        foot.localFrame.position[2] +
        required(body.fixedFrame).position[2]
      expect(top).toBe(
        Math.max(...carrier.shape.positions.filter((_, i) => i % 3 === 2))
      )
      const sole =
        Math.max(...foot.shape.positions.filter((_, i) => i % 3 === 2)) +
        foot.localFrame.position[2]
      expect(chain.activePoint).toEqual([0, 0, sole])
      expect(
        source.contacts.feet.find((contact) => contact.part === foot)
          ?.localFrame.position
      ).toEqual(chain.activePoint)
    }
  })
})
