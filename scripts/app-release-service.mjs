/* global fetch, URL, AbortSignal */

import assert from 'node:assert/strict'
import {
  RELEASE_APPS,
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
      `${origin} ${method} failed (${response.status}); inspect the provider before retrying`
    )
    const text = await response.text()
    return text ? JSON.parse(text) : {}
  }
}

export async function readBaselines(github, repository) {
  const baselines = {}
  for (const app of RELEASE_APPS) {
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

export function verifyProject(project, app) {
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
  const current = project.targets?.production
  assert.ok(current?.id, 'Missing current production deployment')
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
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const deployment = await vercel(`/v13/deployments/${id}`)
    assert.ok(
      !['ERROR', 'CANCELED'].includes(deployment.readyState),
      `Deployment ${id} ${deployment.readyState}`
    )
    if (deployment.readyState === 'READY') {
      assert.equal(
        deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha,
        sha,
        'Vercel built a different commit'
      )
      assert.equal(deployment.target, 'production')
      assert.equal(
        deployment.aliasAssigned,
        false,
        'Deployment unexpectedly received production domains'
      )
      assert.match(deployment.url, /^[a-z0-9-]+\.vercel\.app$/)
      return deployment
    }
    await sleep(15_000)
  }
  throw new Error(`Deployment ${id} timed out; inspect it before retrying`)
}

export async function smokeOrigin(origin, app, fetcher = fetch) {
  const url = new URL(origin)
  assert.equal(url.protocol, 'https:')
  assert.ok(
    url.hostname === app.host || /^[a-z0-9-]+\.vercel\.app$/.test(url.hostname)
  )
  const paths = app.id === 'asyra-framework' ? ['/', '/docs', '/atlas'] : ['/']
  for (const path of paths) {
    const response = await fetcher(new URL(path, url), {
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
  smoke = smokeOrigin
}) {
  requireCommit(plan.sha)
  const selected = plan.apps.filter((app) => app.release)
  // Verify every selected project before consuming any deployment quota.
  const previous = new Map()
  for (const app of selected)
    previous.set(
      app.id,
      verifyProject(await vercel(`/v9/projects/${app.id}`), app)
    )
  assertBudget({ ...(await usage(vercel)), requested: selected.length })
  for (const app of selected) {
    assert.equal(
      verifyProject(await vercel(`/v9/projects/${app.id}`), app),
      previous.get(app.id)
    )
    const deployment = await vercel(
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
    // Write the deployment ID immediately, before waiting, to make failures reviewable.
    const record = await github(`/repos/${repository}/deployments`, 'POST', {
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
    const status = (state, environmentUrl) =>
      github(`/repos/${repository}/deployments/${record.id}/statuses`, 'POST', {
        state,
        auto_inactive: false,
        log_url: runUrl,
        ...(environmentUrl ? { environment_url: environmentUrl } : {})
      })
    await status('in_progress')
    let promoted = false
    try {
      const ready = await wait(vercel, deployment.id, plan.sha)
      await smoke(`https://${ready.url}`, app)
      assert.equal(
        verifyProject(await vercel(`/v9/projects/${app.id}`), app),
        previous.get(app.id)
      )
      await vercel(`/v10/projects/${app.id}/promote/${deployment.id}`, 'POST')
      promoted = true
      // Promotion is asynchronous. The canonical project target must match before smoke.
      let current
      for (let attempt = 0; attempt < 30; attempt++) {
        current = await vercel(`/v9/projects/${app.id}`)
        if (current.targets?.production?.id === deployment.id) break
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      assert.equal(
        current.targets?.production?.id,
        deployment.id,
        'Production promotion did not settle'
      )
      await smoke(`https://${app.host}`, app)
      await status('success', `https://${app.host}`)
    } catch (error) {
      await status('failure').catch(() => {
        // Preserve the original deployment failure if GitHub reporting is unavailable.
      })
      // Recovery is deliberately explicit: external data compatibility cannot be inferred.
      throw new Error(
        `${app.id} failed ${promoted ? 'after' : 'before'} promotion. Deployment ${deployment.id}; previous ${previous.get(app.id)}. ${error.message}`
      )
    }
  }
}
