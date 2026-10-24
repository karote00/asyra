import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'

import {
  checkPublicDocumentation,
  createPublicDocumentationBundle,
  publicApiEntries,
  WEBSITE_LLM_DISCOVERY_PATH
} from '../public-documentation.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)

const declaredPages = JSON.parse(
  fs.readFileSync(
    path.join(repositoryRoot, 'docs/public/content-manifest.json'),
    'utf8'
  )
).pages

test('public API inventories use source exports regardless of dependency build state', (context) => {
  const temporaryRoot = path.join(repositoryRoot, 'tmp')
  fs.mkdirSync(temporaryRoot, { recursive: true })
  const fixtureRoot = fs.mkdtempSync(path.join(temporaryRoot, 'public-api-'))
  context.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }))
  const write = (relativePath, source) => {
    const destination = path.join(fixtureRoot, relativePath)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, source)
  }
  const packages = ['consumer', 'provider'].map((directory) => ({
    directory,
    name: `@fixture/${directory}`,
    manifestPath: `packages/${directory}/package.json`,
    publicEntries: ['.', './contracts']
  }))
  for (const record of packages) {
    write(
      record.manifestPath,
      JSON.stringify({
        name: record.name,
        type: 'module',
        exports: {
          '.': { types: './dist/index.d.ts' },
          './contracts': { types: './dist/contracts.d.ts' }
        }
      })
    )
  }
  write(
    'packages/provider/src/index.ts',
    'export class Provider { current = true }'
  )
  write(
    'packages/provider/src/contracts.ts',
    'export interface Contract { current: boolean }'
  )
  write('packages/consumer/src/index.ts', "export * from '@fixture/provider'")
  write(
    'packages/consumer/src/contracts.ts',
    "export * from '@fixture/provider/contracts'"
  )
  fs.mkdirSync(path.join(fixtureRoot, 'node_modules/@fixture'), {
    recursive: true
  })
  fs.symlinkSync(
    '../../packages/provider',
    path.join(fixtureRoot, 'node_modules/@fixture/provider')
  )
  const expected = [
    { members: ['current'], path: '.', symbols: ['Provider'] },
    { members: ['current'], path: './contracts', symbols: ['Contract'] }
  ]
  for (const state of ['missing', 'stale', 'current']) {
    if (state !== 'missing') {
      const member = state === 'stale' ? 'outdated' : 'current'
      write(
        'packages/provider/dist/index.d.ts',
        `export declare class Provider { ${member}: boolean }`
      )
      write(
        'packages/provider/dist/contracts.d.ts',
        `export interface Contract { ${member}: boolean }`
      )
    }
    const entries = publicApiEntries({
      packageReference: { packages },
      repositoryRoot: fixtureRoot
    })
    assert.deepEqual(entries.get('@fixture/consumer'), expected, state)
    assert.deepEqual(entries.get('@fixture/provider'), expected, state)
  }
})

