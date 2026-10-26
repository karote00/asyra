/** Supply approved analytic side-panel solids to background Blender. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import furniture from '../../../assets/asyra-office/models/furniture/furniture-model-spec.json'
const chair = furniture.modules.find((m) => m.moduleId === 'lounge-armchair')
if (!chair) throw new Error('Missing approved armchair')
const components = chair.components.filter(
  (c) => c.primitive === 'upholstered-profile-panel'
)
if (components.length !== 2)
  throw new Error('Armchair requires two independent side panels')
const panels = components.map((c) => ({ id: c.partId }))
mkdirSync('tmp/blender', { recursive: true })
writeFileSync(
  'tmp/blender/armchair-panels-input.json',
  JSON.stringify({
    components,
    sourceSha256: createHash('sha256')
      .update(JSON.stringify(components))
      .digest('hex'),
    panels
  })
)
