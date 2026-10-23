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
  assert.equal(bundle.contentIndex.pages.length, 46)
  assert.equal(bundle.sourceMap.pages.length, 46)
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
  assert.deepEqual(sections.extend, [
    'start/extend-with-ai',
    'build/custom-schema',
    'build/feature-session',
    'build/hierarchy-groups',
    'build/persistence-migration',
    'build/collaboration',
    'build/ai-actions',
    'build/app-retrieval-action',
    'updates/index',
    'updates/text-official-fields-example-1-r2',
    'updates/text-official-fields-example-1-r3',
    'updates/text-spacing-example-2-r1',
    'updates/text-spacing-example-2-r2'
  ])
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
  assert.match(llms, /46 public Markdown pages/)
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
  assert.equal((llms.match(/^- \[/gm) ?? []).length, 46)
})

test('checked public documentation artifacts are deterministic and current', async () => {
  const bundle = await checkPublicDocumentation({ repositoryRoot })
  assert.equal(bundle.contentIndex.pages.length, 46)
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
