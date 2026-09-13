import { expect, it } from 'vitest'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createRobotModel } from '../robot-model'
import {
  prepareRobotRig,
  evaluateRobotPose,
  REST_JOINTS,
  ROBOT_JOINT_LIMITS
} from '../robot-kinematics'

// Pre-switch evidence from the real Math-trig point entry. The later migration
// must preserve this snapshot as historical evidence, not overwrite its values.
const definitions = [
  DEFAULT_ROBOT,
  { ...DEFAULT_ROBOT, tool: 'tomato' as const },
  { ...DEFAULT_ROBOT, width: 0.35, length: 0.6, height: 0.8 },
  { ...DEFAULT_ROBOT, width: 2, length: 3, height: 3, tool: 'tomato' as const }
]
const poses = [
  REST_JOINTS,
  { lift: -0, yaw: -0, shoulder: -0, elbow: -0, wrist: -0 },
  { lift: -0, yaw: 0, shoulder: -0, elbow: 0, wrist: -0 },
  { lift: 0.037, yaw: -0.71, shoulder: 0.29, elbow: -0.83, wrist: 0.47 },
  ...Object.entries(ROBOT_JOINT_LIMITS).flatMap(([key, bounds]) =>
    bounds.map((value) => ({ ...REST_JOINTS, [key]: value }))
  )
]
function bits(values: readonly number[]) {
  const view = new DataView(new ArrayBuffer(8))
  return values
    .map((value) => {
      view.setFloat64(0, value)
      return view.getBigUint64(0).toString(16).padStart(16, '0')
    })
    .join(' ')
}

it('captures immutable pre-polynomial numeric point outputs for the original 56 fixtures', () => {
  expect(poses).toHaveLength(14)
  expect(bits([-0])).not.toBe(bits([0]))
  const evidence = definitions.map((definition) => {
    const rig = prepareRobotRig(definition, createRobotModel(definition))
    const bodies = [...new Set(rig.parts.map((part) => part.body))]
    return {
      // Store the invariant part/reference order once per definition.
      parts: rig.parts.map(
        (part) => `${part.source.id}:${part.body}:${bodies.indexOf(part.body)}`
      ),
      definition: [
        definition.width,
        definition.length,
        definition.height,
        definition.tool
      ],
      poses: poses.map((joints) => {
        const pose = evaluateRobotPose(rig, joints)
        const unique = [...new Set(pose.parts.map((part) => part.transform))]
        pose.parts.forEach((part, index) => {
          expect(part.source).toBe(rig.parts[index].source)
          expect(part.body).toBe(rig.parts[index].body)
          expect(unique.indexOf(part.transform)).toBe(bodies.indexOf(part.body))
          expect(part.transform).toBe(
            pose.parts.find((other) => other.body === part.body)?.transform
          )
        })
        return {
          joints: bits(Object.values(pose.joints)),
          transforms: unique.map((transform) => ({
            position: bits(transform.position),
            rotation: bits(transform.rotation)
          })),
          frames: Object.fromEntries(
            Object.entries(pose.frames).map(([key, value]) => [
              key,
              bits(value)
            ])
          ),
          tool: Object.fromEntries(
            Object.entries(pose.tool).map(([key, value]) => [key, bits(value)])
          )
        }
      })
    }
  })
  expect(evidence).toMatchSnapshot()
})
