import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import test from 'node:test'
import { URL } from 'node:url'

import { loadEnvironment, resolveEnvironment } from '../app-environment.mjs'

test('one app URL configures a non-default Vite and Playwright port', () => {
  assert.deepEqual(
    resolveEnvironment({
      APP_URL: 'http://localhost:4317',
      COLLABORATION_WS_HOST: '127.0.0.1',
      COLLABORATION_WS_PORT: '5109'
    }),
    {
      appURL: 'http://localhost:4317',
      viteHost: 'localhost',
      vitePort: 4317,
      collaborationWebSocketHost: '127.0.0.1',
      collaborationWebSocketPort: 5109,
      collaborationHealthURL: 'http://127.0.0.1:5109/health'
    }
  )
})

test('a deployed HTTPS origin remains the single app URL', () => {
  const config = resolveEnvironment({
    APP_URL: 'https://design.example.com'
  })

  assert.equal(config.appURL, 'https://design.example.com')
  assert.equal(config.viteHost, 'design.example.com')
  assert.equal(config.vitePort, 443)
})

test('missing project environment uses safe development defaults without a browser socket override', () => {
  const environment = {}

  loadEnvironment(
    environment,
    new URL('./fixtures/missing-project/.env', import.meta.url)
  )

  assert.equal(environment.APP_URL, undefined)
  assert.equal(environment.VITE_COLLABORATION_WS_URL, undefined)
  assert.deepEqual(resolveEnvironment(environment), {
    appURL: 'http://localhost:3000',
    viteHost: 'localhost',
    vitePort: 3000,
    collaborationWebSocketHost: '127.0.0.1',
    collaborationWebSocketPort: 4101,
    collaborationHealthURL: 'http://127.0.0.1:4101/health'
  })
})

test('legacy parallel base URL variables do not replace the app URL owner', () => {
  const config = resolveEnvironment({
    VISUAL_REVIEW_BASE_URL: 'http://localhost:4555',
    PLAYWRIGHT_TEST_BASE_URL: 'http://localhost:4666'
  })

  assert.equal(config.appURL, 'http://localhost:3000')
  assert.equal(config.vitePort, 3000)
})

test('invalid app URL and collaboration port fail before startup', () => {
  assert.throws(
    () =>
      resolveEnvironment({
        APP_URL: 'ftp://design.example.com'
      }),
    /http or https/
  )
  assert.throws(
    () =>
      resolveEnvironment({
        APP_URL: 'http://localhost:3000',
        COLLABORATION_WS_PORT: '70000'
      }),
    /COLLABORATION_WS_PORT/
  )
})

test('document backend startup commands load the local environment file', (t) => {
  const directory = mkdtempSync(
    fileURLToPath(new URL('./startup-environment-', import.meta.url))
  )
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  writeFileSync(`${directory}/.env`, 'DOCUMENT_BACKEND_PORT=43219\n')
  const manifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  )
  for (const name of ['document:backend', 'document:backend:start']) {
    const command = manifest.scripts[name].split(' && ').at(-1).split(' ')
    assert.equal(command.shift(), 'node')
    command.pop()
    const environment = { ...process.env }
    delete environment.DOCUMENT_BACKEND_PORT
    const output = execFileSync(
      process.execPath,
      [...command, '-p', 'process.env.DOCUMENT_BACKEND_PORT'],
      {
        cwd: directory,
        env: environment,
        encoding: 'utf8'
      }
    )
    assert.equal(output.trim(), '43219')
  }
})
