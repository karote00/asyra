import {
  freezeSource,
  type QuadrupedRobotSourceOwner
} from './quadruped-robot-source'
import type { QuadrupedRobotPoseResult } from './quadruped-robot-kinematics'

const POSE_NAMES = ['travel', 'bilateralHarvest', 'basketPlacement'] as const
type ReviewPoseName = (typeof POSE_NAMES)[number]

/** Review is a projection of admitted original source and completed FK only. */
export function createQuadrupedSourceReview(
  owner: QuadrupedRobotSourceOwner,
  poses: Readonly<Record<ReviewPoseName, QuadrupedRobotPoseResult>>
) {
  const first = poses.travel
  const { source, mount } = first
  if (!owner.isCurrent(source) || !owner.isCurrentMount(mount))
    throw new Error('Stale source review')
  const partIds = new Set(first.parts.map((part) => part.id))
  if (
    partIds.size !== first.parts.length ||
    first.parts.length !== source.parts.length + mount.parts.length
  )
    throw new Error('Incomplete review material')
  for (const name of POSE_NAMES) {
    const pose = poses[name]
    if (
      !owner.isCurrentPose(pose) ||
      pose.source !== source ||
      pose.mount !== mount ||
      pose.parts.length !== first.parts.length ||
      pose.parts.some((part, index) => part !== first.parts[index]) ||
      pose.bodyTransforms.length !== source.rig.bodies.length
    )
      throw new Error('Foreign or incomplete review pose')
  }
  return freezeSource({
    format: 'quadruped-source-review/1' as const,
    sourceId: source.id,
    definition: source.definition,
    axes: {
      lateral: '+X',
      up: '+Y',
      longitudinal: '+Z',
      quaternion: 'xyzw'
    } as const,
    units: 'metre' as const,
    rig: {
      bodies: source.rig.bodies.map(({ parts, ...body }) => ({
        ...body,
        partIds: parts.map((part) => part.id)
      })),
      joints: source.rig.joints,
      armChains: source.rig.armChains,
      legChains: source.rig.legChains,
      stageJointIds: source.rig.stageJointIds
    },
    parts: first.parts.map((part) => ({
      id: part.id,
      sourceModuleId: part.sourceModuleId,
      bodyId: part.bodyId,
      kind: part.kind,
      localFrame: part.localFrame,
      material: part.material.material,
      shape: part.shape,
      regions: part.regions,
      patches: part.patches
    })),
    poses: POSE_NAMES.map((name) => ({
      name,
      joints: poses[name].joints,
      bodyTransforms: poses[name].bodyTransforms.map(
        ({ id, transform, frameChain }) => ({ id, transform, frameChain })
      ),
      frames: poses[name].frames
    }))
  })
}
