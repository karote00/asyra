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

test('resolves every declared flow and obligation using architecture-owned steps', () => {
  const contract = admit()
  assert.equal(contract.flows.length, manifest.flows.length)
  assert.equal(
    contract.cases.length,
    manifest.flows.flatMap((flow) => flow.cases).length
  )
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

test('a terminal App shortcut admits no incoming handoffs and retains exact locations', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'apps/asyra-design/undo-redo-flow-contracts.json'
  )
  assert.equal(contract.flows[0].steps[0].ownerPackage, '@asyra/asyra-design')
  assert.deepEqual(contract.flows[0].handoffs, [])
  for (const location of ['../outside.ts', 'packages/factory/src/index.ts']) {
    const changed = structuredClone(contract.definition)
    changed.flows[0].cases[0].implementationPaths = [location]
    assert.throws(
      () => admitContract(changed, contract.architectureDefinition),
      /implementation location/
    )
  }
  const changed = structuredClone(manifest)
  changed.flows[0].handoffs = []
  assert.throws(() => admitContract(changed, architecture), /handoff/)
})

test('History replay admission maps existing Factory cases to their runtime owner', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'packages/factory/history-replay-flow-contracts.json'
  )
  assert.equal(contract.targetId, 'history-replay')
  assert.equal(contract.cases.length, 17)
  const source = fs.readFileSync(path.join(root, contract.testFile), 'utf8')
  for (const item of contract.cases) {
    assert.ok(
      source.includes(
        item.testName.replace('Factory journal-backed action history ', '')
      )
    )
    assert.ok(
      [
        'replay-history-action',
        'record-history-action',
        'rollback-history-action',
        'settle-staged-delivery'
      ].includes(item.stepId)
    )
    assert.deepEqual(item.implementationPaths, [
      'packages/factory/src/factory.ts',
      'packages/factory/src/data-transact.ts'
    ])
  }
  assert.equal(contract.runtimeScope.steps[0].ownerPackage, '@asyra/factory')
  assert.deepEqual(
    contract.scenarios.map((item) => item.expectedFailedCaseIds),
    [
      [],
      [
        'replay.ordered-action',
        'replay.staged-values',
        'history.90c1fbd29755',
        'history.7d96f5d33001',
        'history.6c31100f5251',
        'history.1dcdd4ddc7f6',
        'history.62418a7b00e1',
        'history.13bb8b0a23fc'
      ],
      [
        'replay.staged-values',
        'replay.noop-synchronous',
        'replay.noop-progressive',
        'history.694ddfd8f6f5',
        'history.90c1fbd29755',
        'history.7d96f5d33001',
        'history.6c31100f5251',
        'history.1dcdd4ddc7f6',
        'history.62418a7b00e1',
        'history.13bb8b0a23fc',
        'history.99e545778d60',
        'replay.noop-failure-recovery'
      ],
      [
        'replay.noop-synchronous',
        'replay.noop-progressive',
        'replay.noop-failure-recovery'
      ]
    ]
  )
})

test('Design execution admission locates all existing cases within their seven owners', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'apps/asyra-design/flow-contracts.json'
  )
  assert.deepEqual(
    [...new Set(contract.cases.map((item) => item.stepId))].sort(),
    ['apply', 'compose', 'inspect', 'observe', 'prepare', 'request', 'settle']
  )
  const source = fs.readFileSync(path.join(root, contract.testFile), 'utf8')
  const ts = require('typescript')
  const parsed = ts.createSourceFile(
    contract.testFile,
    source,
    ts.ScriptTarget.Latest,
    true
  )
  const declared = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'it' &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      declared.push(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  assert.ok(declared.length > 0)
  assert.deepEqual(
    contract.cases.map((item) => item.testName).sort(),
    declared.sort()
  )
  for (const step of contract.runtimeScope.steps) {
    for (const boundary of step.implementationBoundary) {
      assert.ok(
        fs.existsSync(path.join(root, boundary.replace(/\/\*\*$/, ''))),
        boundary
      )
    }
  }
  for (const item of contract.cases) {
    assert.ok(source.includes(item.testName))
    assert.ok(item.implementationPaths?.length, item.id)
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile())
      assert.ok(!file.includes('__tests__'), item.id)
    }
  }
})

