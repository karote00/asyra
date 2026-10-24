import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import test from 'node:test'
import {
  prepareGuidance,
  admitGuidance,
  artifactIntegrity,
  recordGuidanceResult
} from '../release-guidance.mjs'
import { initializeGuidance } from './fixtures/release-guidance.mjs'

const repositoryRoot = path.resolve(import.meta.dirname, '../..')
function fixture(t) {
  fs.mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  const root = fs.mkdtempSync(
    path.join(repositoryRoot, 'tmp/release-guidance-')
  )
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const packages = [
    {
      name: '@asyra/core',
      version: '1.1.0',
      dependencies: { '@asyra/utils': 'workspace:*' }
    },
    { name: '@asyra/utils', version: '1.1.0' }
  ]
  for (const pkg of packages) {
    const directory = path.join(root, 'packages', pkg.name.split('/')[1])
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(pkg))
  }
  fs.mkdirSync(path.join(root, 'artifacts'))
  const tarball = path.join(root, 'artifacts/core.tgz')
  fs.writeFileSync(tarball, 'packed candidate')
  const artifacts = packages.map(({ name }) => ({
    name,
    integrity: artifactIntegrity(tarball)
  }))
  return { root, tarball, ...initializeGuidance(root, packages, artifacts) }
}
const live = (f) =>
  f.deliveries.map(({ id, baseline }) => ({
    id,
    version: baseline.version,
    integrity: baseline.integrity,
    sourceSha: baseline.sourceSha
  }))
const input = (f) => ({
  root: f.root,
  owner: 'framework',
  sourceSha: f.sourceSha,
  deliveries: f.deliveries,
  evidence: f.evidence,
  current: live(f)
})

test('release summary uses each predecessor and includes shared dependency changes', (t) => {
  const f = fixture(t)
  assert.ok(
    f.evidence.deliveries[0].changes.includes('packages/utils/package.json')
  )
  assert.ok(
    !f.evidence.deliveries[1].changes.includes('packages/core/package.json')
  )
  assert.equal(f.evidence.status, 'CANDIDATE')
  assert.equal(admitGuidance(input(f)).length, 64)
  const later = prepareGuidance({
    ...input(f),
    deliveries: [
      {
        ...f.deliveries[0],
        baseline: { ...f.deliveries[0].baseline, sourceSha: f.sourceSha }
      }
    ]
  })
  assert.deepEqual(later.deliveries[0].changes, [])
})

test('omitted notes and missing guides fail actual-delta reconciliation', (t) => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.root, 'RELEASE_NOTES.md'), '# No declarations\n')
  f.git('add', '.')
  f.git('commit', '-qm', 'Remove declaration')
  assert.throws(
    () =>
      prepareGuidance({ ...input(f), sourceSha: f.git('rev-parse', 'HEAD') }),
    /Missing update note/
  )
  fs.writeFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '```update-note\n' +
      JSON.stringify({
        change: 'candidate',
        owner: 'Framework',
        summary: 'Required integration',
        sources: ['packages/core/package.json', 'packages/utils/package.json'],
        impact: 'integration',
        guides: ['docs/public/updates/missing.md'],
        reason: 'Preserve data'
      }) +
      '\n```\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Missing integration guide')
  assert.throws(
    () =>
      prepareGuidance({ ...input(f), sourceSha: f.git('rev-parse', 'HEAD') }),
    /Missing guide/
  )
})

test('missing and stale guidance, baseline, source, artifact and summary are rejected', (t) => {
  const f = fixture(t)
  assert.throws(
    () => admitGuidance({ ...input(f), evidence: undefined }),
    /guidance/
  )
  assert.throws(
    () =>
      admitGuidance({
        ...input(f),
        current: live(f).map((item) => ({ ...item, version: '9.0.0' }))
      }),
    /baseline changed/
  )
  assert.throws(
    () =>
      admitGuidance({
        ...input(f),
        deliveries: f.deliveries.map((item) => ({
          ...item,
          artifact: { ...item.artifact, integrity: 'changed' }
        }))
      }),
    /artifacts changed/
  )
  const evidence = structuredClone(f.evidence)
  evidence.deliveries[0].notes[0].summary = 'Altered'
  assert.throws(() => admitGuidance({ ...input(f), evidence }), /summary/)
  fs.appendFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '\nUncommitted correction'
  )
  assert.throws(() => admitGuidance(input(f)), /clean tracked source/)
})

