/* global Response, URL */

import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers/promises'
import {
  createApi,
  deploymentUsage,
  publishPlan,
  readBaselines,
  smokeOrigin,
  verifyProject,
  waitForDeployment
} from '../app-release-service.mjs'

import { RELEASE_APPS, createReleasePlan } from '../app-release-plan.mjs'

const sha = 'b'.repeat(40)
const app = {
  id: 'asyra-sim',
  root: 'apps/asyra-sim',
  host: 'asyra-sim.vercel.app',
  baseline: { sha: 'a'.repeat(40), deploymentId: 'old' },
  release: true
}
const project = {
  id: 'project-id',
  name: app.id,
  rootDirectory: app.root,
  autoAssignCustomDomains: false,
  targets: {
    production: { id: 'old', meta: { githubCommitSha: app.baseline.sha } }
  }
}

const liveDeployment = {
  id: 'old',
  projectId: project.id,
  readyState: 'READY',
  target: 'production',
  meta: { githubCommitSha: app.baseline.sha }
}
const liveAlias = {
  alias: app.host,
  projectId: project.id,
  deploymentId: 'old'
}
const liveApi = async (url) => {
  if (url === `/v4/aliases/${app.host}`) return liveAlias
  assert.equal(url, '/v13/deployments/old')
  return liveDeployment
}

test('project admission rejects Git connections, automatic aliases and online drift', async () => {
  assert.equal(await verifyProject(project, app, liveApi), 'old')
  for (const changed of [
    { link: {} },
    { autoAssignCustomDomains: true },
    { rootDirectory: 'other' }
  ])
    await assert.rejects(
      verifyProject({ ...project, ...changed }, app, liveApi)
    )
  await assert.rejects(
    verifyProject(
      project,
      { ...app, baseline: { sha, deploymentId: 'old' } },
      liveApi
    ),
    /Online SHA/
  )
  await assert.rejects(
    verifyProject(
      project,
      { ...app, baseline: { ...app.baseline, deploymentId: 'other' } },
      liveApi
    ),
    /Online deployment/
  )
})

for (const changed of [
  { alias: 'other.vercel.app' },
  { projectId: 'other-project' },
  { deploymentId: null },
  { redirect: 'https://other.example' }
]) {
  test(`invalid stable alias is rejected: ${JSON.stringify(changed)}`, async () => {
    await assert.rejects(
      verifyProject(project, app, async (url) => {
        assert.equal(url, `/v4/aliases/${app.host}`)
        return { ...liveAlias, ...changed }
      })
    )
  })
}
for (const changed of [
  { id: 'other' },
  { projectId: 'other-project' },
  { readyState: 'CANCELED' },
  { readyState: 'ERROR' },
  { readyState: 'BUILDING' },
  { target: 'preview' },
  { meta: {} }
]) {
  test(`invalid live deployment is rejected: ${JSON.stringify(changed)}`, async () => {
    await assert.rejects(
      verifyProject(project, app, async (url) => {
        if (url === `/v4/aliases/${app.host}`) return liveAlias
        assert.equal(url, '/v13/deployments/old')
        return { ...liveDeployment, ...changed }
      })
    )
  })
}

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
        if (method === 'GET') {
          if (url === `/v9/projects/${app.id}`) return project
          if (url === `/v4/aliases/${app.host}`)
            return { ...liveAlias, deploymentId: promoted ? 'new' : 'old' }
          assert.equal(url, `/v13/deployments/${promoted ? 'new' : 'old'}`)
          return {
            ...liveDeployment,
            id: promoted ? 'new' : 'old',
            meta: { githubCommitSha: promoted ? sha : app.baseline.sha }
          }
        }
        mutations.push({ url, method, body })
        if (url.includes('/promote/')) promoted = true
        return { id: 'new' }
      }
    }
  }
}
test('a canceled production target does not override the READY deployment serving the stable host', async () => {
  const { options, mutations } = harness()
  const original = options.vercel
  options.plan.apps = [
    { ...app, baseline: { ...app.baseline, deploymentId: null } }
  ]
  options.vercel = async (url, method = 'GET', body) => {
    if (method === 'GET' && url.startsWith('/v9/projects/'))
      return {
        ...project,
        targets: {
          production: {
            id: 'canceled',
            readyState: 'CANCELED',
            aliasAssigned: false,
            meta: { githubCommitSha: 'c'.repeat(40) }
          }
        }
      }
    return original(url, method, body)
  }
  await publishPlan(options)
  assert.equal(
    mutations.filter((entry) => entry.url === '/v13/deployments').length,
    1
  )
  assert.equal(
    mutations.find((entry) => entry.body?.payload)?.body.payload
      .previousDeploymentId,
    'old'
  )
  assert.equal(mutations.at(-1).body.state, 'success')
})

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

test('single-App baseline reads never query unrelated deployments', async () => {
  const requests = []
  const result = await readBaselines(
    async (url) => {
      requests.push(decodeURIComponent(url))
      if (url.includes('/statuses')) return [{ state: 'success' }]
      assert.ok(
        decodeURIComponent(url).includes('app-production - asyra-framework')
      )
      return [{ id: 1, sha, payload: {} }]
    },
    'owner/project',
    'asyra-framework'
  )
  assert.deepEqual(Object.keys(result), ['asyra-framework'])
  assert.equal(requests.length, 2)
  await assert.rejects(
    readBaselines(
      async () => {
        assert.fail('Invalid target must not call the API')
      },
      'owner/project',
      'unknown'
    ),
    /Unknown target App/
  )
})

