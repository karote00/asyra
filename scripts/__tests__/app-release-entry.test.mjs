/* global URL */
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import test from 'node:test'

const cwd = new URL('../../', import.meta.url)
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd,
  encoding: 'utf8'
}).trim()
const env = {
  ...process.env,
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_REPOSITORY_ID: '893098287',
  GITHUB_REPOSITORY: 'owner/repo',
  GITHUB_SHA: sha,
  GITHUB_RUN_ID: '123',
  GH_TOKEN: 'test',
  VERCEL_TOKEN: 'test',
  VERCEL_TEAM_ID: 'team_test',
  RELEASE_PLAN: '{}'
}
for (const [name, change, command, expected] of [
  ['unknown command', {}, 'unknown', 'Unknown release command'],
  ['missing team', { VERCEL_TEAM_ID: '' }, 'publish', 'Missing VERCEL_TEAM_ID'],
  ['missing token', { VERCEL_TOKEN: '' }, 'publish', 'Missing VERCEL_TOKEN'],
  ['missing plan', { RELEASE_PLAN: '' }, 'publish', 'Missing RELEASE_PLAN'],
  ['malformed plan', { RELEASE_PLAN: '{' }, 'publish', 'JSON'],
  [
    'missing run ID',
    { GITHUB_RUN_ID: '' },
    'publish',
    'Missing or invalid GITHUB_RUN_ID'
  ],
  [
    'missing repository',
    { GITHUB_REPOSITORY: '' },
    'publish',
    'Missing or invalid GITHUB_REPOSITORY'
  ],
  [
    'non-main',
    { GITHUB_REF: 'refs/heads/other' },
    'publish',
    'must run on main'
  ],
  ['wrong event', { GITHUB_EVENT_NAME: 'push' }, 'publish', 'manual only'],
  ['fork', { GITHUB_REPOSITORY_ID: '1' }, 'publish', 'upstream repository']
]) {
  test(`${name} fails before provider requests`, () => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      process.argv[2] = ${JSON.stringify(command)};
      globalThis.fetch = async () => { throw new Error('UNEXPECTED_NETWORK'); };
      await import('./scripts/app-release.mjs');
    `
      ],
      { cwd, env: { ...env, ...change }, encoding: 'utf8' }
    )
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, new RegExp(expected))
    assert.doesNotMatch(result.stderr, /UNEXPECTED_NETWORK/)
  })
}
