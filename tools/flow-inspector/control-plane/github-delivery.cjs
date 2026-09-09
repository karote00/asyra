/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const { execFile, execFileSync } = require('node:child_process')
const { safePath, sha256 } = require('./snapshot.cjs')
const { canonicalFile } = require('./agent-contract.cjs')
const hex = (value) => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const need = (value, message) => {
  if (!value) throw new Error('GitHub delivery: ' + message)
}
function transportError(error) {
  const raw = String(error.stderr ?? '')
  let code = 'transport-unknown',
    noEffect = false
  if (/HTTP 401\b/.test(raw)) {
    code = 'authentication'
    noEffect = true
  } else if (
    /HTTP (403|429)\b/.test(raw) &&
    /rate.?limit|HTTP 429/i.test(raw)
  ) {
    code = 'rate-limit'
    noEffect = true
  } else if (/HTTP 403\b/.test(raw)) {
    code = 'permission'
    noEffect = true
  } else if (/HTTP (409|422)\b/.test(raw)) {
    code = 'conflict'
    noEffect = true
  }
  return Object.assign(new Error('GitHub delivery: ' + code), {
    code,
    noEffect
  })
}
function ghRequest(root, method, route, body) {
  return new Promise((resolve, reject) => {
    const args = [
      'api',
      '--hostname',
      'github.com',
      '--method',
      method,
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      route
    ]
    if (body !== undefined) args.push('--input', '-')
    const child = execFile(
      'gh',
      args,
      {
        cwd: root,
        timeout: 15000,
        maxBuffer: 8 * 1024 * 1024,
        encoding: 'utf8',
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          GH_PROMPT_DISABLED: '1',
          GH_NO_UPDATE_NOTIFIER: '1',
          GH_PAGER: 'cat',
          NO_COLOR: '1'
        }
      },
      (error, stdout, stderr) => {
        if (error) {
          if (method === 'GET' && /HTTP 404\b/.test(stderr))
            return resolve(null)
          return reject(transportError({ stderr }))
        }
        try {
          resolve(JSON.parse(stdout))
        } catch {
          reject(transportError({}))
        }
      }
    )
    child.stdin.on('error', () => undefined)
    child.stdin.end(body === undefined ? undefined : JSON.stringify(body))
  })
}
function createGitHubDelivery(
  root,
  {
    repository,
    base = 'main',
    request = (...args) => ghRequest(root, ...args),
    local
  } = {}
) {
  need(
    typeof repository === 'string' &&
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository),
    'invalid repository'
  )
  need(
    typeof base === 'string' &&
      /^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(base) &&
      !base.includes('//'),
    'invalid base branch'
  )
  const prefix = 'repos/' + repository + '/'
  const api = (method, route, body) => request(method, prefix + route, body)
  const checkLocal =
    local ??
    ((input) => {
      let dirty
      try {
        dirty = execFileSync(
          'git',
          ['status', '--porcelain', '--untracked-files=normal'],
          {
            cwd: root,
            encoding: 'utf8',
            timeout: 5000,
            maxBuffer: 1024 * 1024,
            stdio: ['ignore', 'pipe', 'pipe']
          }
        )
      } catch {
        throw new Error('GitHub delivery: local Git unavailable')
      }
      need(
        !dirty.trim(),
        'dirty worktree; commit or preserve changes before delivery'
      )
      for (const file of input.files) {
        const absolute = safePath(root, file.path)
        need(
          fs.lstatSync(absolute).isFile() &&
            sha256(fs.readFileSync(absolute)) === file.digest,
          'local source differs from captured baseline'
        )
      }
    })
  const readBase = async () => {
    const ref = await api('GET', 'git/ref/heads/' + base)
    need(hex(ref?.object?.sha), 'base unavailable')
    return ref.object.sha
  }
  const validatePreview = (p) => {
    need(
      p.repository === repository &&
        p.base === base &&
        hex(p.baseSha) &&
        hex(p.baseTree),
      'preview policy mismatch'
    )
    need(
      p.branch === 'codex/flow-review/' + p.taskId + '/' + p.attemptId &&
        /^codex\/flow-review\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(p.branch),
      'invalid candidate branch'
    )
    need(
      Array.isArray(p.changes) &&
        p.changes.length > 0 &&
        p.changes.length <= 10,
      'invalid changes'
    )
    for (const c of p.changes)
      need(
        canonicalFile(c.path) &&
          /^packages\/factory\/src\/.+\.ts$/.test(c.path) &&
          !c.path.includes('/__tests__/') &&
          sha256(c.after) === c.afterDigest,
        'invalid source difference'
      )
  }
  function project(pr, p, expectedHead) {
    need(
      Number.isSafeInteger(pr?.number) && pr.number > 0 && hex(pr.head?.sha),
      'invalid PR observation'
    )
    need(
      pr.head.repo?.full_name?.toLowerCase() === repository.toLowerCase() &&
        pr.base.repo?.full_name?.toLowerCase() === repository.toLowerCase() &&
        pr.head.ref === p.branch,
      'PR repository or branch mismatch'
    )
    need(['open', 'closed'].includes(pr.state), 'unknown PR state')
    return {
      number: pr.number,
      url: 'https://github.com/' + repository + '/pull/' + pr.number,
      state: pr.merged ? 'merged' : pr.state,
      draft: pr.draft === true,
      headSha: pr.head.sha,
      base: pr.base.ref,
      matchesCandidate: pr.head.sha === expectedHead && pr.base.ref === base,
      observedAt: new Date().toISOString(),
      checks: null,
      stale: false
    }
  }
  async function findPR(p, record) {
    if (record.observation?.number)
      return api('GET', 'pulls/' + record.observation.number)
    const list = await api(
      'GET',
      'pulls?state=all&head=' +
        encodeURIComponent(repository.split('/')[0] + ':' + p.branch) +
        '&per_page=100'
    )
    need(Array.isArray(list) && list.length < 100, 'PR query incomplete')
    const matches = list.filter(
      (pr) =>
        pr.head?.ref === p.branch &&
        pr.head?.sha === record.expectedHead &&
        pr.base?.ref === base
    )
    need(matches.length <= 1, 'ambiguous PR identity')
    if (!matches.length) return null
    // List responses do not reliably include the merged boolean.
    return api('GET', 'pulls/' + matches[0].number)
  }
  return {
    repository,
    base,
    async inspect(input) {
      checkLocal(input)
      const baseSha = await readBase(),
        commit = await api('GET', 'git/commits/' + baseSha)
      need(hex(commit?.tree?.sha), 'base tree unavailable')
      const baseTree = commit.tree.sha,
        contents = await api('GET', 'git/trees/' + baseTree + '?recursive=1')
      need(
        contents &&
          contents.truncated === false &&
          Array.isArray(contents.tree),
        'base tree incomplete'
      )
      const entries = new Map(contents.tree.map((item) => [item.path, item]))
      for (const file of input.files) {
        const entry = entries.get(file.path)
        need(
          entry?.type === 'blob' &&
            entry.mode === '100644' &&
            entry.sha === file.gitDigest,
          'base source differs from captured baseline'
        )
      }
      return { baseSha, baseTree }
    },
    async deliver(p, checkpoint, record) {
      validatePreview(p)
      need((await readBase()) === p.baseSha, 'base advanced before effects')
      let expectedHead = record.expectedHead
      const existing = await api('GET', 'git/ref/heads/' + p.branch)
      if (existing) {
        need(
          expectedHead && existing.object?.sha === expectedHead,
          'candidate branch conflict'
        )
      } else {
        if (!expectedHead) {
          await checkpoint('create-tree')
          const tree = await api('POST', 'git/trees', {
            base_tree: p.baseTree,
            tree: p.changes.map((c) => ({
              path: c.path,
              mode: '100644',
              type: 'blob',
              content: c.after
            }))
          })
          need(hex(tree?.sha), 'missing created tree')
          await checkpoint('create-commit')
          const commit = await api('POST', 'git/commits', {
            message: p.title,
            tree: tree.sha,
            parents: [p.baseSha]
          })
          need(hex(commit?.sha), 'missing created commit')
          expectedHead = commit.sha
        }
        await checkpoint('create-branch', { expectedHead })
        await api('POST', 'git/refs', {
          ref: 'refs/heads/' + p.branch,
          sha: expectedHead
        })
      }
      await checkpoint('create-pr', { expectedHead })
      const pr = await api('POST', 'pulls', {
        title: p.title,
        body: p.body,
        head: p.branch,
        base,
        draft: true,
        maintainer_can_modify: false
      })
      return project(pr, p, expectedHead)
    },
    async observe(p, record) {
      validatePreview(p)
      const pr = await findPR(p, record)
      if (!pr) return null
      let result = project(pr, p, record.expectedHead)
      try {
        const [runs, statuses] = await Promise.all([
          api('GET', 'commits/' + result.headSha + '/check-runs?per_page=100'),
          api('GET', 'commits/' + result.headSha + '/status?per_page=100')
        ])
        need(
          runs &&
            Array.isArray(runs.check_runs) &&
            runs.total_count === runs.check_runs.length &&
            statuses &&
            Array.isArray(statuses.statuses) &&
            statuses.total_count === statuses.statuses.length,
          'checks incomplete'
        )
        need(
          runs.check_runs.every((run) => run.head_sha === result.headSha),
          'check HEAD mismatch'
        )
        const items = [
          ...runs.check_runs.map((run) => ({
            name: String(run.name).slice(0, 200),
            status: run.status,
            conclusion: run.conclusion
          })),
          ...statuses.statuses.map((status) => ({
            name: String(status.context).slice(0, 200),
            status: 'completed',
            conclusion: status.state
          }))
        ]
        let status = 'unknown'
        if (
          items.length &&
          items.every(
            (item) =>
              item.status === 'completed' && item.conclusion === 'success'
          )
        )
          status = 'passed'
        else if (
          items.some((item) =>
            [
              'failure',
              'error',
              'cancelled',
              'timed_out',
              'action_required'
            ].includes(item.conclusion)
          )
        )
          status = 'failed'
        else if (
          items.some(
            (item) =>
              item.status !== 'completed' || item.conclusion === 'pending'
          )
        )
          status = 'pending'
        const latest = await api('GET', 'pulls/' + result.number)
        if (latest.head?.sha !== result.headSha) {
          result = project(latest, p, record.expectedHead)
          result.stale = true
          return result
        }
        return { ...result, checks: { headSha: result.headSha, status, items } }
      } catch {
        return { ...result, checks: null, stale: true }
      }
    }
  }
}
module.exports = { createGitHubDelivery, transportError }
