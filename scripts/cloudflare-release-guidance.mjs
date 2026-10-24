/* global fetch, AbortSignal */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DEPLOYMENT_APPS } from './app-cloudflare.mjs'
import {
  prepareGuidance,
  admitGuidance,
  artifactIntegrity,
  guidanceHash,
  readGuidance,
  writeGuidance,
  recordGuidanceResult,
  runReleaseCommand
} from './release-guidance.mjs'

function delivery(root, id) {
  const app =
    id === 'asyra-framework'
      ? {
          id,
          project: id,
          root: 'apps/asyra-framework-site',
          output: 'apps/asyra-framework-site/out'
        }
      : DEPLOYMENT_APPS.find((item) => item.id === id)
  assert.ok(app, 'Unknown Cloudflare release owner')
  const directory = path.join(
    root,
    id === 'asyra-framework' ? app.output : `tmp/cloudflare-apps/${id}`
  )
  return {
    ...app,
    directory,
    roots: [app.root, ...(id === 'asyra-framework' ? ['docs/public'] : [])],
    evidenceFile: path.join(root, `tmp/cloudflare-release-guidance/${id}.json`)
  }
}

export async function cloudflareBaseline(
  id,
  {
    root = path.resolve(import.meta.dirname, '..'),
    request = fetch,
    accountId = process.env.CLOUDFLARE_ACCOUNT_ID,
    token = process.env.CLOUDFLARE_API_TOKEN
  } = {}
) {
  const app = delivery(root, id)
  assert.match(accountId ?? '', /^[a-f0-9]{32}$/, 'Invalid Cloudflare account')
  assert.ok(token, 'Missing Cloudflare read token')
  const response = await request(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${app.project}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(10000)
    }
  )
  assert.ok(
    response.ok,
    `Release coverage gap: Cloudflare project read failed (${response.status})`
  )
  const data = await response.json()
  assert.equal(data.success, true, 'Cloudflare project read failed')
  assert.equal(data.result.name, app.project)
  const deployed = data.result.canonical_deployment
  assert.ok(
    deployed?.id &&
      deployed.environment === 'production' &&
      deployed.latest_stage?.name === 'deploy' &&
      deployed.latest_stage.status === 'success',
    'Release coverage gap: previous successful production deployment is required'
  )
  const sourceSha = deployed.deployment_trigger?.metadata?.commit_hash
  assert.match(
    sourceSha ?? '',
    /^[a-f0-9]{40}$/,
    'Release coverage gap: deployed source SHA is missing'
  )
  const marker = await request(
    `https://${app.project}.pages.dev/deployment-version.json`,
    { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) }
  )
  assert.equal(marker.status, 200, 'Previous production marker is unavailable')
  const version = await marker.json()
  assert.equal(
    version.sourceSha,
    sourceSha,
    'Production marker differs from provider baseline'
  )
  if (id !== 'asyra-framework') assert.equal(version.app, id)
  return { id, sourceSha, deploymentId: deployed.id }
}

function publicationFor(file, evidence) {
  const resultFile = `${file}.result.json.${guidanceHash(evidence)}.json`
  return fs.existsSync(resultFile) ? readGuidance(resultFile) : undefined
}

function requireVerifiedBaseline(root, app, baseline) {
  const usesGuidance = runReleaseCommand(
    'git',
    [
      'ls-tree',
      '--name-only',
      baseline.sourceSha,
      '--',
      'scripts/cloudflare-release-guidance.mjs'
    ],
    { cwd: root }
  ).trim()
  if (!usesGuidance) return
  const files = [
    app.evidenceFile,
    path.join(path.dirname(app.evidenceFile), 'baseline', `${app.id}.json`)
  ]
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const candidate = readGuidance(file)
    const result = publicationFor(file, candidate)
    const outcome = result?.outcomes[app.id]
    if (
      candidate.sourceSha === baseline.sourceSha &&
      candidate.owner === `cloudflare/${app.id}` &&
      result?.guidance === guidanceHash(candidate) &&
      result?.sourceSha === candidate.sourceSha &&
      result?.owner === candidate.owner &&
      outcome?.published === true &&
      outcome.verified === true &&
      outcome.deploymentId === baseline.deploymentId
    )
      return
  }
  throw new Error(
    'Release coverage gap: restore the verified production guidance or recover and verify its original candidate first'
  )
}