test('public indexes derive the exact page, source, and API inventories', async () => {
  const bundle = await createPublicDocumentationBundle({ repositoryRoot })

  assert.equal(bundle.contentIndex.schemaVersion, 1)
  assert.equal(bundle.contentIndex.pages.length, declaredPages.length)
  assert.equal(bundle.sourceMap.pages.length, declaredPages.length)
  assert.equal(bundle.apiIndex.packages.length, 19)
  assert.deepEqual(
    bundle.contentIndex.sections.map(({ id }) => id),
    ['overview', 'start', 'concepts', 'extend', 'customize', 'reference']
  )
  const sections = Object.fromEntries(
    bundle.contentIndex.sections.map(({ id, pageIds }) => [id, pageIds])
  )
  assert.deepEqual(sections.start, [
    'start/create-design-app',
    'start/preset-2d',
    'cases/asyra-design'
  ])
  assert.deepEqual(sections.concepts, [
    'learn/information-models',
    'learn/intent-and-features',
    'learn/canonical-state',
    'learn/transactions-and-durability',
    'learn/validation-load-migration',
    'learn/projection-registration-replacement',
    'learn/runtime-boundaries-roadmap'
  ])
  assert.deepEqual(
    sections.extend,
    declaredPages
      .filter((page) => page.section === 'Extend')
      .map((page) => page.id)
  )

  assert.deepEqual(sections.customize, [
    'start/custom-composition',
    'build/render-boundary'
  ])

  for (const page of bundle.contentIndex.pages) {
    assert.match(page.contentSha256, /^[a-f0-9]{64}$/)
    assert.ok(page.wordCount > 0)
    assert.ok(page.headings.length > 1)
    assert.ok(fs.existsSync(path.join(repositoryRoot, page.markdownPath)))
    assert.equal('examples' in page, false)
  }
  for (const page of bundle.sourceMap.pages) {
    assert.ok(page.sources.length > 0)
    for (const source of page.sources) {
      assert.match(source.sha256, /^[a-f0-9]{64}$/)
      assert.ok(fs.existsSync(path.join(repositoryRoot, source.path)))
      assert.doesNotMatch(
        source.path,
        /\/(audits|decisions|plans\/completed|task-breakdowns)\//
      )
    }
  }
  for (const packageRecord of bundle.apiIndex.packages) {
    assert.deepEqual(
      packageRecord.entries.map(({ path: entryPath }) => entryPath),
      packageRecord.publicEntries
    )
    for (const entry of packageRecord.entries) {
      if (entry.path.endsWith('.css')) {
        assert.deepEqual(entry.symbols, [])
        assert.deepEqual(entry.members, [])
      } else {
        assert.ok(entry.symbols.length > 0)
        assert.deepEqual(entry.symbols, [...entry.symbols].sort())
        assert.deepEqual(entry.members, [...entry.members].sort())
      }
    }
  }
  const core = bundle.apiIndex.packages.find(
    ({ name }) => name === '@asyra/core'
  )
  assert.ok(
    core.entries
      .find(({ path: entryPath }) => entryPath === '.')
      .symbols.includes('Core')
  )
  assert.ok(
    core.entries
      .find(({ path: entryPath }) => entryPath === './contracts')
      .symbols.includes('SharedPublication')
  )
  assert.ok(
    core.entries
      .find(({ path: entryPath }) => entryPath === '.')
      .members.includes('defineSystemProperty')
  )
})

