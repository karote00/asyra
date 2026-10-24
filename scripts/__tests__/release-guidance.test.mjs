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

function cloudflareFixture(t) {
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
  fs.mkdirSync(path.join(f.root, 'docs/public/updates'), { recursive: true })
  fs.mkdirSync(path.join(f.root, 'scripts'), { recursive: true })
  fs.writeFileSync(
    path.join(f.root, 'scripts/cloudflare-release-guidance.mjs'),
    '// Protocol fixture'
  )
  fs.writeFileSync(
    path.join(f.root, 'docs/public/updates/app.md'),
    '# Integration\n\n## Canonical sources\n\nPreserve custom fields and stored data.\n'
  )
  fs.writeFileSync(
    path.join(f.root, 'docs/public/content-manifest.json'),
    JSON.stringify({ pages: [{ path: 'updates/app.md' }] })
  )
  fs.appendFileSync(
    path.join(f.root, 'RELEASE_NOTES.md'),
    '```update-note\n' +
      JSON.stringify({
        change: 'app',
        owner: 'Design',
        summary: 'App release',
        sources: [
          'apps/asyra-design/package.json',
          'scripts/cloudflare-release-guidance.mjs',
          'docs/public/content-manifest.json'
        ],
        impact: 'integration',
        guides: ['docs/public/updates/app.md'],
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
  const provider = {
    deploymentId: 'previous-deployment',
    sourceSha: f.baselineSha
  }
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
                  id: provider.deploymentId,
                  environment: 'production',
                  latest_stage: { name: 'deploy', status: 'success' },
                  deployment_trigger: {
                    metadata: { commit_hash: provider.sourceSha }
                  }
                }
              }
            })
          }
        : {
            status: 200,
            json: async () => ({
              app: 'asyra-design',
              sourceSha: provider.sourceSha
            })
          }
    }
  }
  return { ...f, output, provider, methods, options }
}