test('Render viewport admission retains six exact responsibility locations', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'packages/render/navigation-flow-contracts.json'
  )
  assert.equal(
    contract.specPath,
    contract.architectureDefinition.authority.specPath
  )
  const headings = fs
    .readFileSync(path.join(root, contract.specPath), 'utf8')
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line))
    .map(
      (line) => '#' + line.replace(/^#+ /, '').toLowerCase().replace(/ /g, '-')
    )
  const step = contract.architectureDefinition.steps.find(
    (item) => item.id === 'orchestrate-render-adapter'
  )
  for (const reference of step.specRefs) {
    assert.ok(headings.includes(reference), reference)
  }
  assert.equal(contract.cases.length, 6)
  for (const item of contract.cases) {
    assert.equal(item.stepId, 'orchestrate-render-adapter')
    assert.ok(
      item.implementationPaths?.includes(
        'packages/render/src/layers/viewport/viewport-layer.ts'
      ),
      item.id
    )
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile())
    }
  }
})

test('Render viewport source config runs all unchanged cases without proof environment', () => {
  const root = path.resolve(__dirname, '../../../..')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const temporary = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/viewport-config-')
  )
  const env = { ...process.env, TMPDIR: temporary }
  delete env.FLOW_PROOF_SOURCE
  delete env.FLOW_PROOF_SCENARIO
  const result = require('node:child_process').spawnSync(
    process.execPath,
    [
      require.resolve('vitest/vitest.mjs'),
      'run',
      '--config',
      'packages/render/src/__tests__/navigation-flow.config.ts',
      '--reporter=json'
    ],
    { cwd: root, env, encoding: 'utf8', timeout: 30000 }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.numPassedTests, 6)
  assert.equal(report.numFailedTests, 0)
})

test('Reusable composition admission retains four exact owner locations', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'packages/ai-agent-runtime/flow-contracts.json'
  )
  assert.equal(
    contract.specPath,
    contract.architectureDefinition.authority.specPath
  )
  assert.deepEqual(
    [...new Set(contract.cases.map((item) => item.stepId))],
    ['admit', 'register', 'invoke', 'persist']
  )
  const source = fs.readFileSync(path.join(root, contract.testFile), 'utf8')
  const spec = fs.readFileSync(path.join(root, contract.specPath), 'utf8')
  const headings = spec
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line))
    .map(
      (line) => '#' + line.replace(/^#+ /, '').toLowerCase().replace(/ /g, '-')
    )
  for (const item of contract.cases) {
    assert.ok(source.includes(item.testName.replace('recipe proof ', '')))
    assert.ok(item.implementationPaths?.length, item.id)
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile())
    }
    const step = contract.architectureDefinition.steps.find(
      (step) => step.id === item.stepId
    )
    for (const ref of step.specRefs) {
      assert.ok(headings.includes(ref), ref)
    }
  }
})
test('Reusable composition source config runs all unchanged cases without proof environment', () => {
  const root = path.resolve(__dirname, '../../../..')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const temporary = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/recipe-config-')
  )
  const env = { ...process.env, TMPDIR: temporary }
  delete env.FLOW_PROOF_SOURCE
  delete env.FLOW_PROOF_SCENARIO
  const result = require('node:child_process').spawnSync(
    process.execPath,
    [
      require.resolve('vitest/vitest.mjs'),
      'run',
      '--config',
      'packages/ai-agent-runtime/src/__tests__/recipe-flow.config.ts',
      '--reporter=json'
    ],
    { cwd: root, env, encoding: 'utf8', timeout: 30000 }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.numPassedTests, 11)
  assert.equal(report.numFailedTests, 0)
})

test('Pixi engine admission retains 29 exact responsibility locations', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'packages/render-engine-pixi/navigation-flow-contracts.json'
  )
  assert.equal(
    contract.specPath,
    contract.architectureDefinition.authority.specPath
  )
  const headings = fs
    .readFileSync(path.join(root, contract.specPath), 'utf8')
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line))
    .map(
      (line) => '#' + line.replace(/^#+ /, '').toLowerCase().replace(/ /g, '-')
    )
  const step = contract.architectureDefinition.steps.find(
    (item) => item.id === 'execute-render-engine'
  )
  for (const reference of step.specRefs) {
    assert.ok(headings.includes(reference), reference)
  }
  assert.equal(contract.cases.length, 29)
  for (const item of contract.cases) {
    assert.equal(item.stepId, 'execute-render-engine')
    assert.ok(
      item.implementationPaths?.includes(
        'packages/render-engine-pixi/src/pixi-render-engine.ts'
      ),
      item.id
    )
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile())
    }
  }
})

