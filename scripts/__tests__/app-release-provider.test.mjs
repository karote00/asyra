/* global Response */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createApi,
  publishPlan,
  waitForDeployment
} from '../app-release-service.mjs'

const sha = 'b'.repeat(40)
const oldSha = 'a'.repeat(40)
const app = {
  id: 'site',
  root: 'apps/site',
  host: 'site.vercel.app',
  release: true,
  baseline: { sha: oldSha, deploymentId: 'old' }
}

// HTTP contract follows Vercel CLI request-promote.ts: project.id, POST body {},
// empty 201 response. Names are accepted by project lookup, not promotion.
function provider({
  promotionTimeout = false,
  recordFailure = false,
  statusFailure = false,
  resetFailure = false,
  flipPolicy = false,
  candidateProject = 'prj_site'
} = {}) {
  const calls = []
  let promoted = false
  let autoAssignCustomDomains = false
  const api = createApi(
    'https://api.vercel.com',
    'test-only',
    { teamId: 'team_test' },
    async (url, options) => {
      assert.equal(url.searchParams.get('teamId'), 'team_test')
      assert.equal(options.redirect, 'error')
      const path = url.pathname
      const body =
        options.body === undefined ? undefined : JSON.parse(options.body)
      calls.push({ path, method: options.method, body })
      const json = (data) => new Response(JSON.stringify(data), { status: 200 })
      if (
        options.method === 'GET' &&
        ['/v9/projects/site', '/v9/projects/prj_site'].includes(path)
      )
        return json({
          id: 'prj_site',
          name: 'site',
          rootDirectory: app.root,
          autoAssignCustomDomains
        })
      if (path === '/v4/aliases/site.vercel.app')
        return json({
          alias: app.host,
          projectId: 'prj_site',
          deploymentId: promoted ? 'new' : 'old'
        })
      if (
        options.method === 'GET' &&
        ['/v13/deployments/old', '/v13/deployments/new'].includes(path)
      ) {
        const candidate = path.endsWith('/new')
        return json({
          id: candidate ? 'new' : 'old',
          projectId: candidate ? candidateProject : 'prj_site',
          readyState: 'READY',
          target: 'production',
          aliasAssigned: true,
          meta: { githubCommitSha: candidate ? sha : oldSha },
          url: 'site-candidate.vercel.app'
        })
      }
      if (path === '/v13/deployments' && options.method === 'POST')
        return json({ id: 'new' })
      if (
        path === '/v10/projects/prj_site/promote/new' &&
        options.method === 'POST'
      ) {
        assert.deepEqual(body, {})
        promoted = true
        autoAssignCustomDomains = flipPolicy
        if (promotionTimeout) throw new Error('Request timed out')
        return new Response(null, { status: 201 })
      }
      if (path === '/v9/projects/prj_site' && options.method === 'PATCH') {
        assert.deepEqual(body, { autoAssignCustomDomains: false })
        if (resetFailure)
          return new Response('private provider response', { status: 503 })
        autoAssignCustomDomains = false
        return json({})
      }
      return new Response('private provider response', { status: 404 })
    }
  )
  const statuses = []
  const options = {
    plan: { sha, apps: [app] },
    vercel: api,
    repository: 'owner/repo',
    runUrl: 'https://github.com/owner/repo/actions/runs/1',
    usage: async () => ({ total: 0, managed: 0 }),
    smoke: async (origin) => {
      assert.ok(
        [
          'https://site-candidate.vercel.app',
          'https://site.vercel.app'
        ].includes(origin)
      )
    },
    github: async (path, method, body) => {
      if (path.endsWith('/deployments')) {
        if (recordFailure) throw new Error('Record unavailable')
        return { id: 1 }
      }
      statuses.push(body.state)
      if (statusFailure && body.state === 'in_progress')
        throw new Error('Status unavailable')
      return {}
    }
  }
  return { options, calls, statuses, policy: () => autoAssignCustomDomains }
}

test('real HTTP adapter promotes by project ID with JSON body and accepts an empty success response', async () => {
  const { options, calls, statuses } = provider()
  await publishPlan(options)
  assert.equal(
    calls.filter((call) => call.path.includes('/promote/')).length,
    1
  )
  assert.equal(statuses.at(-1), 'success')
})

test('promotion restores disabled automatic domains before recording success', async () => {
  const { options, calls, statuses, policy } = provider({ flipPolicy: true })
  await publishPlan(options)
  assert.equal(policy(), false)
  assert.equal(calls.filter((call) => call.method === 'PATCH').length, 1)
  assert.equal(statuses.at(-1), 'success')
})

test('promotion timeout reports uncertainty, restores policy and never repeats the mutation', async () => {
  const { options, calls, statuses, policy } = provider({
    promotionTimeout: true,
    flipPolicy: true
  })
  await assert.rejects(
    publishPlan(options),
    /promotion outcome unknown.*Deployment new; previous old/
  )
  assert.equal(policy(), false)
  assert.equal(
    calls.filter((call) => call.path.includes('/promote/')).length,
    1
  )
  assert.equal(statuses.at(-1), 'failure')
})

test('policy restoration failure stops success and is not retried', async () => {
  const { options, calls, statuses } = provider({
    flipPolicy: true,
    resetFailure: true
  })
  await assert.rejects(publishPlan(options), /after promotion.*503/)
  assert.equal(calls.filter((call) => call.method === 'PATCH').length, 1)
  assert.equal(statuses.at(-1), 'failure')
})

