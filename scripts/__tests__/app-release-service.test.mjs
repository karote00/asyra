/* global Response, URL */

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createApi,
  deploymentUsage,
  publishPlan,
  readBaselines,
  smokeOrigin,
  verifyProject,
  waitForDeployment
} from '../app-release-service.mjs'

const sha = 'b'.repeat(40)
const app = {
  id: 'asyra-sim',
  root: 'apps/asyra-sim',
  host: 'asyra-sim.vercel.app',
  baseline: { sha: 'a'.repeat(40), deploymentId: 'old' },
  release: true
}
const project = {
  name: app.id,
  rootDirectory: app.root,
  autoAssignCustomDomains: false,
  targets: {
    production: { id: 'old', meta: { githubCommitSha: app.baseline.sha } }
  }
}

test('project admission rejects Git connections, automatic aliases and online drift', () => {
  assert.equal(verifyProject(project, app), 'old')
  for (const changed of [
    { link: {} },
    { autoAssignCustomDomains: true },
    { rootDirectory: 'other' },
    { targets: { production: { id: 'old', meta: { githubCommitSha: sha } } } }
  ])
    assert.throws(() => verifyProject({ ...project, ...changed }, app))
})
test('HTTP client never retries mutations or leaks response bodies and rejects redirects', async () => {
  let calls = 0
  const api = createApi(
    'https://api.vercel.com',
    'secret',
    {},
    async (_, options) => {
      calls++
      assert.equal(options.redirect, 'error')
      return new Response('sensitive response', { status: 429 })
    }
  )
  await assert.rejects(api('/v13/deployments', 'POST', {}), /429/)
  assert.equal(calls, 1)
  await assert.rejects(api('//attacker.example'), /relative/)
})
test('usage includes failures and canceled deployments across the owner', async () => {
  let calls = 0
  const result = await deploymentUsage(async (url) => {
    calls++
    assert.match(url, /since=/)
    if (calls === 1)
      return {
        deployments: [
          { state: 'CANCELED' },
          { meta: { releaseOwner: 'manual-app-release' } }
        ],
        pagination: { next: 2 }
      }
    assert.match(url, /until=2/)
    return { deployments: [{ state: 'ERROR' }] }
  })
  assert.deepEqual(result, { total: 3, managed: 1 })
})
test('baseline ignores incomplete releases and reads legacy successes during bootstrap', async () => {
  const result = await readBaselines(async (url) => {
    if (url.includes('/statuses')) return [{ state: 'success' }]
    if (decodeURIComponent(url).includes('app-production')) return []
    return [{ id: 1, sha, payload: {} }]
  }, 'owner/project')
  assert.equal(result['asyra-sim'].sha, sha)
})
test('a ready deployment must contain the exact source SHA and stay unaliased', async () => {
  const ready = {
    readyState: 'READY',
    meta: { githubCommitSha: sha },
    target: 'production',
    aliasAssigned: false,
    url: 'app-123.vercel.app'
  }
  assert.equal(
    (await waitForDeployment(async () => ready, 'new', sha)).url,
    ready.url
  )
  await assert.rejects(
    waitForDeployment(
      async () => ({ ...ready, aliasAssigned: true }),
      'new',
      sha
    )
  )
  await assert.rejects(
    waitForDeployment(async () => ({ ...ready, meta: {} }), 'new', sha)
  )
  await assert.rejects(
    waitForDeployment(async () => ({ readyState: 'ERROR' }), 'new', sha)
  )
})

