/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { createService, LOCAL_ACTOR } = require('../service.cjs')
const { loadContract, MANIFEST_PATH } = require('../contracts.cjs')
const { captureSource } = require('../snapshot.cjs')
const { runVerification } = require('../runner.cjs')
const root = path.resolve(__dirname, '../../../..')

function fixture(t) {
  const parent = path.join(root, 'tmp/flow-inspector/mapping-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'repo-'))
  const snapshot = captureSource(root, directory, loadContract(root))
  const repository = snapshot.sourceRoot
  const manifestPath = path.join(repository, MANIFEST_PATH)
  fs.chmodSync(manifestPath, 0o644)
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return {
    repository,
    directory: path.join(repository, 'runs'),
    manifestPath,
    edit(change) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      change(manifest)
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    }
  }
}

test(
  'mapping changes require an exact authorized decision, survive restart, and invalidate prior evidence',
  { timeout: 15000 },
  async (t) => {
    const f = fixture(t)
    let service = createService(f.repository, { directory: f.directory })
    try {
      const baseline = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.equal(baseline.evidence.status, 'passed')
      f.edit((manifest) => {
        manifest.flows[0].cases[0].testName =
          'Factory flow proof deferred captured snapshot'
      })
      assert.throws(() => service.start({}, LOCAL_ACTOR), /mapping.*review/i)
      const denied = { id: 'viewer', capabilities: [] }
      assert.throws(() => service.prepareMapping({}, denied), /authorized/)
      const review = service.prepareMapping({}, LOCAL_ACTOR)
      assert.equal(review.changes.length, 1)
      assert.equal(review.changes[0].caseId, 'deferred.snapshot')
      assert.throws(
        () =>
          service.decideMapping(
            { id: review.id, decision: 'accept', reason: 'Renamed assertion' },
            denied
          ),
        /authorized/
      )
      const bytes = fs.readFileSync(f.manifestPath, 'utf8')
      const request = {
        id: review.id,
        decision: 'accept',
        reason: 'Renamed assertion'
      }
      service.decideMapping(request, LOCAL_ACTOR)
      assert.equal(service.get(baseline.id).matchesCurrentContract, false)
      assert.equal(service.state().mapping.revision, 2)
      service.decideMapping(request, LOCAL_ACTOR)
      assert.equal(service.state().mapping.revision, 2)
      assert.equal(fs.readFileSync(f.manifestPath, 'utf8'), bytes)
      await service.close()
      service = createService(f.repository, { directory: f.directory })
      assert.equal(service.state().mapping.revision, 2)
      assert.equal(service.get(baseline.id).matchesCurrentContract, false)
      const absent = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.notEqual(absent.evidence.status, 'passed')
      const testFile = path.join(f.repository, service.contract().testFile)
      fs.chmodSync(testFile, 0o644)
      fs.writeFileSync(
        testFile,
        fs
          .readFileSync(testFile, 'utf8')
          .replace("it('snapshot',", "it('captured snapshot',")
      )
      const corrected = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.equal(
        corrected.evidence.status,
        'passed',
        JSON.stringify(corrected.evidence)
      )
      assert.notEqual(corrected.snapshot.digest, baseline.snapshot.digest)
      assert.equal(service.get(baseline.id).evidence.status, 'passed')
    } finally {
      await service.close()
    }
  }
)

test('stale, conflicting, rejected, or obligation-changing candidates cannot silently change accepted mapping', async (t) => {
  const f = fixture(t)
  let service = createService(f.repository, { directory: f.directory })
  try {
    const original = fs.readFileSync(f.manifestPath, 'utf8')
    f.edit((manifest) => {
      manifest.flows[0].cases[0].testName += ' revised'
    })
    const first = service.prepareMapping({}, LOCAL_ACTOR)
    f.edit((manifest) => {
      manifest.flows[0].cases[0].testName += ' again'
    })
    assert.throws(
      () =>
        service.decideMapping(
          { id: first.id, decision: 'accept', reason: 'stale' },
          LOCAL_ACTOR
        ),
      /changed|stale/
    )
    service.decideMapping(
      { id: first.id, decision: 'reject', reason: 'Keep original mapping' },
      LOCAL_ACTOR
    )
    assert.equal(service.state().mapping.revision, 1)
    assert.throws(
      () =>
        service.decideMapping(
          { id: first.id, decision: 'accept', reason: 'overwrite decision' },
          LOCAL_ACTOR
        ),
      /decided/
    )
    assert.throws(() => service.start({}, LOCAL_ACTOR), /mapping.*review/i)
    await service.close()
    service = createService(f.repository, { directory: f.directory })
    assert.equal(service.state().mapping.reviews[0].status, 'rejected')
    assert.equal(service.state().mapping.revision, 1)
    fs.writeFileSync(f.manifestPath, original)
    f.edit((manifest) => {
      manifest.flows[0].goal = 'Weakened goal'
    })
    assert.throws(
      () => service.prepareMapping({}, LOCAL_ACTOR),
      /only test-name/
    )
    assert.equal(service.state().mapping.revision, 1)
  } finally {
    await service.close()
  }
})

test(
  'in-flight checkout edits do not alter captured evidence and the next snapshot observes the regression',
  { timeout: 10000 },
  async (t) => {
    const f = fixture(t)
    let changed = false
    const service = createService(f.repository, {
      directory: f.directory,
      runner: async (input) => {
        if (!changed) {
          changed = true
          const mutation = service
            .contract()
            .definition.scenarios.find(
              (item) => item.id === service.contract().defaultNegativeScenario
            ).mutation
          const file = path.join(f.repository, mutation.file)
          fs.chmodSync(file, 0o644)
          fs.writeFileSync(
            file,
            fs.readFileSync(file, 'utf8').replace(mutation.from, mutation.to)
          )
        }
        return runVerification(input)
      }
    })
    try {
      const id = service.start({}, LOCAL_ACTOR)
      assert.throws(
        () => service.prepareMapping({}, LOCAL_ACTOR),
        /already running/
      )
      const captured = await service.wait(id)
      assert.equal(captured.evidence.status, 'passed')
      const next = await service.wait(service.start({}, LOCAL_ACTOR))
      assert.equal(next.evidence.status, 'failed')
      assert.notEqual(next.snapshot.digest, captured.snapshot.digest)
      assert.equal(service.get(id).evidence.status, 'passed')
    } finally {
      await service.close()
    }
  }
)
