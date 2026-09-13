/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const test = require('node:test')
const { admitContract, mappingDiff } = require('../contracts.cjs')
const manifest = require('../../../../packages/factory/flow-contracts.json')
const architecture = require('../../inspectors/transaction-flow-inspector.data.cjs')

const admit = (change) => {
  const input = structuredClone({ manifest, architecture })
  change?.(input)
  return admitContract(input.manifest, input.architecture)
}

test('runtime authority retains each selected architecture step once without changing contract identity', () => {
  const input = structuredClone({ manifest, architecture })
  const contract = admitContract(input.manifest, input.architecture)
  const selected = new Set(manifest.flows.flatMap((flow) => flow.stepIds))
  const entries = architecture.steps
    .filter((step) => selected.has(step.id))
    .map((step) => ({
      stepId: step.id,
      ownerPackage: step.ownerPackage,
      implementationBoundary: [...step.implementationBoundary]
    }))
  const hash = (value) =>
    createHash('sha256').update(JSON.stringify(value)).digest('hex')
  assert.deepEqual(contract.runtimeScope, {
    format: 1,
    steps: entries,
    digest: hash({ format: 1, steps: entries })
  })
  assert.equal(contract.digest, hash({ manifest, architecture }))
  assert.equal(contract.version, 2)
  assert.ok(
    Object.isFrozen(contract.runtimeScope.steps[0].implementationBoundary)
  )
  input.architecture.steps
    .find((step) => selected.has(step.id))
    .implementationBoundary.push('caller-authored-path')
  assert.deepEqual(contract.runtimeScope.steps, entries)
})

test('runtime authority follows architecture order and binds every selected owner boundary', () => {
  const original = admit()
  const reordered = admit(({ architecture }) => architecture.steps.reverse())
  assert.deepEqual(
    reordered.runtimeScope.steps.map((step) => step.stepId),
    original.runtimeScope.steps.map((step) => step.stepId).reverse()
  )
  const changed = admit(({ architecture }) => {
    architecture.steps
      .find((step) => step.id === manifest.flows[0].stepIds[0])
      .implementationBoundary.push('packages/factory/src/new-owner.ts')
  })
  assert.notEqual(changed.runtimeScope.digest, original.runtimeScope.digest)
  assert.notEqual(reordered.runtimeScope.digest, original.runtimeScope.digest)
})

test('mapping review prepares exact test-name changes while preserving every obligation and its owner', () => {
  const accepted = admit()
  const candidate = admit(({ manifest }) => {
    manifest.flows[0].cases[0].testName = 'Renamed snapshot assertion'
  })
  assert.deepEqual(mappingDiff(accepted, candidate), [
    {
      caseId: 'deferred.snapshot',
      flowId: 'deferred-publication',
      stepId: 'record-reversible-journal',
      before: 'Factory flow proof deferred snapshot',
      after: 'Renamed snapshot assertion'
    }
  ])
  assert.deepEqual(mappingDiff(accepted, accepted), [])
  assert.throws(
    () =>
      mappingDiff(
        accepted,
        admit(({ manifest }) => {
          manifest.flows[0].goal = 'A different goal'
        })
      ),
    /only test-name/
  )
  assert.throws(
    () =>
      mappingDiff(
        accepted,
        admit(({ architecture }) => {
          architecture.steps[1].purpose += ' changed'
        })
      ),
    /architecture/
  )
})

test('resolves two real flows and six obligations using architecture-owned steps', () => {
  const contract = admit()
  assert.equal(contract.flows.length, 2)
  assert.equal(contract.cases.length, 6)
  assert.equal(contract.flows[0].steps[0].ownerPackage, '@asyra/factory')
  assert.equal(contract.flows[0].steps[0].title, architecture.steps[1].title)
  assert.equal(
    contract.flows[1].handoffs.find(
      (route) => route.id === 'validation-to-finalize'
    ).decision,
    'bypassed'
  )
  assert.match(contract.mappingVersion, /^[a-f0-9]{64}$/)
  assert.match(contract.architectureVersion, /^[a-f0-9]{64}$/)
  assert.ok(Object.isFrozen(contract.flows[0].steps[0]))
})

