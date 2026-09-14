import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { RELEASE_APPS } from './app-release-plan.mjs'

// Verification owns build tasks and browser cases; public IDs belong to the plan.
const verification = {
  'asyra-sim': {
    task: '@asyra/asyra-sim#react:build',
    title: 'Sim'
  },
  'asyra-design': {
    task: '@asyra/asyra-design#react:build',
    title: 'Design'
  },
  'asyra-framework': {
    task: '@asyra/asyra-framework-site#build:asyra-framework-site',
    title: 'Website'
  }
}

export function runVerification(mode, input, execute = spawnSync) {
  assert.ok(['build', 'test'].includes(mode), 'Unknown verification mode')
  const apps = input ? JSON.parse(input) : RELEASE_APPS.map((app) => app.id)
  assert.ok(Array.isArray(apps) && apps.length > 0, 'Expected selected Apps')
  assert.equal(new Set(apps).size, apps.length, 'Duplicate App selection')
  for (const id of apps) {
    assert.ok(
      RELEASE_APPS.some((app) => app.id === id),
      'Unknown App selection'
    )
  }
  // Canonical order makes one Turbo graph share dependency work across Apps.
  const selected = RELEASE_APPS.filter((app) => apps.includes(app.id))
  const commands =
    mode === 'build'
      ? [
          ['yarn', ['gen:turbo:check']],
          [
            'yarn',
            [
              'turbo',
              'run',
              ...selected.map((app) => verification[app.id].task),
              '--concurrency=2'
            ]
          ],
          ...(apps.includes('asyra-design')
            ? [['yarn', ['workspace', '@asyra/asyra-design', 'typecheck']]]
            : [])
        ]
      : [
          [
            process.execPath,
            [
              '--test',
              '--test-concurrency=1',
              `--test-name-pattern=^(${selected.map((app) => verification[app.id].title).join('|')}) production `,
              'scripts/__tests__/production-artifacts.browser.test.mjs'
            ]
          ]
        ]
  for (const [command, args] of commands) {
    const result = execute(command, args, { stdio: 'inherit' })
    assert.equal(
      result.status,
      0,
      `Verification failed: ${command} ${args.join(' ')} (${result.signal || result.error?.message || result.status})`
    )
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runVerification(process.argv[2], process.env.RELEASE_APPS)
}