test('partial npm retry accepts only the exact published candidate integrity', (t) => {
  const f = fixture(t)
  const current = live(f)
  current[0] = f.deliveries[0].artifact
  assert.equal(admitGuidance({ ...input(f), current }).length, 64)
  current[0] = { ...current[0], integrity: 'another artifact' }
  assert.throws(
    () => admitGuidance({ ...input(f), current }),
    /baseline changed/
  )
  const file = path.join(f.root, 'tmp/results.json')
  recordGuidanceResult(file, f.evidence, '@asyra/core', 'published')
  const result = recordGuidanceResult(
    file,
    f.evidence,
    '@asyra/utils',
    'failed'
  )
  assert.equal(result.outcomes['@asyra/core'].status, 'published')
  assert.equal(result.outcomes['@asyra/utils'].status, 'failed')
  assert.equal(result.status, undefined)
})

test('reverted source does not invent a shipped change and missing history fails closed', (t) => {
  const f = fixture(t)
  f.git('revert', '--no-edit', 'HEAD')
  const report = prepareGuidance({
    ...input(f),
    sourceSha: f.git('rev-parse', 'HEAD')
  })
  assert.deepEqual(report.deliveries[0].changes, [])
  assert.throws(
    () =>
      prepareGuidance({
        ...input(f),
        sourceSha: f.git('rev-parse', 'HEAD'),
        deliveries: [{ ...f.deliveries[0], baseline: {} }]
      }),
    /coverage gap/
  )
})

test('Cloudflare uses provider deployment identity and blocks stale artifacts before upload', async (t) => {
  const { cloudflareGuidance, recordCloudflareGuidance } =
    await import('../cloudflare-release-guidance.mjs')
  const f = fixture(t)
  const directory = path.join(f.root, 'apps/asyra-design')
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: '@asyra/asyra-design',
      version: '1.0.0',
      dependencies: { '@asyra/core': 'workspace:*' }
    })
  )
  fs.appendFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '```update-note\n' +
      JSON.stringify({
        change: 'app',
        owner: 'Design',
        summary: 'App release',
        sources: ['apps/asyra-design/package.json'],
        impact: 'no-action',
        guides: [],
        reason: 'Internal change'
      }) +
      '\n```\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'App source')
  const output = path.join(f.root, 'tmp/cloudflare-apps/asyra-design')
  fs.mkdirSync(output, { recursive: true })
  fs.writeFileSync(path.join(output, 'index.html'), 'Verified artifact')
  fs.writeFileSync(
    path.join(output, 'deployment-version.json'),
    JSON.stringify({
      sourceSha: f.git('rev-parse', 'HEAD'),
      app: 'asyra-design'
    })
  )
  let deploymentId = 'previous-deployment'
  const methods = []
  const options = {
    root: f.root,
    sourceSha: f.git('rev-parse', 'HEAD'),
    token: 'test-token',
    accountId: 'a'.repeat(32),
    request: async (url, init) => {
      methods.push(init.method ?? 'GET')
      return url.includes('api.cloudflare.com')
        ? {
            ok: true,
            json: async () => ({
              success: true,
              result: {
                name: 'asyra-design',
                canonical_deployment: {
                  id: deploymentId,
                  environment: 'production',
                  latest_stage: { name: 'deploy', status: 'success' },
                  deployment_trigger: {
                    metadata: { commit_hash: f.baselineSha }
                  }
                }
              }
            })
          }
        : {
            status: 200,
            json: async () => ({
              app: 'asyra-design',
              sourceSha: f.baselineSha
            })
          }
    }
  }
  await assert.rejects(
    cloudflareGuidance('check', 'asyra-design', options),
    /Missing release guidance/
  )
  assert.deepEqual(methods, [])
  const report = await cloudflareGuidance('prepare', 'asyra-design', options)
  assert.equal(
    report.deliveries[0].baseline.deploymentId,
    'previous-deployment'
  )
  await cloudflareGuidance('check', 'asyra-design', options)
  deploymentId = 'replaced-same-sha'
  await assert.rejects(
    cloudflareGuidance('check', 'asyra-design', options),
    /baseline changed/
  )
  deploymentId = 'previous-deployment'
  fs.writeFileSync(
    path.join(output, 'index.html'),
    'Changed after browser test'
  )
  await assert.rejects(
    cloudflareGuidance('check', 'asyra-design', options),
    /artifacts changed/
  )
  const result = recordCloudflareGuidance('asyra-design', {
    root: f.root,
    deploymentId: 'new-deployment',
    published: true,
    verified: false
  })
  assert.equal(result.outcomes['asyra-design'].status, 'failed')
  assert.equal(result.outcomes['asyra-design'].published, true)
  assert.ok(methods.every((method) => method === 'GET'))
})