test('Pixi engine source config runs all unchanged cases without proof environment', () => {
  const root = path.resolve(__dirname, '../../../..')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const temporary = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/pixi-config-')
  )
  const env = { ...process.env, TMPDIR: temporary }
  delete env.FLOW_PROOF_SOURCE
  delete env.FLOW_PROOF_SCENARIO
  const result = require('node:child_process').spawnSync(
    process.execPath,
    [
      require.resolve('vitest/vitest.mjs'),
      'run',
      '--config',
      'packages/render-engine-pixi/src/__tests__/navigation-flow.config.ts',
      '--reporter=json'
    ],
    { cwd: root, env, encoding: 'utf8', timeout: 30000 }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.numPassedTests, 29)
  assert.equal(report.numFailedTests, 0)
})

test('Preset vector admission retains exact locations and the explicitly referenced package specification', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'packages/preset/navigation-flow-contracts.json'
  )
  assert.equal(contract.cases.length, 11)
  assert.equal(contract.specPath, 'docs/ai/framework/packages/preset.md')
  const step = contract.architectureDefinition.steps.find(
    (item) => item.id === 'evaluate-vector-material'
  )
  assert.ok(step.specRefs.includes(contract.specPath))
  assert.ok(fs.statSync(path.join(root, contract.specPath)).isFile())
  for (const item of contract.cases) {
    assert.equal(item.stepId, step.id)
    assert.deepEqual(item.implementationPaths, [
      'packages/preset/src/components/vector.ts',
      'packages/preset/src/components/fills.ts',
      'packages/preset/src/components/vector-compound-fill.ts'
    ])
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile())
    }
  }
})
test('Preset vector source config runs all unchanged cases without proof environment', () => {
  const root = path.resolve(__dirname, '../../../..')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const temporary = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/vector-config-')
  )
  const env = { ...process.env, TMPDIR: temporary }
  delete env.FLOW_PROOF_SOURCE
  delete env.FLOW_PROOF_SCENARIO
  const result = require('node:child_process').spawnSync(
    process.execPath,
    [
      require.resolve('vitest/vitest.mjs'),
      'run',
      '--config',
      'packages/preset/src/__tests__/navigation-flow.config.ts',
      '--reporter=json'
    ],
    { cwd: root, env, encoding: 'utf8', timeout: 30000 }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.numPassedTests, 11)
  assert.equal(report.numFailedTests, 0)
})

test('Preset compound coverage admission retains exact locations and the explicitly referenced package specification', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'packages/preset/coverage-flow-contracts.json'
  )
  assert.equal(contract.cases.length, 16)
  assert.equal(contract.specPath, 'docs/ai/framework/packages/preset.md')
  const step = contract.architectureDefinition.steps.find(
    (item) => item.id === 'evaluate-vector-material'
  )
  assert.ok(step.specRefs.includes(contract.specPath))
  assert.ok(fs.statSync(path.join(root, contract.specPath)).isFile())
  for (const item of contract.cases) {
    assert.equal(item.stepId, step.id)
    assert.deepEqual(
      item.implementationPaths,
      item.testName.startsWith('paint-independent vector coverage ') ||
        item.id === 'coverage.preserve.14'
        ? ['packages/preset/src/components/vector-compound-fill.ts']
        : [
            'packages/preset/src/components/vector.ts',
            'packages/preset/src/components/fills.ts',
            'packages/preset/src/components/vector-compound-fill.ts'
          ]
    )
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile())
    }
  }
})
test('Preset compound coverage source config runs all unchanged cases without proof environment', () => {
  const root = path.resolve(__dirname, '../../../..')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const temporary = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/vector-config-')
  )
  const env = { ...process.env, TMPDIR: temporary }
  delete env.FLOW_PROOF_SOURCE
  delete env.FLOW_PROOF_SCENARIO
  const result = require('node:child_process').spawnSync(
    process.execPath,
    [
      require.resolve('vitest/vitest.mjs'),
      'run',
      '--config',
      'packages/preset/src/__tests__/coverage-flow.config.ts',
      '--reporter=json'
    ],
    { cwd: root, env, encoding: 'utf8', timeout: 30000 }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const report = JSON.parse(result.stdout)
  assert.equal(report.numPassedTests, 16)
  assert.equal(report.numFailedTests, 0)
})

test('Playwright observations admit exact cases without inventing executable proof scenarios', async () => {
  const input = structuredClone({ manifest, architecture })
  input.manifest.runner = 'playwright'
  input.manifest.negativeCaseIds = []
  input.manifest.scenarios = []
  input.manifest.defaultNegativeScenario = null
  const contract = admitContract(input.manifest, input.architecture)
  assert.equal(contract.runner, 'playwright')
  assert.deepEqual(contract.scenarios, [])
  const { runVerification } = require('../runner.cjs')
  await assert.rejects(() => runVerification({ contract }), /observation-only/)
  for (const runner of [null, 'unknown', '']) {
    input.manifest.runner = runner
    assert.throws(
      () => admitContract(input.manifest, input.architecture),
      /runner/
    )
  }
})

