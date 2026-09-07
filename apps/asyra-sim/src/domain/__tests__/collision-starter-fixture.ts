import { createSyntheticExample } from '../../../samples/synthetic-workcell'
import { createSyntheticExperimentPresets } from '../../../samples/synthetic-experiment'
import { createMechanicalVisuals } from '../../../samples/mechanical-visuals'
import { decodeRestrictedGlb, type VisualAsset } from '../../engine/glb/decode'
import { IDENTITY_POSE } from '../math'
import { resolvePartWorkcell } from '../part-geometry'
import { createExperimentSnapshot } from '../../analysis/snapshot'
import { ORIGINAL_PART_METHOD } from '../../analysis/methods/original-part-method'

export async function collisionStarterSnapshot() {
  const example = createSyntheticExample()
  const preset = createSyntheticExperimentPresets(example).find(
    (item) => item.name === 'Tool and table collision'
  )
  if (!preset) throw new Error('Missing collision starter experiment')
  const sources = new Map<string, VisualAsset>()
  for (const part of createMechanicalVisuals()) {
    const asset = await decodeRestrictedGlb(part.bytes)
    sources.set(asset.source.sha256, asset)
    const body = example.workcell.bodies.find(
      (item) => item.id === `example:${part.body}`
    )
    if (!body) throw new Error('Missing original sample body')
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
  const draft = preset.draft
  return createExperimentSnapshot({
    snapshotId: 'collision-starter',
    candidateId: 'candidate',
    experimentId: 'collision-study',
    workcell: resolvePartWorkcell(example.workcell, sources),
    definition: {
      ...draft,
      revision: 1,
      rule: { ...draft.rule, revision: 1 },
      method: {
        ...draft.method,
        id: ORIGINAL_PART_METHOD.id,
        version: ORIGINAL_PART_METHOD.version
      }
    },
    methods: [ORIGINAL_PART_METHOD],
    acknowledgedWarningCodes: []
  })
}
