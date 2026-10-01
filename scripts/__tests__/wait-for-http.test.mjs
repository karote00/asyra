import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const readinessScript = path.join(repositoryRoot, 'scripts/wait-for-http.mjs')

function runWaiter(url, method, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [readinessScript, url, method, String(timeoutMs)],
      { cwd: repositoryRoot, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => (stdout += chunk))
    child.stderr.setEncoding('utf8').on('data', (chunk) => (stderr += chunk))
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, stdout, stderr }))
  })
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return `http://127.0.0.1:${server.address().port}/health`
}

test('HTTP readiness retries non-2xx responses and follows redirects', async () => {
  let requests = 0
  const server = createServer((request, response) => {
    requests += 1
    if (request.url === '/health' && requests === 1) {
      response.writeHead(503).end()
      return
    }
    if (request.url === '/health') {
      response.writeHead(302, { location: '/ready' }).end()
      return
    }
    response.writeHead(204).end()
  })
  const url = await listen(server)

  try {
    const result = await runWaiter(url, 'GET', 3000)
    assert.equal(result.code, 0, result.stderr)
    assert.ok(
      requests >= 3,
      `expected retries and redirect, received ${requests}`
    )
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
})

test('HTTP readiness times out when the endpoint never returns 2xx', async () => {
  const server = createServer((_request, response) =>
    response.writeHead(503).end()
  )
  const url = await listen(server)

  try {
    const result = await runWaiter(url, 'GET', 350)
    assert.notEqual(result.code, 0)
    assert.match(result.stderr, /Timed out.*waiting for HTTP 2xx/u)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
})