test('Design Playwright mapping admits only the six reviewed Chromium deletion cases', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'apps/asyra-design/playwright-flow-contracts.json'
  )
  assert.equal(contract.runner, 'playwright')
  const expected = [
    ['design.delete', 'Delete key removes the single selected element'],
    ['design.backspace', 'Backspace key removes the single selected element'],
    [
      'design.delete-no-selection',
      'Delete key is a no-op when nothing is selected'
    ],
    ['design.delete-path-editing', 'Delete is blocked in path-editing mode'],
    [
      'design.delete-path-mode-without-vector',
      'Delete is blocked when path-editing mode is true even without editing vector id'
    ],
    [
      'design.delete-outside-path-mode',
      'Delete is allowed when path-editing mode is false even if editing vector id exists'
    ]
  ]
  assert.deepEqual(
    contract.cases.map((item) => [item.id, item.testName]),
    expected.map(([id, name]) => [id, 'Delete Selected Element ' + name])
  )
  const source = fs.readFileSync(path.join(root, contract.testFile), 'utf8')
  for (const item of contract.cases) {
    assert.equal(item.projectName, 'chromium')
    assert.equal(item.stepId, 'delete-selected-element')
    assert.ok(
      source.includes(
        "test('" + item.testName.replace('Delete Selected Element ', '') + "'"
      )
    )
    for (const file of item.implementationPaths) {
      assert.ok(fs.statSync(path.join(root, file)).isFile(), file)
    }
  }
})

test('observation cases admit exact per-case files and reject unsafe or non-observation selectors', () => {
  const manifest = require('../../../../apps/asyra-design/playwright-flow-contracts.json')
  const architecture = require('../../inspectors/design-deletion-flow-inspector.data.cjs')
  const input = structuredClone(manifest)
  const selected = input.flows[0].cases[0]
  selected.testFile = 'apps/asyra-design/e2e/selection.spec.ts'
  const contract = admitContract(input, architecture)
  assert.equal(contract.cases[0].testFile, selected.testFile)
  assert.equal(contract.cases[1].testFile, undefined)
  assert.ok(Object.isFrozen(contract.cases[0]))
  for (const file of [
    null,
    '',
    '../escaped.spec.ts',
    '/escaped.spec.ts',
    'apps//test.spec.ts',
    'apps/../test.spec.ts',
    'apps/*.spec.ts',
    'apps\\test.spec.ts'
  ]) {
    selected.testFile = file
    assert.throws(() => admitContract(input, architecture), /case test file/)
  }
  assert.throws(
    () =>
      admit(({ manifest }) => {
        manifest.flows[0].cases[0].testFile =
          'apps/asyra-design/e2e/selection.spec.ts'
      }),
    /case test file/
  )
})

test('the complete functional discovery has one exact responsibility per case, including isolated status', () => {
  const root = path.resolve(__dirname, '../../../..')
  const { spawnSync } = require('node:child_process')
  const { sourceManifestPaths } = require('../playwright-results.cjs')
  const collect = (source, configFile) => {
    const contracts = sourceManifestPaths(source).map((file) =>
      loadContract(root, undefined, file)
    )
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, 'node_modules/playwright/cli.js'),
        'test',
        '--config',
        configFile,
        '--list',
        '--reporter=json'
      ],
      {
        cwd: path.join(root, 'apps/asyra-design'),
        env: {
          ...process.env,
          PLAYWRIGHT_JSON_OUTPUT_NAME: '',
          PLAYWRIGHT_JSON_OUTPUT_FILE: '',
          CI: 'true',
          E2E_SKIP_PERFORMANCE: 'true',
          E2E_CRDT_7076: 'false'
        },
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024
      }
    )
    assert.equal(result.status, 0, result.stderr + result.stdout.slice(-2000))
    const report = JSON.parse(result.stdout)
    assert.deepEqual(report.errors, [])
    const observed = []
    const walk = (suite, titles = []) => {
      for (const spec of suite.specs ?? []) {
        for (const project of spec.tests) {
          observed.push(
            JSON.stringify([
              'apps/asyra-design/e2e/' + spec.file,
              [...titles, spec.title].join(' '),
              project.projectName
            ])
          )
        }
      }
      for (const child of suite.suites ?? []) {
        walk(child, [...titles, child.title])
      }
    }
    for (const suite of report.suites) {
      walk(suite)
    }
    const expected = contracts.flatMap((contract) =>
      contract.cases.map((item) => {
        assert.ok(item.implementationPaths.length > 0)
        for (const file of item.implementationPaths) {
          assert.ok(fs.statSync(path.join(root, file)).isFile(), file)
        }
        return JSON.stringify([
          item.testFile ?? contract.testFile,
          item.testName,
          item.projectName
        ])
      })
    )
    assert.ok(observed.length > 0)
    assert.equal(new Set(expected).size, expected.length)
    assert.deepEqual(observed.sort(), expected.sort())
  }
  collect('functional', 'playwright.config.ts')
  collect('status', 'playwright.status-toast.config.ts')
})