test('create-app publishes the packed candidate and rejects missing or changed guidance', async (t) => {
  const { prepareCreateAppRelease } =
    await import('../create-app-release-artifacts.mjs')
  const { publishCreateApp } = await import('../publish-create-app.js')
  const f = fixture(t)
  const product = 'asyra-design'
  const name = 'create-asyra-design-app'
  const files = {
    'create-app/asyra-design/package.json': {
      name,
      version: '1.1.0',
      bin: { create: 'bin.js' }
    },
    'apps/asyra-design/package.json': {
      name: '@asyra/asyra-design',
      version: '1.1.0',
      dependencies: { '@asyra/core': 'workspace:*' }
    },
    'release-configs/asyra-design.json': {
      src: 'apps/asyra-design',
      dest: 'create-app/asyra-design/template'
    }
  }
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(f.root, file)), { recursive: true })
    fs.writeFileSync(path.join(f.root, file), JSON.stringify(content))
  }
  fs.appendFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '```update-note\n' +
      JSON.stringify({
        change: 'cli',
        owner: 'CLI',
        summary: 'CLI changes',
        sources: Object.keys(files),
        impact: 'no-action',
        guides: [],
        reason: 'No consumer action'
      }) +
      '\n```\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'CLI source')
  const sourceSha = f.git('rev-parse', 'HEAD')
  const mutations = []
  let packedPath
  const runCommand = (command, args) => {
    if (command === 'git' && args[0] === 'rev-parse') return sourceSha
    if (command === 'git' && args[0] === 'tag' && args[1] === '--list')
      return ''
    if (command === 'npm' && args[0] === 'view') {
      if (args[1].endsWith('@latest'))
        return JSON.stringify({
          version: '1.0.0',
          'dist.integrity': 'old-cli',
          gitHead: f.baselineSha
        })
      const error = new Error('E404')
      error.code = 'E404'
      throw error
    }
    if (command === 'npm' && args[0] === 'pack') {
      packedPath = path.join(
        args[args.indexOf('--pack-destination') + 1],
        'candidate.tgz'
      )
      fs.writeFileSync(packedPath, 'Validated packed CLI')
      return JSON.stringify([
        { name, version: '1.1.0', filename: 'candidate.tgz' }
      ])
    }
    mutations.push([command, ...args])
    return ''
  }
  assert.throws(
    () => publishCreateApp({ root: f.root, product, runCommand }),
    /Missing release guidance/
  )
  assert.deepEqual(mutations, [])
  prepareCreateAppRelease({ root: f.root, product, runCommand })
  fs.writeFileSync(packedPath, 'Changed candidate')
  assert.throws(
    () => publishCreateApp({ root: f.root, product, runCommand }),
    /artifacts changed/
  )
  assert.deepEqual(mutations, [])
  fs.writeFileSync(packedPath, 'Validated packed CLI')
  publishCreateApp({ root: f.root, product, runCommand })
  assert.equal(mutations[0][0], 'npm')
  assert.equal(mutations[0][1], 'publish')
  assert.equal(mutations[0][2], packedPath)
  assert.deepEqual(mutations[1], ['git', 'tag', `${name}@1.1.0`, sourceSha])
})

test('removed dependencies remain in delta coverage and dependency-only changes require notes', (t) => {
  const f = fixture(t)
  const corePath = path.join(f.root, 'packages/core/package.json')
  const core = JSON.parse(fs.readFileSync(corePath, 'utf8'))
  delete core.dependencies
  fs.writeFileSync(corePath, JSON.stringify(core))
  fs.writeFileSync(
    path.join(f.root, 'packages/utils/removed-owner.js'),
    'export const preserved = true'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Remove dependency while changing old owner')
  const inputs = {
    ...input(f),
    sourceSha: f.git('rev-parse', 'HEAD'),
    deliveries: [
      {
        ...f.deliveries[0],
        baseline: { ...f.deliveries[0].baseline, sourceSha: f.sourceSha }
      }
    ]
  }
  assert.throws(() => prepareGuidance(inputs), /Missing update note/)
  fs.appendFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '```update-note\n' +
      JSON.stringify({
        change: 'dependency',
        owner: 'Framework',
        summary: 'Remove dependency',
        sources: [
          'packages/core/package.json',
          'packages/utils/removed-owner.js'
        ],
        impact: 'no-action',
        guides: [],
        reason: 'Internal dependencies only'
      }) +
      '\n```\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Declare dependency impact')
  const candidate = prepareGuidance({
    ...inputs,
    sourceSha: f.git('rev-parse', 'HEAD')
  })
  assert.ok(
    candidate.deliveries[0].changes.includes('packages/utils/removed-owner.js')
  )
})

