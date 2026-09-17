/* global fetch, URL, AbortSignal */

import assert from 'node:assert/strict'
import {
  selectReleaseApps,
  assertBudget,
  requireCommit
} from './app-release-plan.mjs'

export function createApi(origin, token, query = {}, fetcher = fetch) {
  assert.ok(token, `Missing credential for ${origin}`)
  return async (path, method = 'GET', body) => {
    assert.ok(
      path.startsWith('/') && !path.startsWith('//'),
      'API paths must be relative'
    )
    const url = new URL(path, origin)
    for (const [key, value] of Object.entries(query))
      url.searchParams.set(key, value)
    const response = await fetcher(url, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
    // No automatic mutation retries: a timeout may already have created a deployment.
    assert.ok(
      response.ok,
      `${origin} ${method} ${url.pathname} failed (${response.status}); inspect the provider before retrying`
    )
    const text = await response.text()
    return text ? JSON.parse(text) : {}
  }
}

export async function readBaselines(github, repository, targetApp = '') {
  const baselines = {}
  for (const app of selectReleaseApps(targetApp)) {
    const environments = [
      `app-production - ${app.id}`,
      `Production \u2013 ${app.id}`
    ]
    // The second name is the immutable Vercel Git integration environment.
    for (const environment of environments) {
      let found
      for (let page = 1; page <= 10 && !found; page++) {
        const deployments = await github(
          `/repos/${repository}/deployments?environment=${encodeURIComponent(environment)}&per_page=100&page=${page}`
        )
        if (!deployments.length) break
        for (const deployment of deployments) {
          const statuses = await github(
            `/repos/${repository}/deployments/${deployment.id}/statuses?per_page=100`
          )
          if (statuses[0]?.state !== 'success') continue
          found = {
            sha: requireCommit(deployment.sha),
            record: deployment.id,
            deploymentId: deployment.payload?.deploymentId ?? null
          }
          break
        }
        if (deployments.length < 100) break
      }
      if (found) {
        baselines[app.id] = found
        break
      }
    }
    assert.ok(
      baselines[app.id],
      `No successful online record for ${app.id}; reconcile the baseline first`
    )
  }
  return baselines
}

export async function verifyProject(project, app, vercel) {
  assert.equal(project.name, app.id, 'Unexpected Vercel project')
  assert.equal(project.rootDirectory, app.root, 'Unexpected Vercel root')
  assert.ok(
    !project.link,
    'Disconnect the project Git integration before manual release'
  )
  assert.equal(
    project.autoAssignCustomDomains,
    false,
    'Disable automatic production domain assignment before release'
  )
  const current = await readProductionDeployment(vercel, project, app)
  assert.equal(
    current.meta?.githubCommitSha ?? current.meta?.releaseSha,
    app.baseline.sha,
    'Online SHA changed after the release plan; re-plan'
  )
  if (app.baseline.deploymentId)
    assert.equal(
      current.id,
      app.baseline.deploymentId,
      'Online deployment changed after the release plan'
    )
  return current.id
}

// A project's production target may be canceled or staged. The stable host's
// alias is the authority for what visitors receive, refreshed at each gate.
async function readProductionDeployment(vercel, project, app) {
  assert.ok(project.id, 'Missing Vercel project ID')
  const alias = await vercel(`/v4/aliases/${encodeURIComponent(app.host)}`)
  assert.equal(alias.alias, app.host, 'Unexpected production alias')
  assert.equal(
    alias.projectId,
    project.id,
    'Production alias belongs to another project'
  )
  assert.ok(!alias.redirect, 'Production alias must not redirect')
  assert.ok(alias.deploymentId, 'Missing deployment for production alias')
  const current = await vercel(
    `/v13/deployments/${encodeURIComponent(alias.deploymentId)}`
  )
  assert.equal(
    current.id,
    alias.deploymentId,
    'Production deployment ID mismatch'
  )
  assert.equal(
    current.projectId,
    project.id,
    'Production deployment belongs to another project'
  )
  assert.equal(
    current.readyState,
    'READY',
    'Production deployment is not ready'
  )
  assert.equal(
    current.target,
    'production',
    'Unexpected deployment environment'
  )
  return current
}

export async function deploymentUsage(vercel, now = Date.now()) {
  let total = 0
  let managed = 0
  let until = ''
  for (let page = 0; page < 20; page++) {
    const response = await vercel(
      `/v6/deployments?limit=100&since=${now - 86_400_000}${until}`
    )
    for (const deployment of response.deployments) {
      total++
      if (deployment.meta?.releaseOwner === 'manual-app-release') managed++
    }
    if (!response.pagination?.next) return { total, managed }
    until = `&until=${response.pagination.next}`
  }
  throw new Error(
    'Deployment usage pagination exceeded its bound; refusing release'
  )
}

export async function waitForDeployment(
  vercel,
  id,
  sha,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  projectId
) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const deployment = await vercel(`/v13/deployments/${id}`)
    assert.ok(
      !['ERROR', 'CANCELED'].includes(deployment.readyState),
      `Deployment ${id} ${deployment.readyState}`
    )
    if (deployment.readyState === 'READY') {
      assert.equal(deployment.id, id, 'Deployment ID mismatch')
      if (projectId)
        assert.equal(
          deployment.projectId,
          projectId,
          'Deployment belongs to another project'
        )
      assert.equal(
        deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha,
        sha,
        'Vercel built a different commit'
      )
      assert.equal(deployment.target, 'production')
      // Generated team/branch aliases can exist on staged deployments.
      // publishPlan checks the stable host's actual routing before promotion.
      assert.match(deployment.url, /^[a-z0-9-]+\.vercel\.app$/)
      return deployment
    }
    await sleep(15_000)
  }
  throw new Error(`Deployment ${id} timed out; inspect it before retrying`)
}

