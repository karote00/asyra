/* global fetch, AbortSignal */
import assert from 'node:assert/strict'
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL, URL } from 'node:url'
import { setTimeout as pause } from 'node:timers/promises'

// Public deployment identities; runtime and persisted App identities are unchanged.
export const DEPLOYMENT_APPS = Object.freeze([
  {
    id: 'asyra-design',
    project: 'asyra-design',
    root: 'apps/asyra-design',
    output: 'apps/asyra-design/dist/frontend'
  },
  {
    id: 'fieldscope',
    project: 'asyra-fieldscope',
    root: 'apps/fieldscope',
    output: 'apps/fieldscope/dist/frontend'
  },
  {
    id: 'asyra-sim',
    project: 'asyra-sim',
    root: 'apps/asyra-sim',
    output: 'apps/asyra-sim/dist'
  }
])

async function inspectFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), 'Deployment cannot contain symlinks')
    assert.ok(
      !/^\.env(?:\.|$)|^(?:node_modules|functions|_worker\.js)$/.test(
        entry.name
      ),
      `Forbidden deployment file: ${entry.name}`
    )
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await inspectFiles(file)))
    else {
      assert.ok(
        (await stat(file)).size <= 25 * 1024 * 1024,
        `File exceeds Pages upload limit: ${file}`
      )
      files.push(file)
    }
  }
  return files
}

export async function prepareApps({
  root = path.resolve(import.meta.dirname, '..'),
  sha = process.env.SOURCE_SHA
} = {}) {
  assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'Expected a full Git commit SHA')
  for (const app of DEPLOYMENT_APPS) {
    const source = path.join(root, app.output)
    await stat(path.join(source, 'index.html'))
    const files = await inspectFiles(source)
    assert.ok(
      files.length + 3 <= 1000,
      'Artifact exceeds dashboard upload file limit'
    )
    const destination = path.join(root, 'tmp/cloudflare-apps', app.id)
    await rm(destination, { recursive: true, force: true })
    await mkdir(destination, { recursive: true })
    await cp(source, destination, { recursive: true })
    const config = JSON.parse(
      await readFile(path.join(root, app.root, 'vercel.json'), 'utf8')
    )
    const headers = (config.headers ?? []).flatMap((rule) => {
      assert.equal(
        rule.source,
        '/(.*)',
        'Review non-global response headers before publication'
      )
      return rule.headers.map(({ key, value }) => `  ${key}: ${value}`)
    })
    if (headers.length)
      await writeFile(
        path.join(destination, '_headers'),
        `/*\n${headers.join('\n')}\n`
      )
    // These Apps use root/query navigation. A real 404 prevents missing API or
    // Worker requests from receiving Pages' implicit SPA index fallback.
    await writeFile(
      path.join(destination, '404.html'),
      '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>Page not found</h1></html>\n'
    )
    await writeFile(
      path.join(destination, 'deployment-version.json'),
      JSON.stringify({ sourceSha: sha, app: app.id })
    )
  }
}

export async function ensureProject(
  id,
  {
    accountId = process.env.CLOUDFLARE_ACCOUNT_ID,
    token = process.env.CLOUDFLARE_API_TOKEN,
    request = fetch
  } = {}
) {
  const app = DEPLOYMENT_APPS.find((entry) => entry.id === id)
  assert.ok(app, 'Unknown deployment App')
  assert.match(accountId ?? '', /^[a-f0-9]{32}$/, 'Invalid account ID')
  assert.ok(token, 'Missing Pages token')
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
  const options = { headers, redirect: 'error' }
  let response = await request(`${endpoint}/${app.project}`, options)
  if (response.status === 404) {
    response = await request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify({ name: app.project, production_branch: 'main' })
    })
  }
  assert.ok(response.ok, `Pages project request failed (${response.status})`)
  const data = await response.json()
  assert.equal(data.success, true, 'Pages project request was unsuccessful')
  assert.equal(data.result.name, app.project)
  assert.equal(data.result.production_branch, 'main')
  assert.equal(data.result.subdomain, `${app.project}.pages.dev`)
  assert.ok(!data.result.source, 'Expected a Direct Upload project')
}

export async function waitForDeploymentVersion(
  origin,
  id,
  sha,
  { request = fetch, pause: wait = pause, attempts = 30 } = {}
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response
    try {
      response = await request(`${origin}/deployment-version.json`, {
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(10_000)
      })
    } catch {
      // DNS and transport can lag the first successful Pages upload.
    }
    if (response?.status === 200) {
      const version = await response.json()
      assert.equal(version.app, id, 'Unexpected deployed App')
      if (version.sourceSha === sha) return
    } else if (response) {
      assert.ok(
        response.status === 404 || response.status >= 500,
        `Unexpected readiness response: ${response.status}`
      )
      await response.body?.cancel()
    }
    if (attempt + 1 < attempts) await wait(2000)
  }
  throw new Error(`Production ${id} did not become ready at revision ${sha}`)
}

export async function verifyDeployment(id, sha = process.env.SOURCE_SHA) {
  const app = DEPLOYMENT_APPS.find((entry) => entry.id === id)
  assert.ok(app, 'Unknown deployment App')
  assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'Expected a full Git commit SHA')
  const origin = `https://${app.project}.pages.dev`
  await waitForDeploymentVersion(origin, id, sha)
  const response = await fetch(origin)
  assert.equal(response.status, 200)
  const html = await response.text()
  const assets = [...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)].map(
    (match) => new URL(match[1], `${origin}/`).href
  )
  assert.ok(
    assets.some((url) => url.endsWith('.js')),
    'Missing production script'
  )
  for (const asset of assets)
    assert.equal((await fetch(asset)).status, 200, asset)
  for (const missing of ['/api/ai/action-batch', '/missing-worker.js']) {
    assert.equal((await fetch(`${origin}${missing}`)).status, 404, missing)
  }
  const config = JSON.parse(
    await readFile(
      new URL(`../${app.root}/vercel.json`, import.meta.url),
      'utf8'
    )
  )
  for (const rule of config.headers ?? []) {
    for (const { key, value } of rule.headers)
      assert.equal(response.headers.get(key), value, key)
  }
  console.log(`Production verified: ${id} at ${origin} (${sha})`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const mode = process.argv[2]
  assert.ok(
    ['prepare', 'ensure-project', 'verify'].includes(mode),
    'Expected prepare, ensure-project or verify'
  )
  if (mode === 'prepare') await prepareApps()
  else if (mode === 'ensure-project') await ensureProject(process.argv[3])
  else await verifyDeployment(process.argv[3])
}
