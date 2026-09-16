import assert from 'node:assert/strict'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import { createSyntheticExperimentDraft } from '../../../../samples/synthetic-experiment'
import { createMechanicalVisuals } from '../../../../samples/mechanical-visuals'
import { decodeRestrictedGlb } from '../../../engine/glb/decode'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  resolvePartWorkcell,
  type PartSource
} from '../../../domain/part-geometry'
import { INSTALLED_METHOD_CATALOG } from '../../../extensions/installed-methods'
import { ORIGINAL_PART_METHOD } from '../original-part-method'
import { DEFAULT_EXPERIMENT_BUDGET } from '../../contracts'
import { createExperimentSnapshot } from '../../snapshot'
import { preflightExperiment } from '../../preflight'

export async function representativeSnapshot(candidate: number) {
  const example = createSyntheticExample()
  const sources = new Map<string, PartSource>()
  for (const source of createMechanicalVisuals()) {
    const asset = await decodeRestrictedGlb(source.bytes)
    sources.set(asset.source.sha256, asset)
    const body = example.workcell.bodies.find(
      (body) => body.id === `example:${source.body}`
    )
    if (!body) throw new Error('Missing original part target')
    body.visuals = [
      {
        version: 1,
        id: 'main-body',
        assetId: asset.source.sha256,
        pose: IDENTITY_POSE,
        scale: [1, 1, 1]
      }
    ]
    body.colliders = []
  }
  const post = example.workcell.bodies.find(
    (body) => body.name === 'fixture post'
  )
  if (!post) throw new Error('Missing fixture post')
  // Keep both supplied fixtures and add 28 full original posts around the cell.
  for (let index = 0; index < 28; index++) {
    const fixture = structuredClone(post)
    fixture.id = `obstacle-${index}`
    fixture.name = `Obstacle ${index + 1}`
    fixture.pose.position = [
      -1.5 + (index % 7) * 0.5 + candidate * 0.05,
      post.pose.position[1],
      -1 + Math.floor(index / 7) * 0.5
    ]
    example.workcell.bodies = [...example.workcell.bodies, fixture]
  }
  const original = example.trajectory.keyframes
  example.trajectory.keyframes = Array.from({ length: 200 }, (_, index) => {
    const time = (8 * index) / 199
    const first = time <= 4 ? original[0] : original[1]
    const last = time <= 4 ? original[1] : original[2]
    const ratio = (time - first.time) / (last.time - first.time)
    return {
      time,
      joints: Object.fromEntries(
        Object.entries(first.joints).map(([id, value]) => [
          id,
          value + (last.joints[id] - value) * ratio
        ])
      )
    }
  })
  const draft = createSyntheticExperimentDraft(example)
  const workcell = resolvePartWorkcell(example.workcell, sources)
  const definition = {
    ...draft,
    revision: 1,
    method: {
      ...draft.method,
      id: ORIGINAL_PART_METHOD.id,
      version: ORIGINAL_PART_METHOD.version
    },
    rule: { ...draft.rule, revision: 1 },
    budget: { ...DEFAULT_EXPERIMENT_BUDGET }
  }
  const admission = preflightExperiment(
    workcell,
    definition,
    INSTALLED_METHOD_CATALOG.descriptors
  )
  assert.deepEqual(admission.blockers, [])
  assert.equal(
    workcell.bodies.filter((body) => body.role === 'fixture').length,
    30
  )
  assert.equal(
    workcell.bodies.filter((body) => body.joint.kind !== 'fixed').length,
    6
  )
  assert.equal(definition.trajectory.keyframes.length, 200)
  return createExperimentSnapshot({
    snapshotId: `representative-${candidate}`,
    candidateId: `candidate-${candidate}`,
    experimentId: 'representative-study',
    workcell,
    definition,
    methods: INSTALLED_METHOD_CATALOG.descriptors,
    acknowledgedWarningCodes: admission.resourceWarnings.map(
      (warning) => warning.code
    )
  })
}
