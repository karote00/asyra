import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import {
  DEPLOYMENT_APPS,
  prepareApps,
  ensureProject
} from '../app-cloudflare.mjs'

test('static delivery preserves assets and headers without publishing source or services', async (t) => {
  const root = await mkdtemp(path.join(import.meta.dirname, '.cloudflare-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const app of DEPLOYMENT_APPS) {
    await mkdir(path.join(root, app.output, 'assets'), { recursive: true })
    await writeFile(
      path.join(root, app.output, 'index.html'),
      '<html>App</html>'
    )
    await writeFile(
      path.join(root, app.output, 'assets/worker.js'),
      'postMessage(1)'
    )
    await writeFile(path.join(root, app.root, '.env'), 'SECRET=private')
    await writeFile(
      path.join(root, app.root, 'vercel.json'),
      JSON.stringify({
        headers: [
          { source: '/(.*)', headers: [{ key: 'X-Test', value: app.id }] }
        ]
      })
    )
  }
  const sha = 'a'.repeat(40)
  await prepareApps({ root, sha })
  for (const app of DEPLOYMENT_APPS) {
    const output = path.join(root, 'tmp/cloudflare-apps', app.id)
    assert.equal(
      await readFile(path.join(output, 'assets/worker.js'), 'utf8'),
      'postMessage(1)'
    )
    assert.match(
      await readFile(path.join(output, '_headers'), 'utf8'),
      new RegExp(`X-Test: ${app.id}`)
    )
    assert.match(
      await readFile(path.join(output, '404.html'), 'utf8'),
      /Page not found/
    )
    assert.deepEqual(
      JSON.parse(
        await readFile(path.join(output, 'deployment-version.json'), 'utf8')
      ),
      { sourceSha: sha, app: app.id }
    )
    await assert.rejects(readFile(path.join(output, '.env')), {
      code: 'ENOENT'
    })
  }
  await writeFile(
    path.join(root, DEPLOYMENT_APPS[0].output, '_worker.js'),
    'export default {}'
  )
  await assert.rejects(prepareApps({ root, sha }), /Forbidden deployment file/)
})

test('publication requires an exact source revision', async () => {
  await assert.rejects(prepareApps({ sha: 'main' }), /full Git commit/)
})

test('project admission creates only missing fixed projects and validates their identity', async () => {
  const result = {
    name: 'asyra-design',
    production_branch: 'main',
    subdomain: 'asyra-design.pages.dev'
  }
  for (const missing of [false, true]) {
    const calls = []
    await ensureProject('asyra-design', {
      accountId: 'a'.repeat(32),
      token: 'test-token',
      request: async (url, options) => {
        calls.push({ url, options })
        if (missing && calls.length === 1) return { status: 404 }
        return { ok: true, json: async () => ({ success: true, result }) }
      }
    })
    assert.equal(calls.length, missing ? 2 : 1)
    assert.ok(calls[0].url.endsWith('/pages/projects/asyra-design'))
    assert.equal(calls[0].options.redirect, 'error')
    if (missing) {
      assert.equal(calls[1].options.method, 'POST')
      assert.deepEqual(JSON.parse(calls[1].options.body), {
        name: 'asyra-design',
        production_branch: 'main'
      })
    }
  }
  for (const status of [401, 403, 429, 500]) {
    let count = 0
    await assert.rejects(
      ensureProject('asyra-design', {
        accountId: 'a'.repeat(32),
        token: 'test-token',
        request: async () => {
          count++
          return { ok: false, status }
        }
      }),
      /request failed/
    )
    assert.equal(count, 1, 'An uncertain failure must not create a project')
  }
  for (const mismatch of [
    { name: 'other' },
    { production_branch: 'other' },
    { subdomain: 'other.pages.dev' },
    { source: { type: 'github' } }
  ]) {
    await assert.rejects(
      ensureProject('asyra-design', {
        accountId: 'a'.repeat(32),
        token: 'test-token',
        request: async () => ({
          ok: true,
          json: async () => ({
            success: true,
            result: { ...result, ...mismatch }
          })
        })
      })
    )
  }
})
