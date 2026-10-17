/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { document, directory } = require('./fixtures.cjs')
const { startFlowServer } = require('../server.cjs')
test('offline authored files refresh through one shared read API; invalid, new and deleted files never retain stale success', async (t) => {
  const dir = directory(t),
    file = path.join(dir, 'checkout.flow.json')
  fs.writeFileSync(file, JSON.stringify(document()))
  const server = await startFlowServer(dir, {
    directory: dir,
    url: 'http://127.0.0.1:0'
  })
  t.after(() => server.close())
  const read = async (suffix) => (await fetch(server.origin + suffix)).json()
  const context = await read('/api/context?flow=checkout&node=review')
  assert.equal(context.nodeId, 'review')
  assert.equal(context.failureOwner, 'review')
  const request = {
    flowId: 'checkout',
    request: {
      expectedRevision: 0,
      kind: 'note',
      value: {
        id: 'note',
        nodeId: 'review',
        actor: 'owner',
        text: 'Keep current'
      }
    }
  }
  const denied = await fetch(server.origin + '/api/update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  })
  assert.equal(denied.status, 403)
  const session = await read('/api/session')
  const changed = await fetch(server.origin + '/api/update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-flow-capability': session.capability
    },
    body: JSON.stringify(request)
  })
  assert.equal(changed.status, 200)
  assert.equal(
    (await read('/api/evidence?flow=checkout&node=review')).notes.length,
    1
  )
  fs.writeFileSync(file, '{')
  assert.equal((await fetch(server.origin + '/api/flows')).status, 409)
  const replacement = file + '.replace'
  fs.writeFileSync(replacement, JSON.stringify(document()))
  fs.renameSync(replacement, file)
  assert.equal(
    (await read('/api/flows')).evaluation.flows[0].status,
    'awaiting-manual'
  )
  const other = document()
  other.flowId = 'other'
  fs.writeFileSync(path.join(dir, 'other.flow.json'), JSON.stringify(other))
  assert.equal((await read('/api/flows')).evaluation.flows.length, 2)
  fs.unlinkSync(path.join(dir, 'other.flow.json'))
  fs.unlinkSync(file)
  assert.equal((await fetch(server.origin + '/api/flows')).status, 409)
})

test('fragmented UTF-8 manual notes preserve the authored text', async (t) => {
  const http = require('node:http'),
    dir = directory(t)
  fs.writeFileSync(
    path.join(dir, 'checkout.flow.json'),
    JSON.stringify(document())
  )
  const server = await startFlowServer(dir, {
    directory: dir,
    url: 'http://127.0.0.1:0'
  })
  t.after(() => server.close())
  const { capability } = await (
    await fetch(server.origin + '/api/session')
  ).json()
  const text = '人工驗收',
    bytes = Buffer.from(
      JSON.stringify({
        flowId: 'checkout',
        request: {
          kind: 'note',
          expectedRevision: 0,
          value: { id: 'note', nodeId: 'review', actor: 'owner', text }
        }
      })
    )
  const offset = bytes.indexOf(Buffer.from(text)) + 1
  const status = await new Promise((resolve, reject) => {
    const request = http.request(
      server.origin + '/api/update',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-flow-capability': capability
        }
      },
      (response) => {
        response.resume()
        response.on('end', () => resolve(response.statusCode))
      }
    )
    request.on('error', reject)
    request.write(bytes.subarray(0, offset))
    setTimeout(() => request.end(bytes.subarray(offset)), 20)
  })
  assert.equal(status, 200)
  assert.equal(
    server.service.snapshot().documents[0].current.notes[0].text,
    text
  )
})