test('llms discovery gives the published Starter command and current/future boundary', async () => {
  const { llms } = await createPublicDocumentationBundle({ repositoryRoot })

  assert.match(llms, /^# Asyra Framework/m)
  assert.ok(llms.includes(`${declaredPages.length} public Markdown pages`))
  assert.match(llms, /Current: browser\/Core/)
  assert.match(llms, /Future: Headless Core and Core Kernel/)
  assert.match(
    llms,
    /npx create-asyra-app@0\.1\.0 my-app --package-manager=npm/u
  )
  assert.match(llms, /Node\.js 24; npm and Yarn are supported/u)
  assert.match(llms, /\]\(index\.md#generic-starter-source\)/u)
  assert.doesNotMatch(llms, /docs\/ai\//)
  assert.doesNotMatch(llms, /AI_PROVIDER_API_KEY|ws:\/\/|package-private/)
  assert.equal((llms.match(/^- \[/gm) ?? []).length, declaredPages.length)
})

test('checked public documentation artifacts are deterministic and current', async () => {
  const bundle = await checkPublicDocumentation({ repositoryRoot })
  assert.equal(bundle.contentIndex.pages.length, declaredPages.length)
  assert.equal(bundle.apiIndex.packages.length, 19)
  assert.equal(
    fs.readFileSync(
      path.join(repositoryRoot, WEBSITE_LLM_DISCOVERY_PATH),
      'utf8'
    ),
    bundle.websiteLlms
  )
})

test('website llms links resolve to documentation routes while repository links resolve to files', async () => {
  const { contentIndex, llms } = await createPublicDocumentationBundle({
    repositoryRoot
  })
  const websiteLlms = fs.readFileSync(
    path.join(repositoryRoot, WEBSITE_LLM_DISCOVERY_PATH),
    'utf8'
  )
  const pageLinks = (source) => [
    ...source.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)/gm)
  ]
  const websiteLinks = pageLinks(websiteLlms)
  const repositoryLinks = pageLinks(llms)
  assert.equal(websiteLinks.length, contentIndex.pages.length)
  assert.equal(repositoryLinks.length, contentIndex.pages.length)
  for (const [index, page] of contentIndex.pages.entries()) {
    const [, title, href] = websiteLinks[index]
    assert.equal(title, page.title)
    assert.equal(
      new URL(href, 'https://example.invalid/llms.txt').pathname,
      page.id === 'overview' ? '/docs' : `/docs/${page.id}`
    )
    assert.equal(repositoryLinks[index][2], page.path)
    assert.ok(
      fs.existsSync(
        path.join(repositoryRoot, 'docs/public', repositoryLinks[index][2])
      )
    )
  }
})

test('update guides are discoverable and Text instructions resolve public package APIs', async () => {
  const { apiIndex, contentIndex, llms } =
    await createPublicDocumentationBundle({
      repositoryRoot
    })
  const guideId = 'updates/text-official-fields-example-1-r3'
  const guide = contentIndex.pages.find(({ id }) => id === guideId)
  assert.ok(guide)
  assert.match(llms, /\]\(updates\/index\.md\)/)
  assert.ok(llms.includes(`](${guideId}.md)`))
  const source = fs.readFileSync(
    path.join(repositoryRoot, guide.markdownPath),
    'utf8'
  )
  for (const [name, required] of [
    [
      '@asyra/core',
      [
        'getPropertyTypeDefinition',
        'redefinePropertyType',
        'getComponentPropertyRelations',
        'removeComponentPropertyRelation',
        'defineComponentPropertyRelation',
        'registerLoadHook'
      ]
    ],
    ['@asyra/utils', ['createDefaultFill']],
    [
      '@asyra/preset',
      [
        'TEXT_PROPERTY_SCHEMA',
        'TEXT_PROPERTY_DEFINITION',
        'TEXT_COMPONENT_DEFINITION',
        'TEXT_COMPONENT_TYPE',
        'TEXT_PROPERTY_TYPE',
        'TEXT_RENDER_STRATEGY'
      ]
    ]
  ]) {
    const entry = apiIndex.packages
      .find((item) => item.name === name)
      .entries.find((item) => item.path === '.')
    const available = new Set([...entry.members, ...entry.symbols])
    for (const api of required) {
      assert.ok(available.has(api), `${name} must expose ${api}`)
      assert.ok(source.includes(api), `Text guide must name ${api}`)
    }
  }
  const target = source.match(
    /target is official Text at source commit\s+`([a-f0-9]{40})`/
  )[1]
  const references = [
    ...source.matchAll(
      /\]\(https:\/\/github\.com\/karote00\/asyra\/blob\/([a-f0-9]{40})\/([^)]+)\)/g
    )
  ]
  assert.ok(references.length >= 10)
  for (const [, revision] of references) assert.equal(revision, target)
  for (const owner of ['core', 'preset']) {
    assert.ok(
      references.some(([, , file]) => file === `packages/${owner}/package.json`)
    )
    assert.ok(
      references.some(([, , file]) => file === `packages/${owner}/src/index.ts`)
    )
  }
  assert.match(source, /first independent acceptance\s+used revision 2/)
  assert.match(source, /npm Preset 0\.5\.8 lacks the required Text exports/)
  assert.ok(
    contentIndex.pages.some(
      ({ id }) => id === 'updates/text-official-fields-example-1-r2'
    )
  )
  assert.match(
    source,
    /supersedes \[revision 2\]\(text-official-fields-example-1-r2\.md\)/
  )
  const index = fs.readFileSync(
    path.join(repositoryRoot, 'docs/public/updates/index.md'),
    'utf8'
  )
  assert.ok(index.includes(`](${path.basename(guideId)}.md)`))
  assert.doesNotMatch(source, /Task [1-4]/)
})