// Restore only existing workflow evidence. Expired or missing receipts cannot turn a retry into an empty release.
export async function restoreCloudflareGuidance(id, options = {}) {
  const root = options.root ?? path.resolve(import.meta.dirname, '..')
  const app = delivery(root, id)
  const sourceSha = options.sourceSha ?? process.env.SOURCE_SHA
  const repository = options.repository ?? process.env.GH_REPO
  const runId = String(options.runId ?? process.env.GITHUB_RUN_ID)
  const runCommand = options.runCommand ?? runReleaseCommand
  assert.match(
    sourceSha ?? '',
    /^[a-f0-9]{40}$/,
    'Missing candidate source SHA'
  )
  assert.match(
    repository ?? '',
    /^[\w.-]+\/[\w.-]+$/,
    'Missing GitHub repository'
  )
  const api = (endpoint) =>
    JSON.parse(
      runCommand(
        'gh',
        ['api', `repos/${repository}/${endpoint}`, '--paginate', '--slurp'],
        { cwd: root }
      )
    )
  const list = (endpoint) => api(endpoint).flatMap((page) => page.artifacts)
  const download = (archive) => {
    const parent = path.join(root, 'tmp/cloudflare-release-guidance/restore')
    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, `${archive.id}-`))
    runCommand(
      'gh',
      [
        'run',
        'download',
        String(archive.workflow_run.id),
        '--repo',
        repository,
        '--name',
        archive.name,
        '--dir',
        directory
      ],
      { cwd: root }
    )
    return directory
  }
  let retained = false
  const restore = (sha, file) => {
    const name = `release-guidance-${id}-${sha}`
    const archives = list(`actions/artifacts?name=${name}&per_page=100`)
      .filter(
        (item) =>
          !item.expired &&
          item.name === name &&
          item.workflow_run?.head_sha === sha &&
          item.workflow_run.head_branch === 'main' &&
          item.workflow_run.head_repository_id ===
            item.workflow_run.repository_id
      )
      .sort((a, b) => b.id - a.id)
    let selected
    let latestResult
    let latestResultId = -1
    for (const archive of archives) {
      const run = api(`actions/runs/${archive.workflow_run.id}`)[0]
      const workflow =
        id === 'asyra-framework' ? 'site-cloudflare.yml' : 'app-cloudflare.yml'
      if (
        run.path !== `.github/workflows/${workflow}` ||
        run.event !== 'workflow_dispatch'
      )
        continue
      const candidate = readGuidance(path.join(download(archive), `${id}.json`))
      assert.equal(
        candidate.owner,
        `cloudflare/${id}`,
        'Restored candidate owner changed'
      )
      assert.equal(
        candidate.sourceSha,
        sha,
        'Restored candidate source changed'
      )
      if (!selected) selected = candidate
      assert.deepEqual(
        candidate,
        selected,
        'Conflicting frozen candidates for the same source'
      )
      if (sha === sourceSha && String(archive.workflow_run.id) === runId)
        retained = true
      const results = list(
        `actions/runs/${archive.workflow_run.id}/artifacts?per_page=100`
      )
        .filter(
          (item) => !item.expired && item.name.startsWith(`${name}-result-`)
        )
        .sort((a, b) => b.id - a.id)
      for (const result of results) {
        if (result.id <= latestResultId) break
        const filename = `${id}.json.result.json.${guidanceHash(selected)}.json`
        const resultFile = path.join(
          download({ ...result, workflow_run: archive.workflow_run }),
          filename
        )
        assert.ok(
          fs.existsSync(resultFile),
          'Publication archive does not match frozen candidate'
        )
        latestResult = readGuidance(resultFile)
        assert.equal(
          latestResult.guidance,
          guidanceHash(selected),
          'Publication archive hash changed'
        )
        latestResultId = result.id
        break
      }
    }
    if (selected) {
      if (fs.existsSync(file))
        assert.deepEqual(
          readGuidance(file),
          selected,
          'Local candidate differs from retained evidence'
        )
      writeGuidance(file, selected)
      if (latestResult)
        writeGuidance(
          `${file}.result.json.${guidanceHash(selected)}.json`,
          latestResult
        )
    }
  }
  restore(sourceSha, app.evidenceFile)
  const baseline = await cloudflareBaseline(id, { ...options, root })
  if (baseline.sourceSha !== sourceSha) {
    restore(
      baseline.sourceSha,
      path.join(path.dirname(app.evidenceFile), 'baseline', `${id}.json`)
    )
    requireVerifiedBaseline(root, app, baseline)
  } else {
    assert.ok(
      fs.existsSync(app.evidenceFile),
      'Release coverage gap: missing original candidate for deployed retry'
    )
  }
  const output = options.output ?? process.env.GITHUB_OUTPUT
  if (output) fs.appendFileSync(output, `candidate-retained=${retained}\n`)
  return { retained }
}

