/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const test = require('node:test')
const { admitContract, loadContract, mappingDiff } = require('../contracts.cjs')
const manifest = require('../../../../packages/factory/flow-contracts.json')
const architecture = require('../../inspectors/transaction-flow-inspector.data.cjs')

const admit = (change) => {
  const input = structuredClone({ manifest, architecture })
  change?.(input)
  return admitContract(input.manifest, input.architecture)
}

test('workspace source declarations bind real names and relative inputs without requiring a public entry', () => {
  const workspaceSources = [
    { name: '@example/editor', inputs: ['src/**', 'server/**'], entry: null }
  ]
  const contract = admit(({ manifest }) => {
    manifest.workspaceSources = workspaceSources
  })
  assert.equal(contract.runtimeScope.format, 2)
  assert.deepEqual(contract.runtimeScope.workspaceSources, workspaceSources)
  assert.ok(Object.isFrozen(contract.runtimeScope.workspaceSources[0].inputs))
  for (const value of [
    null,
    [],
    [...workspaceSources, ...workspaceSources],
    [{ name: '../editor', inputs: ['src/**'], entry: null }],
    [{ name: '@example/editor', inputs: ['../server/**'], entry: null }],
    [{ name: '@example/editor', inputs: ['**'], entry: null }],
    [{ name: '@example/editor', inputs: ['src/*.ts'], entry: null }],
    [{ name: '@example/editor', inputs: ['src/**', 'src/a.ts'], entry: null }],
    [{ name: '@example/editor', inputs: ['src/**'], entry: 'server/a.ts' }],
    [{ name: '@example/editor', inputs: ['src/**'], entry: 'src/.env' }],
    [
      { name: '@example/editor', inputs: ['src/**'], entry: 'src/view.test.ts' }
    ],
    [
      {
        name: '@example/editor',
        inputs: ['src/**'],
        entry: null,
        path: 'other'
      }
    ]
  ]) {
    assert.throws(
      () =>
        admit(({ manifest }) => {
          manifest.workspaceSources = value
        }),
      /workspace source/i
    )
  }
})

test('product flow admission retains its declared manifest instead of the Factory path', () => {
  const contract = admit(({ manifest }) => {
    manifest.manifestPath = 'apps/example/flow-contracts.json'
  })
  assert.equal(contract.manifestPath, 'apps/example/flow-contracts.json')
  for (const manifestPath of [
    null,
    '',
    '/outside.json',
    '../outside.json',
    'apps/../outside.json',
    'apps//proof.json',
    'apps\\proof.json'
  ]) {
    assert.throws(
      () =>
        admit(({ manifest }) => {
          manifest.manifestPath = manifestPath
        }),
      /manifest.*path/i
    )
  }
})

test('explicit product loading reads that manifest and rejects a substituted declared location', (t) => {
  const root = path.resolve(__dirname, '../../../..')
  const parent = path.join(root, 'tmp/flow-inspector/contract-tests')
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'product-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const selected = path.relative(
    root,
    path.join(directory, 'flow-contracts.json')
  )
  const input = structuredClone(manifest)
  input.manifestPath = selected
  input.flows[0].title = 'Selected App flow'
  fs.writeFileSync(path.join(root, selected), JSON.stringify(input))
  const loaded = loadContract(root, undefined, selected)
  assert.equal(loaded.manifestPath, selected)
  assert.equal(loaded.definition.flows[0].title, 'Selected App flow')
  input.manifestPath = 'apps/other/flow-contracts.json'
  fs.writeFileSync(path.join(root, selected), JSON.stringify(input))
  assert.throws(
    () => loadContract(root, undefined, selected),
    /differs from selected proof/
  )
})

test('App negative proof uses its selected runtime boundary without changing verification', () => {
  const input = structuredClone({ manifest, architecture })
  const runtimeFile = 'apps/example/server/session.ts'
  const selected = new Set(input.manifest.flows.flatMap((flow) => flow.stepIds))
  for (const step of input.architecture.steps.filter((step) =>
    selected.has(step.id)
  )) {
    step.ownerPackage = '@example/editor'
    step.implementationBoundary = [runtimeFile]
  }
  for (const scenario of input.manifest.scenarios.filter(
    (scenario) => scenario.id !== 'baseline'
  )) {
    scenario.mutation.file = runtimeFile
  }
  const admitted = admitContract(input.manifest, input.architecture)
  assert.equal(
    admitted.definition.scenarios.find((scenario) => scenario.id !== 'baseline')
      .mutation.file,
    runtimeFile
  )
  for (const file of [
    'apps/example/server/other.ts',
    input.manifest.testFile,
    '../outside.ts'
  ]) {
    const invalid = structuredClone(input)
    invalid.manifest.scenarios.find(
      (scenario) => scenario.id !== 'baseline'
    ).mutation.file = file
    assert.throws(
      () => admitContract(invalid.manifest, invalid.architecture),
      /runtime mutation/
    )
  }
})

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

test('resolves three real flows and nine obligations using architecture-owned steps', () => {
  const contract = admit()
  assert.equal(contract.flows.length, 3)
  assert.equal(contract.cases.length, 9)
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