for (const fault of ['recordFailure', 'statusFailure']) {
  test(`${fault} preserves created deployment identity and prevents promotion`, async () => {
    const { options, calls } = provider({ [fault]: true })
    await assert.rejects(
      publishPlan(options),
      /before promotion.*Deployment new; previous old/
    )
    assert.equal(
      calls.filter((call) => call.path.includes('/promote/')).length,
      0
    )
    assert.equal(
      calls.filter(
        (call) => call.path === '/v13/deployments' && call.method === 'POST'
      ).length,
      1
    )
  })
}

test('candidate from another project never reaches smoke or promotion', async () => {
  const { options, calls } = provider({ candidateProject: 'prj_other' })
  options.smoke = async () => assert.fail('wrong project must not be smoked')
  await assert.rejects(
    publishPlan(options),
    /Deployment belongs to another project/
  )
  assert.equal(
    calls.filter((call) => call.path.includes('/promote/')).length,
    0
  )
})

test('readiness rejects a response for a different deployment ID', async () => {
  await assert.rejects(
    waitForDeployment(
      async () => ({
        id: 'other',
        projectId: 'prj_site',
        readyState: 'READY',
        target: 'production',
        meta: { githubCommitSha: sha },
        url: 'site-candidate.vercel.app'
      }),
      'new',
      sha
    ),
    /Deployment ID mismatch/
  )
})

test('API errors name the failed endpoint without response bodies or query secrets', async () => {
  const api = createApi(
    'https://api.vercel.com',
    'credential',
    {},
    async () => new Response('private payload', { status: 404 })
  )
  await assert.rejects(
    api('/v10/projects/prj_site/promote/new?secret=hidden', 'POST', {}),
    (error) => {
      assert.match(
        error.message,
        /POST \/v10\/projects\/prj_site\/promote\/new failed \(404\)/
      )
      assert.doesNotMatch(error.message, /credential|private payload|hidden/)
      return true
    }
  )
})

for (const code of [401, 403, 404, 409, 429, 500]) {
  test(`HTTP ${code} fails once without retrying deployment creation`, async () => {
    let requests = 0
    const api = createApi('https://api.vercel.com', 'test', {}, async () => {
      requests++
      return new Response('private', { status: code })
    })
    await assert.rejects(
      api('/v13/deployments', 'POST', {}),
      new RegExp(String(code))
    )
    assert.equal(requests, 1)
  })
}

test('creation timeout preserves prior deployment and does not retry', async () => {
  const { options, calls } = provider()
  const api = options.vercel
  let creates = 0
  options.vercel = async (path, method, body) => {
    if (path === '/v13/deployments' && method === 'POST') {
      creates++
      throw new Error('Request timed out')
    }
    return api(path, method, body)
  }
  await assert.rejects(
    publishPlan(options),
    /Deployment unknown \(creation may have completed; inspect provider\); previous old/
  )
  assert.equal(creates, 1)
  assert.equal(
    calls.filter((call) => call.path.includes('/promote/')).length,
    0
  )
})

for (const phase of ['staged', 'production']) {
  test(`${phase} smoke failure records failure at the correct promotion boundary`, async () => {
    const { options, calls, statuses } = provider()
    options.smoke = async (origin) => {
      if ((origin === `https://${app.host}`) === (phase === 'production'))
        throw new Error('HTTP smoke failed')
    }
    await assert.rejects(
      publishPlan(options),
      new RegExp(
        `${phase === 'staged' ? 'before' : 'after'} promotion.*HTTP smoke failed`
      )
    )
    assert.equal(
      calls.filter((call) => call.path.includes('/promote/')).length,
      phase === 'staged' ? 0 : 1
    )
    assert.equal(statuses.at(-1), 'failure')
  })
}

test('failed success recording never reports a successful release', async () => {
  const { options, calls, statuses } = provider()
  const github = options.github
  options.github = async (path, method, body) => {
    if (body.state === 'success') throw new Error('Success status unavailable')
    return github(path, method, body)
  }
  await assert.rejects(
    publishPlan(options),
    /after promotion.*Success status unavailable/
  )
  assert.equal(
    calls.filter((call) => call.path.includes('/promote/')).length,
    1
  )
  assert.equal(statuses.at(-1), 'failure')
})

test('build polling has a finite read budget and never starts a second deployment', async () => {
  let reads = 0
  let waits = 0
  await assert.rejects(
    waitForDeployment(
      async () => {
        reads++
        return { readyState: 'BUILDING' }
      },
      'new',
      sha,
      async () => {
        waits++
      }
    ),
    /timed out/
  )
  assert.equal(reads, 200)
  assert.equal(waits, 200)
})

for (const gate of [2, 3]) {
  test(`project identity drift at gate ${gate} prevents promotion`, async () => {
    const { options, calls } = provider()
    const api = options.vercel
    let reads = 0
    options.vercel = async (path, method, body) => {
      const result = await api(path, method, body)
      if (path === '/v9/projects/site' && ++reads === gate)
        return { ...result, id: 'prj_replacement' }
      return result
    }
    await assert.rejects(publishPlan(options), /Project ID changed/)
    assert.equal(
      calls.filter((call) => call.path.includes('/promote/')).length,
      0
    )
  })
}

test('a malformed creation response stops before recording or promoting an unknown deployment', async () => {
  const { options } = provider()
  const api = options.vercel
  let records = 0
  options.vercel = (path, method, body) =>
    path === '/v13/deployments' && method === 'POST'
      ? Promise.resolve({})
      : api(path, method, body)
  options.github = async () => {
    records++
    return { id: 1 }
  }
  await assert.rejects(publishPlan(options), /Missing deployment ID/)
  assert.equal(records, 0)
})
