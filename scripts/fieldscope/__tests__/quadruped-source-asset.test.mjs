import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import test from 'node:test'
import {
  loadQuadrupedAsset,
  sha256,
  validateQuadrupedTemplate
} from '../quadruped-source-asset.mjs'
import {
  validateSourceModule,
  instantiateSourceModule
} from '../../../apps/fieldscope/src/domain/quadruped-source-template.ts'

const project = fileURLToPath(new URL('../../../', import.meta.url))
const templatePath =
  project + 'apps/fieldscope/src/domain/assets/quadruped-source-template-2.json'
const manifestPath =
  project + 'apps/fieldscope/assets/quadruped/source-manifest.json'
const blendPath =
  project + 'apps/fieldscope/assets/quadruped/side-stage-articulation-2.blend'
const asset = () => loadQuadrupedAsset(templatePath, manifestPath, blendPath)
const moduleFixture = () => ({
  id: 'closed-test',
  material: 'structural-metal',
  size: [1, 1, 1],
  positions: [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  indices: [0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 3, 2],
  regions: [
    {
      id: 'cell',
      kind: 'closed-solid',
      indexStart: 0,
      indexCount: 12,
      convex: true
    }
  ],
  patches: [
    {
      id: 'contact',
      regionId: 'cell',
      ranges: [{ indexStart: 9, indexCount: 3 }],
      witnessTriangle: 3
    }
  ],
  ports: [{ id: 'root', position: [0, 0, 0] }],
  dimensions: { kind: 'rigid', axes: [], min: [1, 1, 1], max: [1, 1, 1] },
  maxRepeat: 64
})
test('the unmodified material negative-test control is admitted', () => {
  const module = moduleFixture()
  assert.equal(validateSourceModule(module), module)
})
test('loads exact Blender-authored module bytes without a competing assembly graph', async () => {
  const { template } = await asset()
  assert.ok(template.modules.length > 30)
  for (const forbidden of ['bodies', 'joints', 'instances'])
    assert.equal(forbidden in template, false)
  for (const module of template.modules)
    assert.equal(validateSourceModule(module), module)
})
test('rejects the retained first candidate instead of silently adapting its invalid rig', async () => {
  const rejected = JSON.parse(
    await readFile(
      project +
        'apps/fieldscope/src/domain/assets/quadruped-source-template-1.json',
      'utf8'
    )
  )
  assert.throws(() => validateQuadrupedTemplate(rejected), /Unsupported/)
})
test('rejects global instances and repeats whose extrema could escape canonical source width checks', async () => {
  const { template } = await asset()
  assert.throws(
    () =>
      validateQuadrupedTemplate({
        ...template,
        instances: [{ repeat: { count: 3, step: [0.5, 0, 0] } }]
      }),
    /Unsupported/
  )
})
test('axial links retain fixed end caps and exact root/tip ports when the span changes', async () => {
  const { template } = await asset()
  const module = template.modules.find((item) => item.id === 'link-assembly')
  assert.ok(module)
  const next = instantiateSourceModule(module, [0.14, 0.08, 0.8])
  for (let index = 0; index < module.positions.length; index++) {
    let expected = module.positions[index]
    if (index % 3 === 2)
      expected += 0.4 * module.axialWeights[Math.floor(index / 3)]
    assert.equal(next.positions[index], expected)
  }
  assert.deepEqual(
    next.ports.find((port) => port.id === 'root').position,
    [0, 0, 0]
  )
  assert.deepEqual(
    next.ports.find((port) => port.id === 'tip').position,
    [0, 0, 0.8]
  )
  assert.throws(
    () => instantiateSourceModule(module, [0.15, 0.08, 0.8]),
    /dimensions/
  )
})
test('rigid feet and tools cannot be stretched to fit a definition', async () => {
  const { template } = await asset()
  for (const id of [
    'foot-pad',
    'holder-palm',
    'cutter-guard',
    'bearing-main-housing'
  ]) {
    const module = template.modules.find((item) => item.id === id)
    assert.ok(module)
    assert.throws(
      () =>
        instantiateSourceModule(
          module,
          module.size.map((value) => value * 1.01)
        ),
      /dimensions/
    )
  }
})
function triangle(module, offset) {
  const [a, b, c] = module.indices
    .slice(offset, offset + 3)
    .map((index) => module.positions.slice(index * 3, index * 3 + 3))
  const u = b.map((value, axis) => value - a[axis]),
    v = c.map((value, axis) => value - a[axis])
  return {
    a,
    b,
    c,
    n: [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ]
  }
}
test('every original axis-aligned triangle has its complete oriented face tag', async () => {
  const { template } = await asset()
  // H4 replaces the fork palm and guard cells as one admitted geometry candidate.
  // The original oriented-face oracle below remains independent of these tags.
  assert.equal(
    sha256(
      JSON.stringify(template.modules.map(({ patches, ...module }) => module))
    ),
    '5bbec72f1ac862609dceec02d81736a26630fc67695af84e894ffa96c8591fa8'
  )
  let checked = 0
  for (const module of template.modules) {
    for (let offset = 0; offset < module.indices.length; offset += 3) {
      const { a, b, c, n } = triangle(module, offset)
      for (const [axis, label] of ['x', 'y', 'z'].entries()) {
        if (a[axis] !== b[axis] || a[axis] !== c[axis]) continue
        assert.notEqual(n[axis], 0, 'Non-degenerate original axis face')
        const tag = label + (n[axis] > 0 ? '-high-' : '-low-')
        assert.ok(
          module.patches.some(
            (patch) =>
              patch.id.startsWith(tag) &&
              patch.ranges.some(
                (range) =>
                  offset >= range.indexStart &&
                  offset + 3 <= range.indexStart + range.indexCount
              )
          ),
          module.id + ': ' + tag + offset
        )
        checked++
      }
    }
  }
  assert.ok(checked > 100)
})
test('every telescoping stage has a real empty cavity in its original material', async () => {
  const { template } = await asset()
  const stages = template.modules.filter(
    (item) =>
      item.id === 'stage-housing' || /^stage-segment-[1-7]$/.test(item.id)
  )
  assert.equal(stages.length, 8)
  for (const module of stages) {
    const containsOrigin = module.regions.some((region) => {
      for (
        let offset = region.indexStart;
        offset < region.indexStart + region.indexCount;
        offset += 3
      ) {
        const { a, n } = triangle(module, offset)
        if (n.reduce((sum, value, axis) => sum - value * a[axis], 0) > 0)
          return false
      }
      return true
    })
    assert.equal(containsOrigin, false, module.id)
    assert.ok(module.patches.some((patch) => patch.id.startsWith('cavity-')))
  }
})
test('bearing cavity patches face the cavity, never an internal sector seam', async () => {
  const { template } = await asset()
  for (const module of template.modules.filter(
    (item) =>
      item.id.startsWith('bearing-') &&
      !item.id.endsWith('back-cap') &&
      !item.id.endsWith('outer-cap')
  )) {
    const patches = module.patches.filter((patch) =>
      patch.id.startsWith('cavity-')
    )
    assert.ok(patches.length, module.id)
    for (const patch of patches)
      for (const range of patch.ranges)
        for (
          let offset = range.indexStart;
          offset < range.indexStart + range.indexCount;
          offset += 3
        ) {
          const { a, b, c, n } = triangle(module, offset)
          assert.ok(
            n[1] * (a[1] + b[1] + c[1]) + n[2] * (a[2] + b[2] + c[2]) < 0,
            module.id
          )
        }
  }
})
test('rejects individually open regions even when their union is closed', () => {
  const module = moduleFixture()
  module.positions = module.positions.map((coordinate) => coordinate - 0.25)
  module.regions = [0, 6].map((indexStart, index) => ({
    id: 'cell-' + index,
    kind: 'closed-solid',
    indexStart,
    indexCount: 6,
    convex: true
  }))
  module.patches = []
  assert.throws(() => validateSourceModule(module), /region|manifold/i)
})
test('rejects coordinate-degenerate triangles with distinct indices', () => {
  const module = moduleFixture()
  module.positions.push(...module.positions.map((value) => value + 2))
  module.indices.push(...module.indices.map((index) => index + 4))
  module.regions[0].indexCount = 24
  module.regions[0].convex = false
  module.positions.splice(0, 3, ...module.positions.slice(3, 6))
  assert.throws(() => validateSourceModule(module), /Degenerate/)
})
for (const [name, mutate, reason] of [
  ['non-finite coordinates', (m) => (m.positions[0] = NaN), /Invalid/],
  [
    'open material',
    (m) => {
      m.indices.splice(0, 3)
      m.regions[0].indexCount = 9
      m.patches = []
    },
    /manifold/
  ],
  [
    'inward material',
    (m) => {
      m.regions[0].convex = false
      for (let i = 0; i < m.indices.length; i += 3)
        [m.indices[i + 1], m.indices[i + 2]] = [
          m.indices[i + 2],
          m.indices[i + 1]
        ]
    },
    /Non-positive/
  ],
  [
    'invalid patch membership',
    (m) => (m.patches[0].ranges[0].indexStart = 99),
    /Patch/
  ],
  ['false patch witness', (m) => (m.patches[0].witnessTriangle = 0), /witness/],
  [
    'false convexity',
    (m) => {
      m.positions.push(0.2, 0.2, 0.2)
      m.indices.splice(0, 3, 0, 1, 4, 1, 2, 4, 2, 0, 4)
      m.regions[0].indexCount = 18
      m.patches = []
    },
    /convex/
  ],
  ['unbounded repeat', (m) => (m.maxRepeat = Infinity), /policy/]
])
  test('rejects ' + name, () => {
    const module = moduleFixture()
    mutate(module)
    assert.throws(() => validateSourceModule(module), reason)
  })