test('guide revisions remain bound even when only a retained integration guide changes', (t) => {
  const f = fixture(t)
  const guide = 'docs/public/updates/integration.md'
  fs.mkdirSync(path.dirname(path.join(f.root, guide)), { recursive: true })
  fs.writeFileSync(
    path.join(f.root, guide),
    '# Integrate\n\n## Canonical sources\n\nKeep custom fields and data.\n'
  )
  fs.writeFileSync(
    path.join(f.root, 'docs/public/content-manifest.json'),
    JSON.stringify({ pages: [{ path: 'updates/integration.md' }] })
  )
  const note = {
    change: 'candidate',
    owner: 'Framework',
    summary: 'Integration required',
    sources: [
      'packages/core/package.json',
      'packages/utils/package.json',
      'docs/public/content-manifest.json'
    ],
    impact: 'integration',
    guides: [guide],
    reason: 'Preserve custom fields and data'
  }
  fs.writeFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '```update-note\n' + JSON.stringify(note) + '\n```\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Guide revision one')
  const previous = f.git('rev-parse', 'HEAD')
  const first = prepareGuidance({ ...input(f), sourceSha: previous })
  fs.appendFileSync(path.join(f.root, guide), '\nAlso verify reloaded data.\n')
  f.git('add', '.')
  f.git('commit', '-qm', 'Guide correction')
  const next = prepareGuidance({
    ...input(f),
    sourceSha: f.git('rev-parse', 'HEAD'),
    deliveries: f.deliveries.map((item) => ({
      ...item,
      baseline: { ...item.baseline, sourceSha: previous }
    }))
  })
  assert.equal(next.deliveries[0].notes[0].impact, 'integration')
  assert.notEqual(
    next.deliveries[0].guides[0].hash,
    first.deliveries[0].guides[0].hash
  )
  assert.deepEqual(
    next.deliveries[0].guides.map((item) => item.path),
    [guide]
  )
})

test('preparation resumes exact partial candidates without replacing their predecessor', async (t) => {
  const { registryPreparationBaseline, prepareOrReuseGuidance } =
    await import('../release-guidance.mjs')
  const f = fixture(t)
  const artifact = f.deliveries[0].artifact
  const { baseline, current } = registryPreparationBaseline(
    f.root,
    artifact,
    f.sourceSha,
    f.evidencePath,
    () =>
      JSON.stringify({
        version: artifact.version,
        'dist.integrity': artifact.integrity
      })
  )
  assert.deepEqual(baseline, f.deliveries[0].baseline)
  const result = prepareOrReuseGuidance(f.evidencePath, input(f), [
    current,
    live(f)[1]
  ])
  assert.deepEqual(result, f.evidence)
  assert.throws(
    () =>
      registryPreparationBaseline(
        f.root,
        artifact,
        f.sourceSha,
        path.join(f.root, 'missing.json'),
        () =>
          JSON.stringify({
            version: artifact.version,
            'dist.integrity': artifact.integrity
          })
      ),
    /Missing release guidance/
  )
})

test('one preparation shares snapshot and delta reads, and the next preparation rereads them', (t) => {
  const f = fixture(t)
  const calls = []
  const runCommand = (command, args, options) => {
    calls.push(args)
    return execFileSync(command, args, {
      ...options,
      encoding: 'utf8',
      stdio: 'pipe'
    })
  }
  const first = prepareGuidance({ ...input(f), runCommand })
  assert.deepEqual(first, f.evidence)
  assert.equal(calls.filter((args) => args[0] === 'ls-tree').length, 2)
  assert.equal(
    calls.filter((args) => args[0] === 'diff' && args.includes('--no-renames'))
      .length,
    1
  )
  assert.equal(
    calls.filter(
      (args) =>
        args[0] === 'show' && args[1] === `${f.sourceSha}:RELEASE_NOTES.md`
    ).length,
    1
  )
  calls.length = 0
  prepareGuidance({ ...input(f), runCommand })
  assert.equal(calls.filter((args) => args[0] === 'ls-tree').length, 2)
  fs.writeFileSync(
    path.join(f.root, 'packages/core/uncommitted.js'),
    'export const missing = true'
  )
  assert.throws(() => prepareGuidance(input(f)), /committed source inputs/)
})