test('revision 2 summaries retain the passed independent result and its limits', async () => {
  const { contentIndex, llms, websiteLlms } =
    await createPublicDocumentationBundle({ repositoryRoot })
  const guideId = 'updates/text-official-fields-example-1-r2'
  const guide = contentIndex.pages.find(({ id }) => id === guideId)
  assert.ok(guide)
  for (const summary of [
    guide.description,
    llms.split('\n').find((line) => line.includes(`](${guideId}.md)`)),
    websiteLlms.split('\n').find((line) => line.includes(`](/docs/${guideId})`))
  ]) {
    assert.equal(typeof summary, 'string')
    assert.match(summary, /independent local-candidate acceptance passed/)
    assert.match(
      summary,
      /published-package support and subsequent updates remain unverified/
    )
    assert.doesNotMatch(summary, /independent integration remains pending/)
  }
})

test('subsequent update discovery reports the modeled artifact and independent acceptance separately', async () => {
  const { contentIndex, llms, websiteLlms } =
    await createPublicDocumentationBundle({ repositoryRoot })
  const guideId = 'updates/text-spacing-example-2-r1'
  const guide = contentIndex.pages.find(({ id }) => id === guideId)
  assert.ok(guide)
  const source = fs.readFileSync(
    path.join(repositoryRoot, guide.markdownPath),
    'utf8'
  )
  const fixture = path.join(
    repositoryRoot,
    'fixtures/app-update-text-subsequent'
  )
  const artifact = JSON.parse(
    fs.readFileSync(path.join(fixture, 'updates/model-artifact.json'), 'utf8')
  )
  const delivered = fs.readFileSync(
    path.join(fixture, 'updates/text-spacing-example-2-r1.md'),
    'utf8'
  )
  for (const record of [artifact.from, artifact.to]) {
    assert.ok(source.includes(record.sha256))
    assert.ok(delivered.includes(record.sha256))
  }
  assert.match(source, /test-only derived artifact/)
  assert.match(source, /29 passing tests/)
  assert.match(delivered, /Independent acceptance is pending/)
  for (const summary of [
    guide.description,
    llms.split('\n').find((line) => line.includes(`](${guideId}.md)`)),
    websiteLlms.split('\n').find((line) => line.includes(`](/docs/${guideId})`))
  ]) {
    assert.match(
      summary,
      /fresh-AI local-candidate acceptance passed with 29 tests/
    )
    assert.match(summary, /not a published release comparison/)
  }
  assert.match(source, /App document versions 1\/2/)
  assert.match(source, /previous session's undo stack is not promised/)
})

test('revision 2 subsequent guide distinguishes the independent run and context rerun with a retained delivery', async () => {
  const { contentIndex, llms, websiteLlms } =
    await createPublicDocumentationBundle({ repositoryRoot })
  const guideId = 'updates/text-spacing-example-2-r2'
  const guide = contentIndex.pages.find(({ id }) => id === guideId)
  assert.ok(guide, 'Revision 2 must be discoverable')
  for (const summary of [
    guide.description,
    llms.split('\n').find((line) => line.includes(`](${guideId}.md)`)),
    websiteLlms.split('\n').find((line) => line.includes(`](/docs/${guideId})`))
  ]) {
    assert.match(summary, /revision 1 independent acceptance: 29 tests/)
    assert.match(summary, /revision 2 existing-context rerun: 34 tests/)
    assert.match(summary, /not a new independent acceptance/)
  }
  const source = fs.readFileSync(
    path.join(repositoryRoot, guide.markdownPath),
    'utf8'
  )
  assert.doesNotMatch(source, /<a\s/)
  assert.match(source, /TypeScript patch warning/)
  assert.match(source, /not been published/)
  for (const name of [
    'text-spacing-r2-independent.tar.gz',
    'text-spacing-r2-independent.tar.gz.sha256',
    'TASK-PROMPT.md'
  ]) {
    assert.ok(source.includes(`delivery/revision-2/${name}`))
    assert.ok(
      fs.existsSync(
        path.join(
          repositoryRoot,
          'fixtures/app-update-text-subsequent/delivery/revision-2',
          name
        )
      )
    )
  }
  const index = fs.readFileSync(
    path.join(repositoryRoot, 'docs/public/updates/index.md'),
    'utf8'
  )
  assert.match(
    index,
    /\[subsequent Text update\]\(text-spacing-example-2-r2\.md\)/
  )
  assert.ok(index.includes('(text-spacing-example-2-r1.md)'))
})

function releaseHistoryFixture() {
  const guide = 'updates/range-fixture-guide.md'
  const sources = new Map([
    [
      guide,
      '# Modeled guide\n\n## Canonical sources\n\nKeep custom fields, reads, writes, projections and saved data.\n'
    ]
  ])
  const pages = [{ id: guide.slice(0, -3), path: guide }]
  const record = (id, previous, extra = {}) => ({
    id,
    owner: '@fixture/core',
    channel: 'npm',
    previous,
    ...(previous
      ? {}
      : {
          boundary:
            'First verified fixture boundary; earlier history is unsupported.'
        }),
    status: 'verified',
    target: {
      version: id,
      sourceSha: 'a'.repeat(40),
      integrity: `sha512-${id}`
    },
    evidence: ['https://example.test/permanent/release-evidence'],
    requires: [],
    changes: [
      {
        change: id,
        summary: `Modeled ${id} change`,
        impact: 'integration',
        reason: 'Inspect custom fields and data',
        guides: [guide]
      }
    ],
    ...extra
  })
  const entries = [
    record('first', null),
    record('second', 'first'),
    record('third', 'second')
  ]
  const bundle = async () => {
    const { createHash } = await import('node:crypto')
    for (const item of entries) {
      item.guideHashes = Object.fromEntries(
        item.changes
          .flatMap((change) => change.guides)
          .map((file) => [
            file,
            createHash('sha256')
              .update(JSON.stringify(sources.get(file) ?? ''))
              .digest('hex')
          ])
      )
      const file = `updates/releases/${item.id}.md`
      sources.set(
        file,
        '# Modeled release fixture\n\n```release-summary\n' +
          JSON.stringify(item) +
          '\n```\n\n## Canonical sources\n'
      )
      if (!pages.some((page) => page.path === file))
        pages.push({ id: file.slice(0, -3), path: file, title: item.id })
    }
    return { pages, read: (file) => sources.get(file) }
  }
  return { guide, sources, pages, entries, record, bundle }
}

test('durable release records support multi-release and earlier pending adoption without chat context', async () => {
  const { readReleaseHistory, selectReleaseUpdates, renderReleaseHistory } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  const intermediateGuide = 'updates/intermediate-fixture-guide.md'
  f.sources.set(intermediateGuide, f.sources.get(f.guide))
  f.pages.push({ path: intermediateGuide })
  f.entries[1].changes[0].guides = [intermediateGuide]
  const history = readReleaseHistory(await f.bundle())
  const selected = selectReleaseUpdates(history, {
    from: 'first',
    to: 'third',
    pending: []
  })
  assert.deepEqual(selected.releases, ['second', 'third'])
  assert.deepEqual(selected.guides, [intermediateGuide, f.guide])
  assert.deepEqual(selected.gaps, [])
  const resumed = selectReleaseUpdates(history, {
    from: 'third',
    to: 'third',
    pending: ['second']
  })
  assert.ok(resumed.releases.includes('second'))
  assert.ok(
    resumed.releases.indexOf('first') < resumed.releases.indexOf('second')
  )
  assert.ok(resumed.guides.includes(f.guide))
  assert.ok(resumed.guides.includes(intermediateGuide))
  assert.equal(
    selectReleaseUpdates(history, { from: 'first', to: 'third' })
      .needsInspection,
    true
  )
  assert.match(
    renderReleaseHistory(history),
    /updates\/releases\/second\.md|releases\/second\.md/
  )
  assert.match(renderReleaseHistory([]), /No verified release summaries/)
})

test('release discovery reports unsupported ranges, unavailable targets and incompatible prerequisites', async () => {
  const { readReleaseHistory, selectReleaseUpdates } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  f.entries.push(
    f.record('app', null, { owner: '@fixture/app', requires: ['third'] })
  )
  const history = readReleaseHistory(await f.bundle())
  assert.match(
    selectReleaseUpdates(history, {
      from: 'missing',
      to: 'third',
      pending: []
    }).gaps.join(' '),
    /baseline/
  )
  assert.match(
    selectReleaseUpdates(history, {
      from: 'first',
      to: 'missing',
      pending: []
    }).gaps.join(' '),
    /target/
  )
  assert.match(
    selectReleaseUpdates(history, {
      from: 'app',
      to: 'app',
      pending: [],
      dependencies: {
        'npm:@fixture/core': { from: 'first', to: 'second', pending: [] }
      }
    }).gaps.join(' '),
    /Incompatible prerequisite/
  )
  f.entries[2].status = 'candidate'
  assert.match(
    selectReleaseUpdates(readReleaseHistory(await f.bundle()), {
      from: 'first',
      to: 'third',
      pending: []
    }).gaps.join(' '),
    /unavailable/
  )
})

test('release validation rejects missing middle records, missing or changed guides and cyclic history', async () => {
  const { readReleaseHistory } = await import('../release-history.mjs')
  for (const mutation of ['middle', 'guide', 'hash', 'cycle', 'dependency']) {
    const f = releaseHistoryFixture()
    const inputs = await f.bundle()
    if (mutation === 'middle')
      inputs.pages = inputs.pages.filter(
        (page) => !page.path.endsWith('/second.md')
      )
    if (mutation === 'guide') f.sources.delete(f.guide)
    if (mutation === 'hash')
      f.sources.set(f.guide, '# Changed guide after release')
    if (mutation === 'cycle') {
      f.entries[0].previous = 'third'
      await f.bundle()
    }
    if (mutation === 'dependency') {
      f.entries[2].requires = ['missing']
      await f.bundle()
    }
    assert.throws(
      () => readReleaseHistory(inputs),
      /Missing|changed|cycle/i,
      mutation
    )
  }
})

test('guide corrections preserve old records and required changes', async () => {
  const { readReleaseHistory, selectReleaseUpdates } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  const correction = {
    ...f.entries[1],
    id: 'second-corrected',
    supersedes: 'second',
    correction: 'Clarify retained data verification'
  }
  f.entries.push(correction)
  const history = readReleaseHistory(await f.bundle())
  assert.equal(history.length, 4)
  assert.ok(
    selectReleaseUpdates(history, {
      from: 'first',
      to: 'third',
      pending: []
    }).releases.includes('second-corrected')
  )
  correction.changes = []
  const invalid = await f.bundle()
  assert.throws(() => readReleaseHistory(invalid), /required changes/)
})

test('adopted guide revisions remain distinct from later corrections', async () => {
  const { readReleaseHistory, selectReleaseUpdates } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  const guide = 'updates/corrected-guide.md'
  f.sources.set(guide, f.sources.get(f.guide))
  f.pages.push({ path: guide })
  f.entries.push({
    ...f.entries[1],
    id: 'second-r2',
    supersedes: 'second',
    correction: 'Add data preservation checks',
    changes: [{ ...f.entries[1].changes[0], guides: [guide] }]
  })
  const history = readReleaseHistory(await f.bundle())
  for (const to of ['second', 'third']) {
    const result = selectReleaseUpdates(history, {
      from: 'second',
      to,
      pending: []
    })
    assert.ok(result.releases.includes('second-r2'))
    assert.ok(result.guides.includes(guide))
    assert.equal(result.needsInspection, true)
    assert.deepEqual(result.gaps, [])
  }
  const alreadyAdopted = selectReleaseUpdates(history, {
    from: 'second-r2',
    to: 'third',
    pending: []
  })
  assert.deepEqual(alreadyAdopted.releases, ['third'])
  assert.equal(alreadyAdopted.needsInspection, false)
  assert.equal(history.find((r) => r.id === 'second').id, 'second')
})

test('prerequisites include their own cross-version and pending guides', async () => {
  const { readReleaseHistory, selectReleaseUpdates } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  const intermediate = 'updates/dependency-middle.md'
  f.sources.set(intermediate, f.sources.get(f.guide))
  f.pages.push({ path: intermediate })
  f.entries[1].changes[0].guides = [intermediate]
  f.entries.push(
    f.record('app', null, { owner: '@fixture/app', requires: ['third'] })
  )
  const history = readReleaseHistory(await f.bundle())
  const dependencies = {
    'npm:@fixture/core': { from: 'first', to: 'third', pending: [] }
  }
  const result = selectReleaseUpdates(history, {
    from: 'app',
    to: 'app',
    pending: [],
    dependencies
  })
  assert.deepEqual(result.releases, ['second', 'third'])
  assert.deepEqual(result.guides, [intermediate, f.guide])
  assert.deepEqual(result.gaps, [])
  assert.equal(result.needsInspection, false)
  dependencies['npm:@fixture/core'] = {
    from: 'third',
    to: 'third',
    pending: ['second']
  }
  const resumed = selectReleaseUpdates(history, {
    from: 'app',
    to: 'app',
    pending: [],
    dependencies
  })
  assert.ok(resumed.guides.includes(intermediate))
  assert.deepEqual(resumed.gaps, [])
})

test('prerequisite baseline gaps and unavailable middle releases cannot claim coverage', async () => {
  const { readReleaseHistory, selectReleaseUpdates } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  f.entries.push(
    f.record('app', null, { owner: '@fixture/app', requires: ['third'] })
  )
  const history = readReleaseHistory(await f.bundle())
  for (const from of [undefined, 'missing', 'app']) {
    const result = selectReleaseUpdates(history, {
      from: 'app',
      to: 'app',
      pending: [],
      dependencies: { 'npm:@fixture/core': { from, to: 'third', pending: [] } }
    })
    assert.match(result.gaps.join(' '), /baseline/i)
    assert.equal(result.needsInspection, true)
  }
  f.entries[1].status = 'candidate'
  const result = selectReleaseUpdates(readReleaseHistory(await f.bundle()), {
    from: 'app',
    to: 'app',
    pending: [],
    dependencies: {
      'npm:@fixture/core': { from: 'first', to: 'third', pending: [] }
    }
  })
  assert.match(result.gaps.join(' '), /Release unavailable: second/)
})

test('prerequisites preserve adopted revisions and recursively collect shared requirements once', async () => {
  const { readReleaseHistory, selectReleaseUpdates } =
    await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  f.entries.push({
    ...f.entries[1],
    id: 'second-r2',
    supersedes: 'second',
    correction: 'Clarify data checks'
  })
  f.entries.push(
    f.record('plugin', null, { owner: '@fixture/plugin', requires: ['third'] })
  )
  f.entries.push(
    f.record('app', null, {
      owner: '@fixture/app',
      requires: ['plugin', 'third']
    })
  )
  const result = selectReleaseUpdates(readReleaseHistory(await f.bundle()), {
    from: 'app',
    to: 'app',
    pending: [],
    dependencies: {
      'npm:@fixture/plugin': { from: 'plugin', to: 'plugin', pending: [] },
      'npm:@fixture/core': { from: 'second', to: 'third', pending: [] }
    }
  })
  assert.deepEqual(result.releases, ['second-r2', 'third'])
  assert.equal(result.needsInspection, true)
  assert.deepEqual(result.gaps, [])
})

test('release guide validation shares one read per invocation and rereads changed inputs', async () => {
  const { readReleaseHistory } = await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  const inputs = await f.bundle()
  let reads = 0
  const read = (file) => {
    if (file === f.guide) reads++
    return inputs.read(file)
  }
  readReleaseHistory({ ...inputs, read })
  assert.equal(reads, 1)
  f.sources.set(f.guide, '# Changed input')
  assert.throws(
    () => readReleaseHistory({ ...inputs, read }),
    /sources|changed/
  )
  assert.equal(reads, 2)
})

test('a correction cannot create an effective predecessor cycle', async () => {
  const { readReleaseHistory } = await import('../release-history.mjs')
  const f = releaseHistoryFixture()
  f.entries.push({
    ...f.entries[1],
    id: 'second-corrected',
    supersedes: 'second',
    correction: 'Clarify guide',
    requires: ['third']
  })
  const inputs = await f.bundle()
  assert.throws(() => readReleaseHistory(inputs), /cycle/)
})

function assertHistoryAvailability(bundle) {
  const verified = bundle.contentIndex.releaseHistory.some(
    (record) => record.status === 'verified'
  )
  assert.equal(
    bundle.releaseHistory.includes('No verified release summaries'),
    !verified
  )
  for (const record of bundle.contentIndex.releaseHistory) {
    assert.ok(bundle.releaseHistory.includes(`](releases/${record.id}.md)`))
  }
}

test('public history availability follows empty, candidate and verified records', async () => {
  const { readReleaseHistory, renderReleaseHistory } =
    await import('../release-history.mjs')
  assertHistoryAvailability({
    contentIndex: { releaseHistory: [] },
    releaseHistory: renderReleaseHistory([])
  })
  for (const status of ['candidate', 'modeled', 'verified']) {
    const f = releaseHistoryFixture()
    f.entries.forEach((record) => {
      record.status = status
    })
    const records = readReleaseHistory(await f.bundle())
    assertHistoryAvailability({
      contentIndex: { releaseHistory: records },
      releaseHistory: renderReleaseHistory(records)
    })
  }
})

test('release history is discoverable from repository and website entries without a fixed page count', async () => {
  const { contentIndex, releaseHistory, llms, websiteLlms } =
    await createPublicDocumentationBundle({ repositoryRoot })
  assert.ok(contentIndex.pages.some((page) => page.id === 'updates/history'))
  assert.ok(llms.includes('](updates/history.md)'))
  assert.ok(websiteLlms.includes('](/docs/updates/history)'))
  assertHistoryAvailability({ contentIndex, releaseHistory })
  assert.match(releaseHistory, /Without a note, inspect/)
  assert.match(
    fs.readFileSync(
      path.join(repositoryRoot, 'docs/public/updates/index.md'),
      'utf8'
    ),
    /\]\(history\.md\)/
  )
})