test('functional responsibility follows the asserted operation across test-file boundaries', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'apps/asyra-design/playwright-functional-flow-contracts.json'
  )
  const selected = (id) => contract.cases.find((item) => item.id === id)
  assert.equal(
    selected('functional.pen-tool.db4841244256').stepId,
    'switch-tool'
  )
  const disclosure = selected('functional.group-hierarchy.caf2f297812e')
  assert.equal(disclosure.stepId, 'present-layer-hierarchy')
  assert.ok(
    disclosure.implementationPaths.includes(
      'apps/asyra-design/src/contents/GroupDisclosure.tsx'
    )
  )
  assert.deepEqual(
    selected('functional.app.0ed5202f90ef').implementationPaths,
    ['apps/asyra-design/index.html']
  )
})

test('Text observations retain Canvas, typography, fill and migration owners', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'apps/asyra-design/playwright-functional-flow-contracts.json'
  )
  const cases = contract.cases.filter((item) =>
    /\/text-(canvas|properties)\.spec\.ts$/.test(item.testFile)
  )
  assert.equal(cases.length, 38)
  const requireOwner = (name, stepId, entry) => {
    const item = cases.find((item) => item.testName === name)
    assert.ok(item, name)
    assert.equal(item.stepId, stepId)
    assert.ok(item.implementationPaths.includes(entry), name)
  }
  requireOwner(
    'Canvas publishes live drafts without a Content field and preserves cancel and Undo',
    'edit-native-text',
    'apps/asyra-design/src/common-apis/text-canvas.ts'
  )
  requireOwner(
    'A stale text draft cannot overwrite an external content change',
    'edit-native-text',
    'apps/asyra-design/src/render-app/text-canvas-editor.tsx'
  )
  requireOwner(
    'Combined font style changes both properties in one reversible action',
    'edit-native-text',
    'apps/asyra-design/src/properties/text.tsx'
  )
  requireOwner(
    'Shared text color picker commits a color with one undo step',
    'edit-fills',
    'apps/asyra-design/src/common-apis/fills.ts'
  )
  requireOwner(
    'Old text color documents load into complete Fill data without losing their appearance',
    'edit-native-text',
    'apps/asyra-design/src/collaboration/migrate-text-fills.ts'
  )
})

test('toolbar observations retain the actual reset, control and zoom implementation entries', () => {
  const root = path.resolve(__dirname, '../../../..')
  const contract = loadContract(
    root,
    undefined,
    'apps/asyra-design/playwright-functional-flow-contracts.json'
  )
  const requireEntry = (name, entries) => {
    const item = contract.cases.find((item) => item.testName === name)
    assert.ok(item, name)
    for (const entry of entries) {
      assert.ok(
        item.implementationPaths.includes(
          'apps/asyra-design/src/toolbar/' + entry
        ),
        name + ': ' + entry
      )
    }
  }
  requireEntry('Asyra Design Tool should render toolbar with controls', [
    'index.tsx',
    'tool-button.tsx'
  ])
  requireEntry(
    'Asyra Design Tool should permanently expose Reset for ordinary documents',
    ['tool-button.tsx', 'reset-stored-document.ts']
  )
  requireEntry(
    'Asyra Design Tool should refresh a storage-free demo to the empty App',
    ['reset-stored-document.ts']
  )
  requireEntry('Asyra Design Tool should have Zoom display in toolbar', [
    'zoom.tsx'
  ])
  requireEntry(
    'Viewport Navigation should display zoom percentage in toolbar',
    ['zoom.tsx']
  )
  for (const item of contract.cases.filter(
    (item) =>
      item.stepId === 'switch-tool' &&
      item.testName.includes('clicking toolbar button')
  )) {
    requireEntry(item.testName, ['tool-button.tsx'])
  }
})