function harness(failSmoke = false) {
  const mutations = []
  let promoted = false
  return {
    mutations,
    options: {
      plan: { sha, reason: '', apps: [app] },
      repository: 'owner/project',
      runUrl: 'https://github.com/karote00/asyra/actions/runs/1',
      usage: async () => ({ total: 0, managed: 0 }),
      wait: async () => ({ url: 'new.vercel.app' }),
      smoke: async () => {
        if (failSmoke) throw new Error('Smoke failed')
      },
      github: async (url, method, body) => {
        mutations.push({ url, method, body })
        return { id: 1 }
      },
      vercel: async (url, method = 'GET', body) => {
        if (method === 'GET')
          return promoted
            ? { ...project, targets: { production: { id: 'new' } } }
            : project
        mutations.push({ url, method, body })
        if (url.includes('/promote/')) promoted = true
        return { id: 'new' }
      }
    }
  }
}
test('one selected App creates exactly one deployment from the admitted SHA', async () => {
  const { options, mutations } = harness()
  await publishPlan(options)
  const create = mutations.filter((m) => m.url === '/v13/deployments')
  assert.equal(create.length, 1)
  assert.equal(create[0].body.gitSource.ref, sha)
  assert.equal(create[0].body.gitSource.sha, sha)
  assert.equal(create[0].body.projectSettings.skipGitConnectDuringLink, true)
  assert.equal(mutations.at(-1).body.state, 'success')
})
test('failed staged smoke records failure and never promotes or retries', async () => {
  const { options, mutations } = harness(true)
  await assert.rejects(publishPlan(options), /before promotion/)
  assert.equal(mutations.filter((m) => m.url.includes('/promote/')).length, 0)
  assert.equal(mutations.filter((m) => m.url === '/v13/deployments').length, 1)
  assert.equal(mutations.at(-1).body.state, 'failure')
})
test('budget and baseline rejection happen before any mutation', async () => {
  const { options, mutations } = harness()
  options.usage = async () => ({ total: 99, managed: 0 })
  await assert.rejects(publishPlan(options))
  assert.equal(mutations.length, 0)
})
test('deployed smoke rejects protected pages and HTML fallback masquerading as JavaScript', async () => {
  await assert.rejects(
    smokeOrigin(
      'https://new.vercel.app',
      app,
      async () => new Response('', { status: 401 })
    )
  )
  let calls = 0
  await assert.rejects(
    smokeOrigin('https://new.vercel.app', app, async () => {
      calls++
      return new Response(
        calls === 1
          ? '<html><script src="/app.js"></script></html>'
          : '<html>fallback</html>',
        { headers: { 'content-type': 'text/html' } }
      )
    })
  )
})

test('protected staged deployment without automation secret fails before deployment creation', async () => {
  const { options, mutations } = harness()
  const original = options.vercel
  options.vercel = async (...args) => {
    const result = await original(...args)
    return {
      ...result,
      ssoProtection: { deploymentType: 'prod_deployment_urls_and_all_previews' }
    }
  }
  await assert.rejects(publishPlan(options), /automation bypass secret/)
  assert.equal(mutations.length, 0)
})

test('automation bypass stays in headers on the exact staged origin and never follows external assets', async () => {
  const requests = []
  const fetcher = async (url, options) => {
    requests.push({ url: String(url), options })
    return new Response(
      requests.length === 1
        ? '<html><script src="/app.js"></script><script src="https://external.example/script.js"></script></html>'
        : 'app()',
      {
        headers: {
          'content-type':
            requests.length === 1 ? 'text/html' : 'application/javascript'
        }
      }
    )
  }
  await smokeOrigin('https://new.vercel.app', app, fetcher, {
    bypassSecret: 'test-only',
    bypassOrigin: 'https://new.vercel.app'
  })
  assert.equal(requests.length, 2)
  for (const request of requests) {
    assert.equal(new URL(request.url).origin, 'https://new.vercel.app')
    assert.equal(
      request.options.headers['x-vercel-protection-bypass'],
      'test-only'
    )
    assert.equal(request.options.redirect, 'error')
    assert.ok(!request.url.includes('test-only'))
  }
  await assert.rejects(
    smokeOrigin('https://other.vercel.app', app, fetcher, {
      bypassSecret: 'test-only',
      bypassOrigin: 'https://new.vercel.app'
    })
  )
})