for (const target of RELEASE_APPS) {
  test(`shared changes publish only selected ${target.id} through the release service`, async () => {
    const { options, mutations } = harness()
    options.plan = createReleasePlan({
      sha,
      targetApp: target.id,
      baselines: { [target.id]: app.baseline },
      snapshot: () =>
        RELEASE_APPS.map((entry) => ({ name: entry.id, root: entry.root })),
      diff: () => ['yarn.lock'],
      ancestor: () => ''
    })
    const requests = []
    let promoted = false
    options.vercel = async (url, method = 'GET', body) => {
      requests.push(url)
      if (method === 'GET') {
        if (url === `/v9/projects/${target.id}`)
          return { ...project, name: target.id, rootDirectory: target.root }
        if (url === `/v4/aliases/${target.host}`)
          return {
            ...liveAlias,
            alias: target.host,
            deploymentId: promoted ? 'new' : 'old'
          }
        assert.equal(url, `/v13/deployments/${promoted ? 'new' : 'old'}`)
        return {
          ...liveDeployment,
          id: promoted ? 'new' : 'old',
          meta: { githubCommitSha: promoted ? sha : app.baseline.sha }
        }
      }
      mutations.push({ url, method, body })
      if (url.includes('/promote/')) {
        assert.equal(url, `/v10/projects/${target.id}/promote/new`)
        promoted = true
      }
      return { id: 'new' }
    }
    await publishPlan(options)
    const creates = mutations.filter(
      (entry) => entry.url === '/v13/deployments'
    )
    assert.equal(creates.length, 1)
    assert.equal(creates[0].body.project, target.id)
    assert.equal(creates[0].body.gitSource.sha, sha)
    assert.equal(
      requests.filter((url) => url.startsWith('/v9/projects/')).length,
      4
    )
    assert.equal(mutations.at(-1).body.state, 'success')
  })
}

for (const gate of [1, 2, 3]) {
  test(`live alias drift at release gate ${gate} stops publication`, async () => {
    const { options, mutations } = harness()
    const original = options.vercel
    let reads = 0
    options.vercel = async (url, method = 'GET', body) => {
      if (url === `/v4/aliases/${app.host}` && ++reads === gate)
        return { ...liveAlias, deploymentId: 'other' }
      if (url === '/v13/deployments/other')
        return {
          ...liveDeployment,
          id: 'other',
          meta: { githubCommitSha: sha }
        }
      return original(url, method, body)
    }
    await assert.rejects(publishPlan(options), /Online SHA/)
    assert.equal(reads, gate)
    assert.equal(
      mutations.filter((entry) => entry.url.includes('/promote/')).length,
      0
    )
    assert.equal(
      mutations.filter((entry) => entry.url === '/v13/deployments').length,
      gate === 3 ? 1 : 0
    )
    if (gate < 3) assert.equal(mutations.length, 0)
    else assert.equal(mutations.at(-1).body.state, 'failure')
  })
}

test('a missing production alias fails closed before any mutation', async () => {
  const { options, mutations } = harness()
  const original = options.vercel
  options.vercel = async (url, ...args) => {
    if (url.startsWith('/v4/aliases/')) throw new Error('Alias not found (404)')
    return original(url, ...args)
  }
  await assert.rejects(publishPlan(options), /Alias not found/)
  assert.equal(mutations.length, 0)
})

test('stable-host reads are fresh at every gate and delayed promotion waits for routing', async () => {
  const { options, mutations } = harness()
  const original = options.vercel
  const requests = []
  let aliasReads = 0
  let stableSmoke = false
  options.vercel = async (url, method = 'GET', body) => {
    if (method === 'GET') requests.push(url)
    if (url === `/v4/aliases/${app.host}` && ++aliasReads === 4)
      return liveAlias
    if (url === '/v13/deployments/old') return liveDeployment
    return original(url, method, body)
  }
  options.smoke = async (origin) => {
    if (origin === `https://${app.host}`) {
      assert.equal(aliasReads, 5)
      stableSmoke = true
    }
  }
  await publishPlan(options)
  assert.equal(stableSmoke, true)
  assert.equal(
    requests.filter((url) => url.startsWith('/v4/aliases/')).length,
    5
  )
  assert.equal(
    requests.filter((url) => url.startsWith('/v13/deployments/')).length,
    5
  )
  assert.equal(mutations.at(-1).body.state, 'success')
})

test('promotion to the wrong SHA never reaches stable smoke or success', async () => {
  const { options, mutations } = harness()
  const original = options.vercel
  options.vercel = async (url, ...args) => {
    const result = await original(url, ...args)
    return url === '/v13/deployments/new'
      ? { ...result, meta: { githubCommitSha: app.baseline.sha } }
      : result
  }
  options.smoke = async (origin) =>
    assert.notEqual(origin, `https://${app.host}`)
  await assert.rejects(
    publishPlan(options),
    /after promotion.*different source SHA/
  )
  assert.equal(mutations.at(-1).body.state, 'failure')
})

test('promotion polling is bounded when the stable alias never moves', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const { options, mutations } = harness()
  const original = options.vercel
  let aliasReads = 0
  options.vercel = async (url, ...args) => {
    if (url === `/v4/aliases/${app.host}`) {
      aliasReads++
      return liveAlias
    }
    if (url === '/v13/deployments/old') return liveDeployment
    return original(url, ...args)
  }
  options.smoke = async (origin) =>
    assert.notEqual(origin, `https://${app.host}`)
  const result = assert.rejects(
    publishPlan(options),
    /after promotion.*did not settle/
  )
  for (let attempt = 0; attempt < 30; attempt++) {
    await setImmediate()
    context.mock.timers.tick(2000)
  }
  await result
  assert.equal(aliasReads, 33)
  assert.equal(
    mutations.filter((entry) => entry.url.includes('/promote/')).length,
    1
  )
  assert.equal(mutations.at(-1).body.state, 'failure')
})