for (const [name, corrupt, message] of [
  [
    'a route from the wrong producer',
    ({ architecture }) => {
      architecture.routes.find((r) => r.id === 'journal-to-finalize').from =
        'decide-feature-outcome'
    },
    /route producer/
  ],
  [
    'a route to an undeclared consumer',
    ({ architecture }) => {
      architecture.routes.find((r) => r.id === 'journal-to-finalize').to =
        'coordinate-transaction-boundary'
    },
    /route consumer/
  ],
  [
    'an artifact absent from its producer output',
    ({ architecture }) => {
      architecture.steps.find(
        (s) => s.id === 'record-reversible-journal'
      ).outputs = ['different output']
    },
    /producer output/
  ],
  [
    'duplicate routes',
    ({ architecture }) => {
      architecture.routes.push(structuredClone(architecture.routes[0]))
    },
    /route ids/
  ],
  [
    'an empty predicate',
    ({ architecture }) => {
      architecture.routes[0].predicate = ''
    },
    /route predicate/
  ],
  [
    'a missing conditional handoff',
    ({ manifest }) => {
      manifest.flows[0].handoffs.pop()
    },
    /incoming handoff/
  ],
  [
    'an unresolved decision',
    ({ manifest }) => {
      manifest.flows[0].handoffs[0].decision = 'unknown'
    },
    /handoff decision/
  ],
  [
    'a bypass with no reason',
    ({ manifest }) => {
      delete manifest.flows[1].handoffs[3].reason
    },
    /bypass reason/
  ],
  [
    'a handoff proved by a different flow',
    ({ manifest }) => {
      manifest.flows[0].handoffs[0].caseIds = ['cancel.snapshot']
    },
    /handoff evidence/
  ],
  [
    'duplicate handoff declarations',
    ({ manifest }) => {
      manifest.flows[0].handoffs.push(
        structuredClone(manifest.flows[0].handoffs[0])
      )
    },
    /handoff ids/
  ],
  [
    'a negative scenario with unknown obligations',
    ({ manifest }) => {
      manifest.scenarios[1].expectedFailedCaseIds = ['unknown']
    },
    /scenario obligations/
  ],
  [
    'a mutation of the assertions',
    ({ manifest }) => {
      manifest.scenarios[1].mutation.file = manifest.testFile
    },
    /runtime mutation/
  ]
]) {
  test('preflight rejects ' + name, () =>
    assert.throws(() => admit(corrupt), message)
  )
}

for (const [name, corrupt] of [
  [
    'unknown step',
    ({ manifest }) => {
      manifest.flows[0].cases[0].stepId = 'unknown'
    }
  ],
  [
    'empty requirements',
    ({ manifest }) => {
      manifest.flows[0].cases = []
    }
  ],
  [
    'duplicate case',
    ({ manifest }) => {
      manifest.flows[1].cases[0].id = manifest.flows[0].cases[0].id
    }
  ],
  [
    'missing case mapping',
    ({ manifest }) => {
      manifest.flows[0].cases[0].testName = ''
    }
  ],
  [
    'wrong owner',
    ({ architecture }) => {
      architecture.steps[1].ownerPackage = ''
    }
  ],
  [
    'missing producer',
    ({ architecture }) => {
      architecture.artifacts = architecture.artifacts.filter(
        (a) => a.id !== 'artifact:active-transaction-journal'
      )
    }
  ],
  [
    'broken route',
    ({ architecture }) => {
      architecture.routes[0].to = 'unknown'
    }
  ],
  [
    'undeclared external input',
    ({ manifest }) => {
      manifest.externalInputs = []
    }
  ],
  [
    'unsupported version',
    ({ manifest }) => {
      manifest.version = 99
    }
  ]
]) {
  test('rejects ' + name + ' before running a test', () =>
    assert.throws(() => admit(corrupt))
  )
}

test('accepted contracts retain detached architecture for immutable version reconstruction', () => {
  const original = admit()
  assert.ok(original.architectureDefinition)
  const restored = admitContract(
    original.definition,
    original.architectureDefinition
  )
  assert.equal(restored.digest, original.digest)
  assert.ok(Object.isFrozen(original.architectureDefinition.steps))
  assert.notStrictEqual(original.architectureDefinition, architecture)
})
