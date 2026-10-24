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

export async function cloudflareGuidance(mode, id, options = {}) {
  const root = options.root ?? path.resolve(import.meta.dirname, '..')
  const app = delivery(root, id)
  const evidence = mode === 'check' ? readGuidance(app.evidenceFile) : undefined
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
    const candidate = prepareGuidance(inputs)
    writeGuidance(app.evidenceFile, candidate)
    return candidate
  }
  assert.equal(mode, 'check', 'Expected prepare or check')
  return admitGuidance({ ...inputs, evidence, current: [baseline] })
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
  const result = recordGuidanceResult(
    `${app.evidenceFile}.result.json`,
    evidence,
    id,
    verified ? 'verified' : 'failed',
    { deploymentId, published, verified }
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
  else await cloudflareGuidance(mode, id)
}