test('registered release pages flow through real generation without CI artifacts', async (t) => {
  const f = releaseHistoryFixture()
  await f.bundle()
  const temporaryRoot = path.join(repositoryRoot, 'tmp')
  fs.mkdirSync(temporaryRoot, { recursive: true })
  const root = fs.mkdtempSync(
    path.join(temporaryRoot, 'release-history-bundle-')
  )
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true })
  fs.cpSync(
    path.join(repositoryRoot, 'docs/public'),
    path.join(root, 'docs/public'),
    { recursive: true }
  )
  for (const entry of [
    'packages',
    'tools',
    'apps',
    'create-app',
    'package.json',
    'LICENSE',
    'SECURITY.md',
    'SUPPORT.md'
  ]) {
    fs.symlinkSync(path.join(repositoryRoot, entry), path.join(root, entry))
  }
  fs.symlinkSync(
    path.join(repositoryRoot, 'docs/ai'),
    path.join(root, 'docs/ai')
  )
  const manifestPath = path.join(root, 'docs/public/content-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const template = manifest.pages.find((page) => page.id === 'updates/index')
  for (const page of f.pages) {
    const file = path.join(root, 'docs/public', page.path)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, f.sources.get(page.path))
    manifest.pages.push({
      ...template,
      ...page,
      title: page.title ?? 'Modeled test guide',
      description: 'Modeled discovery fixture; not a real release claim.'
    })
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  const bundle = await createPublicDocumentationBundle({ repositoryRoot: root })
  assert.deepEqual(
    bundle.contentIndex.releaseHistory.map((record) => record.id),
    ['first', 'second', 'third']
  )
  assertHistoryAvailability(bundle)
  assert.equal(bundle.contentIndex.pages.length, manifest.pages.length)
  for (const id of ['first', 'second', 'third']) {
    assert.ok(bundle.llms.includes(`](updates/releases/${id}.md)`))
    assert.ok(bundle.websiteLlms.includes(`](/docs/updates/releases/${id})`))
    assert.ok(bundle.releaseHistory.includes(`](releases/${id}.md)`))
  }
  assert.equal(fs.existsSync(path.join(root, 'tmp')), false)
})