export async function smokeOrigin(
  origin,
  app,
  fetcher = fetch,
  { bypassSecret, bypassOrigin } = {}
) {
  const url = new URL(origin)
  assert.equal(url.protocol, 'https:')
  assert.ok(
    url.hostname === app.host || /^[a-z0-9-]+\.vercel\.app$/.test(url.hostname)
  )
  const headers = {}
  if (bypassSecret) {
    assert.equal(
      url.origin,
      bypassOrigin,
      'Unexpected automation bypass origin'
    )
    assert.equal(url.username, '')
    assert.equal(url.password, '')
    headers['x-vercel-protection-bypass'] = bypassSecret
  }
  const paths = app.id === 'asyra-framework' ? ['/', '/docs', '/atlas'] : ['/']
  for (const path of paths) {
    const response = await fetcher(new URL(path, url), {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000)
    })
    assert.equal(response.status, 200, `${app.id} ${path} failed smoke`)
    assert.match(response.headers.get('content-type') ?? '', /text\/html/)
    const html = await response.text()
    assert.match(html, /<html/i)
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
      .map((match) => new URL(match[1], url))
      .filter((asset) => asset.origin === url.origin)
    assert.ok(scripts.length > 0, 'No application scripts in deployed HTML')
    for (const asset of scripts) {
      const result = await fetcher(asset, {
        headers,
        redirect: 'error',
        signal: AbortSignal.timeout(30_000)
      })
      assert.equal(result.status, 200, 'Deployed script is unavailable')
      assert.match(result.headers.get('content-type') ?? '', /javascript/)
      await result.body?.cancel()
    }
  }
}