export async function cloudflareGuidance(mode, id, options = {}) {
  const root = options.root ?? path.resolve(import.meta.dirname, '..')
  const app = delivery(root, id)
  const evidence = fs.existsSync(app.evidenceFile)
    ? readGuidance(app.evidenceFile)
    : undefined
  if (mode === 'check') assert.ok(evidence, 'Missing release guidance')
  const sourceSha =
    options.sourceSha ??
    process.env.SOURCE_SHA ??
    runReleaseCommand('git', ['rev-parse', 'HEAD'], { cwd: root }).trim()
  // Evidence is outside the upload directory, so it cannot change the verified site.
  const marker = JSON.parse(
    fs.readFileSync(path.join(app.directory, 'deployment-version.json'), 'utf8')
  )
  assert.equal(
    marker.sourceSha,
    sourceSha,
    'Candidate artifact source marker changed'
  )
  if (id !== 'asyra-framework')
    assert.equal(marker.app, id, 'Candidate artifact owner changed')
  const artifact = { id, integrity: artifactIntegrity(app.directory) }
  const baseline = await cloudflareBaseline(id, { ...options, root })
  const inputs = {
    root,
    owner: `cloudflare/${id}`,
    sourceSha,
    deliveries: [{ id, roots: app.roots, baseline, artifact }]
  }
  if (mode === 'prepare') {
    if (evidence?.sourceSha === sourceSha) {
      admitGuidance({
        ...inputs,
        evidence,
        current: [baseline],
        publication: publicationFor(app.evidenceFile, evidence)
      })
      return evidence
    }
    assert.notEqual(
      baseline.sourceSha,
      sourceSha,
      'Release coverage gap: missing original candidate for deployed retry'
    )
    requireVerifiedBaseline(root, app, baseline)
    const candidate = prepareGuidance(inputs)
    writeGuidance(app.evidenceFile, candidate)
    return candidate
  }
  assert.equal(mode, 'check', 'Expected prepare or check')
  return admitGuidance({
    ...inputs,
    evidence,
    current: [baseline],
    publication: evidence && publicationFor(app.evidenceFile, evidence)
  })
}

export function recordCloudflareGuidance(
  id,
  {
    root = path.resolve(import.meta.dirname, '..'),
    deploymentId,
    published,
    verified
  } = {}
) {
  const app = delivery(root, id)
  const evidence = readGuidance(app.evidenceFile)
  const previous = publicationFor(app.evidenceFile, evidence)?.outcomes[id]
  const retained = !published && previous?.published === true
  const result = recordGuidanceResult(
    `${app.evidenceFile}.result.json`,
    evidence,
    id,
    verified ? 'verified' : 'failed',
    {
      deploymentId: retained ? previous.deploymentId : deploymentId,
      published: retained || published,
      verified,
      attemptPublished: published
    }
  )
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `\nRelease guidance: \`${path.relative(root, app.evidenceFile)}\` (${result.guidance})\n\nPublished: ${published}; verified: ${verified}.\n`
    )
  return result
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [mode, id] = process.argv.slice(2)
  if (mode === 'record')
    recordCloudflareGuidance(id, {
      deploymentId: process.env.DEPLOYMENT_ID,
      published: process.env.DEPLOY_OUTCOME === 'success',
      verified: process.env.VERIFY_OUTCOME === 'success'
    })
  else if (mode === 'restore') await restoreCloudflareGuidance(id)
  else await cloudflareGuidance(mode, id)
}
