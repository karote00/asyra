/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const test = require('node:test')
const vm = require('node:vm')
const { startServer, parseLocalUrl } = require('../server.cjs')
const root = path.resolve(__dirname, '../../../..')
test('URL contract rejects remote hosts and missing configuration', () => {
  for (const url of [
    undefined,
    'http://0.0.0.0:4318',
    'https://127.0.0.1:4318',
    'http://127.0.0.1:4318/other'
  ])
    assert.throws(() => parseLocalUrl(url))
})
test('HTTP preserves canvas assets and rejects unauthorized, cross-origin, and arbitrary commands before execution', async (context) => {
  const originalEvaluate = vm.runInNewContext
  let catalogLoads = 0
  vm.runInNewContext = (...args) => {
    const result = originalEvaluate(...args)
    if (args[1]?.FLOW_INSPECTOR_WORKSPACE_BUNDLE) catalogLoads++
    return result
  }
  context.after(() => {
    vm.runInNewContext = originalEvaluate
  })
  const parent = path.join(root, 'tmp/flow-inspector/server-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'store-'))
  const server = await startServer(root, {
    url: 'http://127.0.0.1:0',
    serviceOptions: { directory }
  })
  try {
    const entry = await fetch(server.origin, { redirect: 'manual' })
    assert.equal(entry.status, 200)
    assert.equal(entry.headers.get('location'), null)
    const rootPage = await entry.text()
    assert.match(rootPage, /data-workspace-routing="path"/)
    assert.match(rootPage, /<base href="\/tools\/flow-inspector\/workspace\/"/)
    for (const pathname of [
      '/transaction-atomicity',
      '/ai-drawing-performance',
      '/tools/flow-inspector/workspace/workspace.html'
    ]) {
      const response = await fetch(server.origin + pathname)
      assert.equal(response.status, 200, pathname)
      assert.equal(await response.text(), rootPage)
    }
    const trailingSlash = await fetch(
      server.origin + '/ai-drawing-performance/',
      { redirect: 'manual' }
    )
    assert.equal(trailingSlash.status, 308)
    assert.equal(
      trailingSlash.headers.get('location'),
      '/ai-drawing-performance'
    )
    for (const pathname of [
      '/missing-inspector',
      '/asyra-executable-examples'
    ]) {
      const missing = await fetch(server.origin + pathname)
      assert.equal(missing.status, 404)
      assert.match(await missing.text(), /data-workspace-routing="path"/)
    }
    for (const asset of [
      'viewer.js',
      'viewer.css',
      'workspace/target.js',
      'workspace/generated/flow-inspector-workspace.js',
      'workspace/generated/flow-inspector-workspace.css'
    ]) {
      const response = await fetch(
        server.origin + '/tools/flow-inspector/' + asset
      )
      assert.equal(response.status, 200)
      assert.equal(
        await response.text(),
        fs.readFileSync(path.join(root, 'tools/flow-inspector', asset), 'utf8')
      )
    }
    const target = await fetch(
      server.origin +
        '/tools/flow-inspector/workspace/target.html?inspector=transaction-atomicity'
    )
    assert.equal(target.status, 200)
    assert.match(await target.text(), /src="\/board.js"/)
    assert.match(
      target.headers.get('content-security-policy'),
      /frame-ancestors 'self'/
    )
    assert.match(
      target.headers.get('content-security-policy'),
      /script-src 'self'/
    )
    assert.equal(
      (await fetch(server.origin + '/api/state?inspector=x')).status,
      400
    )
    assert.equal(
      (
        await fetch(
          server.origin +
            '/tools/flow-inspector/workspace/target.html?inspector=x&inspector=y'
        )
      ).status,
      400
    )
    assert.equal(
      (
        await fetch(
          server.origin + '/tools/flow-inspector/control-plane/service.cjs'
        )
      ).status,
      404
    )
    for (const relative of [
      'docs/ai/framework/plans/completed/transaction-atomicity-and-rollback-plan.md',
      'tools/flow-inspector/inspectors/transaction-flow-inspector.data.cjs',
      'apps/asyra-design/e2e/render-delta-performance.spec.ts',
      '.github/workflows/main.yml'
    ]) {
      const linked = await fetch(server.origin + '/' + relative)
      assert.equal(linked.status, 200)
      assert.match(linked.headers.get('content-type'), /^text\/plain/)
      assert.equal(
        await linked.text(),
        fs.readFileSync(path.join(root, relative), 'utf8')
      )
    }
    for (const [name, id] of [
      ['transaction-flow-inspector', 'transaction-atomicity'],
      ['group-interaction-mvp-flow-inspector', 'group-interaction'],
      ['group-component-and-hierarchy-flow-inspector', 'group-hierarchy']
    ]) {
      const linked = await fetch(
        server.origin + '/tools/flow-inspector/inspectors/' + name + '.html',
        { redirect: 'manual' }
      )
      assert.equal(linked.status, 302, name)
      assert.equal(linked.headers.get('location'), '/' + id)
      assert.match(
        linked.headers.get('content-security-policy'),
        /frame-ancestors 'none'/
      )
    }
    for (const privatePath of [
      '/apps/asyra-design/e2e/unknown.spec.ts',
      '/tools/flow-inspector/inspectors/unknown.html'
    ]) {
      assert.equal((await fetch(server.origin + privatePath)).status, 404)
    }
    const session = await fetch(server.origin + '/api/session').then(
      (response) => response.json()
    )
    for (const endpoint of ['/api/mapping/prepare', '/api/mapping/decide']) {
      assert.equal(
        (
          await fetch(server.origin + endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}'
          })
        ).status,
        403
      )
    }
    const mapping = await fetch(server.origin + '/api/mapping/prepare', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-proof-capability': session.capability
      },
      body: '{}'
    })
    assert.equal(mapping.status, 200)
    assert.equal((await mapping.json()).status, 'unchanged')
    const post = (body, headers = {}) =>
      fetch(server.origin + '/api/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body)
      })
    assert.equal((await post({})).status, 403)
    assert.equal(
      (
        await post(
          {},
          {
            'x-proof-capability': session.capability,
            origin: 'https://untrusted.example'
          }
        )
      ).status,
      403
    )
    assert.equal(
      (
        await post(
          { command: 'anything' },
          { 'x-proof-capability': session.capability }
        )
      ).status,
      400
    )
    assert.equal(
      (
        await post(
          { scenario: 'x'.repeat(5000) },
          { 'x-proof-capability': session.capability }
        )
      ).status,
      413
    )
    const hostStatus = await new Promise((resolve, reject) => {
      http
        .get(
          server.origin + '/api/state',
          { headers: { Host: 'untrusted.example' } },
          (response) => {
            response.resume()
            resolve(response.statusCode)
          }
        )
        .on('error', reject)
    })
    assert.equal(hostStatus, 403)
    assert.equal(
      (await fetch(server.origin + '/../../package.json')).status,
      404
    )
    assert.deepEqual(server.service.state().runs, [])
    const response = await post(
      {},
      { 'x-proof-capability': session.capability, origin: server.origin }
    )
    assert.equal(response.status, 202)
    const { id } = await response.json()
    const record = await server.service.wait(id)
    assert.equal(record.evidence.status, 'passed')
    const saved = await fetch(server.origin + '/api/runs/' + id).then(
      (response) => response.json()
    )
    assert.equal(saved.snapshot.digest, record.snapshot.digest)
    for (const name of ['report', 'source-manifest']) {
      const artifact = await fetch(
        server.origin + '/api/runs/' + id + '/artifacts/' + name
      )
      assert.equal(artifact.status, 200)
      assert.match(artifact.headers.get('content-type'), /application\/json/)
      const bytes = Buffer.from(await artifact.arrayBuffer())
      const digest = require('node:crypto')
        .createHash('sha256')
        .update(bytes)
        .digest('hex')
      assert.equal(
        digest,
        name === 'report' ? record.runner.reportDigest : record.snapshot.digest
      )
    }
    assert.equal(
      (await fetch(server.origin + '/api/runs/' + id + '/artifacts/record'))
        .status,
      404
    )
    assert.equal(
      catalogLoads,
      1,
      'Repeated HTTP reads reuse the server-lifetime catalog allowlist'
    )
  } finally {
    await server.close()
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('HTTP target assessment actions retain service authority and cached results through start replay read and cancel', async (t) => {
  const { randomUUID } = require('node:crypto')
  const { LOCAL_ACTOR } = require('../service.cjs')
  const sourceOwner = require('../snapshot.cjs')
  const targetEvidenceOwner = require('../target-evidence.cjs')
  const contract = require('../contracts.cjs').loadContract(root)
  const parent = path.join(root, 'tmp/flow-inspector/server-assessment-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'run-'))
  const captured = sourceOwner.captureSource(
    root,
    path.join(directory, 'initial'),
    contract
  )
  let holdCancellation = false
  const server = await startServer(captured.sourceRoot, {
    url: 'http://127.0.0.1:0',
    serviceOptions: {
      directory: path.join(captured.sourceRoot, 'runs'),
      runner: async (options) => {
        if (holdCancellation && !options.signal.aborted)
          await new Promise((resolve) =>
            options.signal.addEventListener('abort', resolve, { once: true })
          )
        return require('../runner.cjs').runVerification(options)
      }
    }
  })
  try {
    const service = server.service
    const proof = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    const review = service.prepareEvolution(
      { attemptId: proof.id },
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: review.id,
        decision: 'accept',
        reason: 'Explicit HTTP accepted reference'
      },
      LOCAL_ACTOR
    )
    const flow = contract.flows[0]
    const target = service.decideTarget(
      {
        action: 'create',
        requestId: randomUUID(),
        expectedRevision: 0,
        reason: 'HTTP retained target',
        flowId: flow.id,
        targetRevision: contract.digest,
        targetReviewId: review.id,
        acceptedBaseline: {
          revision: service.state().mapping.revision,
          contractDigest: contract.digest
        },
        objective: 'Assess frozen source',
        works: [],
        pending: contract.cases
          .filter((item) => item.flowId === flow.id)
          .map((item) => item.id)
      },
      LOCAL_ACTOR
    )
    const request = {
      requestId: randomUUID(),
      targetId: target.id,
      allocationRevision: 1,
      sourceAttemptId: proof.id
    }
    const session = await fetch(server.origin + '/api/session').then(
      (response) => response.json()
    )
    const headers = {
      'content-type': 'application/json',
      'x-proof-capability': session.capability,
      origin: server.origin
    }
    const post = (pathname, body, extra = headers) =>
      fetch(server.origin + pathname, {
        method: 'POST',
        headers: extra,
        body: JSON.stringify(body)
      })
    assert.equal(
      (
        await post('/api/target-assessments', request, {
          'content-type': 'application/json'
        })
      ).status,
      403
    )
    assert.equal(
      (
        await post('/api/target-assessments', request, {
          ...headers,
          origin: 'http://foreign.invalid'
        })
      ).status,
      403
    )
    assert.equal(
      (
        await post('/api/target-assessments', {
          ...request,
          evidence: 'passed'
        })
      ).status,
      400
    )
    assert.equal(
      (
        await post('/api/target-assessments', {
          ...request,
          extra: 'x'.repeat(5000)
        })
      ).status,
      413
    )
    assert.equal(service.targetAssessments().length, 0)
    const started = await post('/api/target-assessments', request)
    assert.equal(started.status, 202)
    const { id } = await started.json()
    const completed = await service.waitTargetAssessment(id)
    assert.equal(completed.result.accepted.status, 'passed')
    assert.equal(completed.result.integration.status, 'pending')
    const reads = t.mock.method(fs, 'readFileSync')
    const assess = t.mock.method(targetEvidenceOwner, 'assessTargetSource')
    const project = t.mock.method(
      targetEvidenceOwner,
      'projectTargetAssessmentCurrentness'
    )
    for (let i = 0; i < 3; i++) {
      const detail = await fetch(
        server.origin + '/api/target-assessments/' + id
      )
      assert.equal(detail.status, 200)
      assert.deepEqual(await detail.json(), completed)
      const list = await fetch(server.origin + '/api/target-assessments').then(
        (response) => response.json()
      )
      assert.deepEqual(list, [completed])
      assert.deepEqual(
        await post('/api/target-assessments', request).then((response) =>
          response.json()
        ),
        { id }
      )
    }
    assert.equal(reads.mock.callCount(), 0)
    assert.equal(assess.mock.callCount(), 0)
    assert.equal(project.mock.callCount(), 0)
    reads.mock.restore()
    assess.mock.restore()
    project.mock.restore()
    assert.equal(
      (
        await post('/api/target-assessments', {
          ...request,
          allocationRevision: 2
        })
      ).status,
      409
    )
    assert.equal(
      (await fetch(server.origin + '/api/target-assessments/' + randomUUID()))
        .status,
      404
    )
    assert.equal(
      (await fetch(server.origin + '/api/target-assessments/not-a-uuid'))
        .status,
      404
    )
    assert.equal((await post('/api/target-proofs', request)).status, 404)
    assert.equal(
      (
        await post('/api/target-assessments/' + id + '/cancel', {
          actor: 'replacement'
        })
      ).status,
      400
    )
    assert.equal(
      (await post('/api/target-assessments/' + id + '/cancel', {})).status,
      409
    )
    assert.equal(
      (await post('/api/target-assessments/' + randomUUID() + '/cancel', {}))
        .status,
      409
    )
    holdCancellation = true
    const second = await post('/api/target-assessments', {
      ...request,
      requestId: randomUUID()
    }).then((response) => response.json())
    const cancelled = await post(
      '/api/target-assessments/' + second.id + '/cancel',
      {}
    )
    assert.equal(cancelled.status, 200)
    assert.equal((await cancelled.json()).phase, 'cancelled')
  } finally {
    await server.close()
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