export async function publishPlan({
  plan,
  vercel,
  github,
  repository,
  runUrl,
  usage = deploymentUsage,
  wait = waitForDeployment,
  smoke = smokeOrigin,
  bypassSecrets = {}
}) {
  requireCommit(plan.sha)
  const selected = plan.apps.filter((app) => app.release)
  // Verify every selected project before consuming any deployment quota.
  const previous = new Map()
  const projectIds = new Map()
  for (const app of selected) {
    const project = await vercel(`/v9/projects/${app.id}`)
    previous.set(app.id, await verifyProject(project, app, vercel))
    projectIds.set(app.id, project.id)
    assert.ok(
      !project.ssoProtection || bypassSecrets[app.id],
      `${app.id} needs an automation bypass secret before creating a deployment`
    )
  }
  assertBudget({ ...(await usage(vercel)), requested: selected.length })
  for (const app of selected) {
    const project = await vercel(`/v9/projects/${app.id}`)
    assert.equal(
      project.id,
      projectIds.get(app.id),
      'Project ID changed after admission'
    )
    assert.equal(
      await verifyProject(project, app, vercel),
      previous.get(app.id)
    )
    let deployment
    let record
    let promoted = false
    let promotionRequested = false
    let restorationAttempted = false
    const status = (state, environmentUrl) =>
      github(`/repos/${repository}/deployments/${record.id}/statuses`, 'POST', {
        state,
        auto_inactive: false,
        log_url: runUrl,
        ...(environmentUrl ? { environment_url: environmentUrl } : {})
      })
    // Promotion can re-enable automatic domains. Restore the admitted policy,
    // including after an ambiguous response, without retrying either mutation.
    const restorePolicy = async () => {
      restorationAttempted = true
      const path = `/v9/projects/${encodeURIComponent(project.id)}`
      const current = await vercel(`/v9/projects/${app.id}`)
      assert.equal(
        current.id,
        project.id,
        'Project ID changed during promotion'
      )
      if (current.autoAssignCustomDomains === true) {
        await vercel(path, 'PATCH', { autoAssignCustomDomains: false })
        assert.equal(
          (await vercel(`/v9/projects/${app.id}`)).autoAssignCustomDomains,
          false,
          'Automatic domain assignment was not disabled'
        )
      } else {
        assert.equal(
          current.autoAssignCustomDomains,
          false,
          'Unknown automatic domain policy'
        )
      }
    }
    try {
      deployment = await vercel(
        `/v13/deployments${app.forced ? '?forceNew=1' : ''}`,
        'POST',
        {
          name: app.id,
          project: app.id,
          target: 'production',
          gitSource: {
            type: 'github',
            org: repository.split('/')[0],
            repo: repository.split('/')[1],
            ref: plan.sha,
            sha: plan.sha
          },
          projectSettings: { skipGitConnectDuringLink: true },
          meta: {
            releaseOwner: 'manual-app-release',
            releaseSha: plan.sha,
            releaseRun: runUrl
          }
        }
      )
      assert.ok(
        typeof deployment?.id === 'string' && deployment.id.length > 0,
        'Missing deployment ID'
      )
      // Write the deployment ID immediately, before waiting, to make failures reviewable.
      record = await github(`/repos/${repository}/deployments`, 'POST', {
        ref: plan.sha,
        auto_merge: false,
        required_contexts: [],
        environment: `app-production - ${app.id}`,
        production_environment: true,
        payload: {
          schema: 1,
          deploymentId: deployment.id,
          previousDeploymentId: previous.get(app.id),
          runUrl,
          reason: plan.reason
        }
      })
      assert.ok(record?.id, 'Missing GitHub deployment record ID')
      await status('in_progress')
      const ready = await wait(
        vercel,
        deployment.id,
        plan.sha,
        undefined,
        project.id
      )
      await smoke(`https://${ready.url}`, app, undefined, {
        bypassOrigin: `https://${ready.url}`,
        bypassSecret: bypassSecrets[app.id]
      })
      const currentProject = await vercel(`/v9/projects/${app.id}`)
      assert.equal(
        currentProject.id,
        project.id,
        'Project ID changed before promotion'
      )
      assert.equal(
        await verifyProject(currentProject, app, vercel),
        previous.get(app.id)
      )
      promotionRequested = true
      await vercel(
        `/v10/projects/${encodeURIComponent(project.id)}/promote/${encodeURIComponent(deployment.id)}`,
        'POST',
        {}
      )
      promoted = true
      // Promotion is asynchronous. Wait for the stable host to serve the candidate.
      let current
      for (let attempt = 0; attempt < 30; attempt++) {
        current = await readProductionDeployment(
          vercel,
          await vercel(`/v9/projects/${app.id}`),
          app
        )
        if (current.id === deployment.id) break
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      assert.equal(
        current.id,
        deployment.id,
        'Production promotion did not settle'
      )
      assert.equal(
        current.meta?.githubCommitSha ?? current.meta?.releaseSha,
        plan.sha,
        'Promoted deployment has a different source SHA'
      )
      await restorePolicy()
      await smoke(`https://${app.host}`, app)
      await status('success', `https://${app.host}`)
    } catch (error) {
      let recovery = ''
      if (promotionRequested && !restorationAttempted) {
        try {
          await restorePolicy()
        } catch (restoreError) {
          recovery = ` Policy restoration failed: ${restoreError.message}`
        }
      }
      if (record?.id) {
        await status('failure').catch(() => {
          // Preserve the original failure if GitHub reporting is unavailable.
        })
      }
      let phase = 'before promotion'
      if (promotionRequested) phase = 'with promotion outcome unknown'
      if (promoted) phase = 'after promotion'
      throw new Error(
        `${app.id} failed ${phase}. Deployment ${deployment?.id ?? 'unknown (creation may have completed; inspect provider)'}; previous ${previous.get(app.id)}. ${error.message}${recovery}`
      )
    }
  }
}