test('Cloudflare uses provider deployment identity and blocks stale artifacts before upload', async (t) => {
  const { cloudflareGuidance, recordCloudflareGuidance } =
    await import('../cloudflare-release-guidance.mjs')
  const { root, output, provider, methods, options } = cloudflareFixture(t)
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
  provider.deploymentId = 'replaced-same-sha'
  await assert.rejects(
    cloudflareGuidance('check', 'asyra-design', options),
    /baseline changed/
  )
  provider.deploymentId = 'previous-deployment'
  fs.writeFileSync(
    path.join(output, 'index.html'),
    'Changed after browser test'
  )
  await assert.rejects(
    cloudflareGuidance('check', 'asyra-design', options),
    /artifacts changed/
  )
  const result = recordCloudflareGuidance('asyra-design', {
    root,
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
            'dist.integrity': artifact.integrity,
            gitHead: f.sourceSha
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

test('Cloudflare retries retain the original summary and guides after upload verification fails', async (t) => {
  const { cloudflareGuidance, recordCloudflareGuidance } =
    await import('../cloudflare-release-guidance.mjs')
  const f = cloudflareFixture(t)
  const original = await cloudflareGuidance(
    'prepare',
    'asyra-design',
    f.options
  )
  recordCloudflareGuidance('asyra-design', {
    root: f.root,
    deploymentId: 'candidate-deployment',
    published: true,
    verified: false
  })
  f.provider.sourceSha = f.options.sourceSha
  f.provider.deploymentId = 'candidate-deployment'
  const resumed = await cloudflareGuidance('prepare', 'asyra-design', f.options)
  assert.deepEqual(resumed, original)
  assert.ok(resumed.deliveries[0].notes.length > 0)
  assert.equal(resumed.deliveries[0].guides.length, 1)
  await cloudflareGuidance('check', 'asyra-design', f.options)
  f.provider.deploymentId = 'unrecorded-redeployment'
  await assert.rejects(
    cloudflareGuidance('check', 'asyra-design', f.options),
    /baseline changed/
  )
})

test('unchanged npm members use the earlier published source without requiring a retry receipt', async (t) => {
  const { registryPreparationBaseline } =
    await import('../release-guidance.mjs')
  const f = fixture(t)
  const artifact = f.deliveries[1].artifact
  f.git(
    'commit',
    '--allow-empty',
    '-qm',
    'Next release with an unchanged member'
  )
  const sourceSha = f.git('rev-parse', 'HEAD')
  const runCommand = () =>
    JSON.stringify({
      version: artifact.version,
      'dist.integrity': artifact.integrity,
      gitHead: f.sourceSha
    })
  for (const file of [
    f.evidencePath,
    path.join(f.root, 'missing-retry.json')
  ]) {
    const observed = registryPreparationBaseline(
      f.root,
      artifact,
      sourceSha,
      file,
      runCommand
    )
    assert.equal(observed.baseline.sourceSha, f.sourceSha)
    assert.equal(observed.baseline.version, artifact.version)
    assert.notEqual(
      observed.baseline.sourceSha,
      f.deliveries[1].baseline.sourceSha
    )
  }
  assert.throws(
    () =>
      registryPreparationBaseline(
        f.root,
        artifact,
        sourceSha,
        f.evidencePath,
        () =>
          JSON.stringify({
            version: artifact.version,
            'dist.integrity': 'different-bytes',
            gitHead: f.sourceSha
          })
      ),
    /integrity differs/
  )
  assert.throws(
    () =>
      registryPreparationBaseline(
        f.root,
        artifact,
        sourceSha,
        f.evidencePath,
        (command) => {
          if (command === 'git') throw new Error('Missing verified tag')
          return JSON.stringify({
            version: artifact.version,
            'dist.integrity': artifact.integrity
          })
        }
      ),
    /coverage gap/
  )
})

function archivedCloudflareRun(f, candidate, result) {
  const id = 'asyra-design'
  const name = `release-guidance-${id}-${candidate.sourceSha}`
  const archive = {
    id: 10,
    name,
    expired: false,
    workflow_run: {
      id: 101,
      head_sha: candidate.sourceSha,
      head_branch: 'main',
      repository_id: 1,
      head_repository_id: 1
    }
  }
  const resultArchive = { id: 11, name: `${name}-result-1`, expired: false }
  const calls = []
  const runCommand = (command, args) => {
    calls.push([command, ...args])
    assert.equal(command, 'gh')
    if (args[0] === 'api') {
      if (args[1].endsWith('actions/runs/101'))
        return JSON.stringify([
          {
            path: '.github/workflows/app-cloudflare.yml',
            event: 'workflow_dispatch'
          }
        ])
      if (args[1].includes('actions/runs/101/artifacts'))
        return JSON.stringify([{ artifacts: [resultArchive] }])
      return JSON.stringify([
        { artifacts: args[1].includes(`name=${name}&`) ? [archive] : [] }
      ])
    }
    assert.deepEqual(args.slice(0, 3), ['run', 'download', '101'])
    const directory = args[args.indexOf('--dir') + 1]
    fs.mkdirSync(directory, { recursive: true })
    const isResult = args[args.indexOf('--name') + 1] === resultArchive.name
    fs.writeFileSync(
      path.join(
        directory,
        isResult
          ? `asyra-design.json.result.json.${result.guidance}.json`
          : 'asyra-design.json'
      ),
      JSON.stringify(isResult ? result : candidate)
    )
    return ''
  }
  return {
    archive,
    resultArchive,
    calls,
    options: {
      ...f.options,
      runCommand,
      repository: 'owner/repo',
      runId: 101,
      output: path.join(f.root, 'tmp/restore-output')
    }
  }
}

test('a fresh Cloudflare runner restores the frozen candidate and failed attempt through Actions artifacts', async (t) => {
  const {
    cloudflareGuidance,
    recordCloudflareGuidance,
    restoreCloudflareGuidance
  } = await import('../cloudflare-release-guidance.mjs')
  const f = cloudflareFixture(t)
  const candidate = await cloudflareGuidance(
    'prepare',
    'asyra-design',
    f.options
  )
  const result = recordCloudflareGuidance('asyra-design', {
    root: f.root,
    deploymentId: 'candidate-deployment',
    published: true,
    verified: false
  })
  const archived = archivedCloudflareRun(f, candidate, result)
  f.provider.sourceSha = candidate.sourceSha
  f.provider.deploymentId = 'candidate-deployment'
  fs.rmSync(path.join(f.root, 'tmp/cloudflare-release-guidance'), {
    recursive: true
  })
  assert.deepEqual(
    await restoreCloudflareGuidance('asyra-design', archived.options),
    { retained: true }
  )
  assert.equal(
    fs.readFileSync(archived.options.output, 'utf8'),
    'candidate-retained=true\n'
  )
  assert.deepEqual(
    await cloudflareGuidance('prepare', 'asyra-design', f.options),
    candidate
  )
  await cloudflareGuidance('check', 'asyra-design', f.options)
  assert.ok(archived.calls.some((args) => args.includes('download')))
  // A separate dispatch checkpoints the same candidate in its own run.
  assert.deepEqual(
    await restoreCloudflareGuidance('asyra-design', {
      ...archived.options,
      runId: 102
    }),
    { retained: false }
  )
  const failedRetry = recordCloudflareGuidance('asyra-design', {
    root: f.root,
    published: false,
    verified: false
  })
  assert.equal(
    failedRetry.outcomes['asyra-design'].deploymentId,
    'candidate-deployment'
  )
  assert.equal(failedRetry.outcomes['asyra-design'].published, true)
  assert.equal(failedRetry.outcomes['asyra-design'].attemptPublished, false)
  await cloudflareGuidance('check', 'asyra-design', f.options)
  fs.writeFileSync(
    path.join(f.output, 'index.html'),
    'Changed rebuilt artifact'
  )
  await assert.rejects(
    cloudflareGuidance('prepare', 'asyra-design', f.options),
    /artifacts changed/
  )
})

test('missing or expired Cloudflare retry evidence cannot produce a target-to-target summary', async (t) => {
  const {
    cloudflareGuidance,
    recordCloudflareGuidance,
    restoreCloudflareGuidance
  } = await import('../cloudflare-release-guidance.mjs')
  const f = cloudflareFixture(t)
  const candidate = await cloudflareGuidance(
    'prepare',
    'asyra-design',
    f.options
  )
  const result = recordCloudflareGuidance('asyra-design', {
    root: f.root,
    deploymentId: 'candidate-deployment',
    published: true,
    verified: false
  })
  const archived = archivedCloudflareRun(f, candidate, result)
  f.provider.sourceSha = candidate.sourceSha
  f.provider.deploymentId = 'candidate-deployment'
  fs.rmSync(path.join(f.root, 'tmp/cloudflare-release-guidance'), {
    recursive: true
  })
  await assert.rejects(
    cloudflareGuidance('prepare', 'asyra-design', f.options),
    /missing original candidate/
  )
  archived.archive.expired = true
  await assert.rejects(
    restoreCloudflareGuidance('asyra-design', archived.options),
    /missing original candidate/
  )
  archived.archive.expired = false
  archived.resultArchive.expired = true
  await restoreCloudflareGuidance('asyra-design', archived.options)
  await assert.rejects(
    cloudflareGuidance('prepare', 'asyra-design', f.options),
    /baseline changed/
  )
})

test('newer Cloudflare sources require verified predecessor evidence and preserve documentation exemption', async (t) => {
  const {
    cloudflareGuidance,
    recordCloudflareGuidance,
    restoreCloudflareGuidance
  } = await import('../cloudflare-release-guidance.mjs')
  const f = cloudflareFixture(t)
  const candidate = await cloudflareGuidance(
    'prepare',
    'asyra-design',
    f.options
  )
  const result = recordCloudflareGuidance('asyra-design', {
    root: f.root,
    deploymentId: 'candidate-deployment',
    published: true,
    verified: false
  })
  const archived = archivedCloudflareRun(f, candidate, result)
  f.provider.sourceSha = candidate.sourceSha
  f.provider.deploymentId = 'candidate-deployment'
  fs.writeFileSync(
    path.join(f.root, 'apps/asyra-design/README.md'),
    '# Documentation correction\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Documentation only')
  const sourceSha = f.git('rev-parse', 'HEAD')
  fs.writeFileSync(
    path.join(f.output, 'deployment-version.json'),
    JSON.stringify({ app: 'asyra-design', sourceSha })
  )
  await assert.rejects(
    cloudflareGuidance('prepare', 'asyra-design', { ...f.options, sourceSha }),
    /verify its original candidate/
  )
  fs.rmSync(path.join(f.root, 'tmp/cloudflare-release-guidance'), {
    recursive: true
  })
  await assert.rejects(
    restoreCloudflareGuidance('asyra-design', {
      ...archived.options,
      sourceSha
    }),
    /verify its original candidate/
  )
  result.outcomes['asyra-design'].status = 'verified'
  result.outcomes['asyra-design'].verified = true
  await restoreCloudflareGuidance('asyra-design', {
    ...archived.options,
    sourceSha
  })
  const next = await cloudflareGuidance('prepare', 'asyra-design', {
    ...f.options,
    sourceSha
  })
  assert.equal(next.deliveries[0].baseline.sourceSha, candidate.sourceSha)
  assert.ok(next.deliveries[0].changes.includes('apps/asyra-design/README.md'))
  assert.deepEqual(next.deliveries[0].notes, [])
  await cloudflareGuidance('check', 'asyra-design', { ...f.options, sourceSha })
})

test('a mixed npm release retains unchanged-member and partial-retry baselines independently', async (t) => {
  const { registryPreparationBaseline, prepareOrReuseGuidance } =
    await import('../release-guidance.mjs')
  const f = fixture(t)
  const coreFile = path.join(f.root, 'packages/core/package.json')
  const core = JSON.parse(fs.readFileSync(coreFile, 'utf8'))
  core.version = '1.2.0'
  fs.writeFileSync(coreFile, JSON.stringify(core))
  const notes = path.join(f.root, 'RELEASE_NOTES.md')
  fs.writeFileSync(
    notes,
    fs
      .readFileSync(notes, 'utf8')
      .replace('Candidate implementation', 'Next core implementation')
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Next core with unchanged utility package')
  const sourceSha = f.git('rev-parse', 'HEAD')
  const deliveries = f.deliveries.map((item) => ({
    ...item,
    artifact: {
      ...item.artifact,
      ...(item.id === '@asyra/core' ? { version: '1.2.0' } : {})
    }
  }))
  let partial = false
  const registry = (command, args) => {
    assert.equal(command, 'npm')
    const entry = deliveries.find((item) => `${item.id}@latest` === args[1])
    const existing = entry.id === '@asyra/utils'
    const publishedSource = partial ? sourceSha : f.baselineSha
    return JSON.stringify({
      version:
        existing || partial ? entry.artifact.version : entry.baseline.version,
      'dist.integrity':
        existing || partial
          ? entry.artifact.integrity
          : entry.baseline.integrity,
      gitHead: existing ? f.sourceSha : publishedSource
    })
  }
  const prepare = () => {
    const observed = deliveries.map((item) =>
      registryPreparationBaseline(
        f.root,
        item.artifact,
        sourceSha,
        f.evidencePath,
        registry
      )
    )
    return prepareOrReuseGuidance(
      f.evidencePath,
      {
        root: f.root,
        owner: 'framework',
        sourceSha,
        deliveries: deliveries.map((item, index) => ({
          ...item,
          baseline: observed[index].baseline
        }))
      },
      observed.map((item) => item.current)
    )
  }
  const candidate = prepare()
  assert.equal(
    candidate.deliveries.find((item) => item.id === '@asyra/utils').baseline
      .sourceSha,
    f.sourceSha
  )
  assert.equal(
    candidate.deliveries.find((item) => item.id === '@asyra/core').baseline
      .sourceSha,
    f.baselineSha
  )
  partial = true
  assert.deepEqual(prepare(), candidate)
  fs.rmSync(f.evidencePath)
  assert.throws(
    prepare,
    /Missing release guidance for this published candidate/
  )
})

test('a verified Cloudflare deployment survives a failed retry and admits the next source on a fresh runner', async (t) => {
  const {
    cloudflareGuidance,
    recordCloudflareGuidance,
    restoreCloudflareGuidance
  } = await import('../cloudflare-release-guidance.mjs')
  const f = cloudflareFixture(t)
  const id = 'asyra-design'
  const candidate = await cloudflareGuidance('prepare', id, f.options)
  recordCloudflareGuidance(id, {
    root: f.root,
    deploymentId: 'verified-deployment',
    published: true,
    verified: true
  })
  const retry = recordCloudflareGuidance(id, {
    root: f.root,
    published: false,
    verified: false
  })
  const archived = archivedCloudflareRun(f, candidate, retry)
  f.provider.sourceSha = candidate.sourceSha
  f.provider.deploymentId = 'verified-deployment'
  fs.writeFileSync(
    path.join(f.root, 'apps/asyra-design/README.md'),
    '# Next documented release\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Next documentation update')
  const sourceSha = f.git('rev-parse', 'HEAD')
  fs.writeFileSync(
    path.join(f.output, 'deployment-version.json'),
    JSON.stringify({ app: id, sourceSha })
  )
  fs.rmSync(path.join(f.root, 'tmp/cloudflare-release-guidance'), {
    recursive: true
  })
  await restoreCloudflareGuidance(id, {
    ...archived.options,
    sourceSha,
    runId: 102
  })
  const next = await cloudflareGuidance('prepare', id, {
    ...f.options,
    sourceSha
  })
  assert.equal(next.deliveries[0].baseline.sourceSha, candidate.sourceSha)
  assert.equal(next.deliveries[0].baseline.deploymentId, 'verified-deployment')
  assert.ok(next.deliveries[0].changes.includes('apps/asyra-design/README.md'))
  assert.deepEqual(next.deliveries[0].notes, [])
  await cloudflareGuidance('check', id, { ...f.options, sourceSha })
  assert.deepEqual(retry.outcomes[id], {
    status: 'failed',
    deploymentId: 'verified-deployment',
    published: true,
    verified: true,
    attemptPublished: false,
    attemptVerified: false
  })
})

test('a new Cloudflare publication cannot inherit an earlier deployment verification', async (t) => {
  const { cloudflareGuidance, recordCloudflareGuidance } =
    await import('../cloudflare-release-guidance.mjs')
  const f = cloudflareFixture(t)
  const id = 'asyra-design'
  await cloudflareGuidance('prepare', id, f.options)
  recordCloudflareGuidance(id, {
    root: f.root,
    deploymentId: 'verified-deployment',
    published: true,
    verified: true
  })
  const replacement = recordCloudflareGuidance(id, {
    root: f.root,
    deploymentId: 'new-unverified-deployment',
    published: true,
    verified: false
  })
  assert.deepEqual(replacement.outcomes[id], {
    status: 'failed',
    deploymentId: 'new-unverified-deployment',
    published: true,
    verified: false,
    attemptPublished: true,
    attemptVerified: false
  })
  f.provider.sourceSha = f.options.sourceSha
  f.provider.deploymentId = 'new-unverified-deployment'
  fs.writeFileSync(
    path.join(f.root, 'apps/asyra-design/README.md'),
    '# Next release after replacement\n'
  )
  f.git('add', '.')
  f.git('commit', '-qm', 'Next documented source')
  const sourceSha = f.git('rev-parse', 'HEAD')
  fs.writeFileSync(
    path.join(f.output, 'deployment-version.json'),
    JSON.stringify({ app: id, sourceSha })
  )
  await assert.rejects(
    cloudflareGuidance('prepare', id, { ...f.options, sourceSha }),
    /verify its original candidate/
  )
})
