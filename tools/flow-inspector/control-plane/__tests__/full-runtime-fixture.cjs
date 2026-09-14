/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const sourceOwner = require('../snapshot.cjs')
const evidenceOwner = require('../evidence.cjs')
const { loadContract } = require('../contracts.cjs')
const { runVerification } = require('../runner.cjs')
const { createService, LOCAL_ACTOR } = require('../service.cjs')

const packageNames = [
  'collaboration',
  'factory',
  'persistence',
  'props-manager',
  'reactive-events',
  'scene-tree',
  'selection',
  'ui-context',
  'utils'
]
const roleRoot =
  'tools/flow-inspector/control-plane/__tests__/fixtures/full-runtime'
const architecturePath = roleRoot + '/architecture.cjs'
const specPath = roleRoot + '/spec.md'
const manifestPath = 'packages/factory/flow-contracts.json'

const architecture = {
  schema: { id: 'flow-inspector', version: 2 },
  target: {
    id: 'full-runtime-product-evidence',
    kind: 'tool',
    title: 'Full Runtime Product Evidence',
    subtitle: 'Factory, Collaboration and UI Context at one source'
  },
  authority: {
    specPath,
    inspectorPath: architecturePath,
    semanticOwner: 'Full Runtime Product Evidence',
    inspectorOwner: 'Flow Inspector test fixture'
  },
  links: [],
  lanes: [{ id: 'runtime', title: 'Runtime owners', order: 1 }],
  steps: [
    {
      id: 'produce-factory-runtime',
      order: 1,
      laneId: 'runtime',
      title: 'Produce Factory runtime contribution',
      ownerPackage: '@asyra/factory',
      purpose: 'Provide the first captured runtime contribution.',
      inputs: ['registered full-runtime request'],
      outputs: ['artifact:factory-runtime-contribution'],
      conditions: ['Publish only the captured Factory behavior.'],
      bypasses: ['No contribution may be inferred from another owner.'],
      allowedContributors: ['@asyra/factory public runtime'],
      forbiddenContributors: ['PR status', 'caller supplied evidence'],
      implementationBoundary: ['packages/factory/src/index.ts'],
      specRefs: ['#full-runtime-product-evidence'],
      failureOwnerStepId: 'produce-factory-runtime'
    },
    {
      id: 'produce-collaboration-runtime',
      order: 2,
      laneId: 'runtime',
      title: 'Produce Collaboration runtime contribution',
      ownerPackage: '@asyra/collaboration',
      purpose: 'Consume Factory and provide the collaboration contribution.',
      inputs: ['artifact:factory-runtime-contribution'],
      outputs: ['artifact:collaboration-runtime-contribution'],
      conditions: ['Consume the admitted Factory handoff on the same source.'],
      bypasses: ['No missing prerequisite may pass.'],
      allowedContributors: ['@asyra/collaboration public runtime'],
      forbiddenContributors: ['evidence from another HEAD'],
      implementationBoundary: ['packages/collaboration/src/process.ts'],
      specRefs: ['#full-runtime-product-evidence'],
      failureOwnerStepId: 'produce-collaboration-runtime'
    },
    {
      id: 'complete-ui-context-runtime',
      order: 3,
      laneId: 'runtime',
      title: 'Complete UI Context runtime integration',
      ownerPackage: '@asyra/ui-context',
      purpose: 'Consume Collaboration and complete one-source integration.',
      inputs: ['artifact:collaboration-runtime-contribution'],
      outputs: ['artifact:full-runtime-result'],
      conditions: ['Require all captured contributions at one exact source.'],
      bypasses: ['No partial source may become an integrated result.'],
      allowedContributors: ['@asyra/ui-context public runtime'],
      forbiddenContributors: ['combined green results from different sources'],
      implementationBoundary: ['packages/ui-context/src/property-registry.ts'],
      specRefs: ['#full-runtime-product-evidence'],
      failureOwnerStepId: 'complete-ui-context-runtime'
    }
  ],
  artifacts: [
    {
      id: 'artifact:factory-runtime-contribution',
      ownerStepId: 'produce-factory-runtime',
      consumerStepIds: ['produce-collaboration-runtime']
    },
    {
      id: 'artifact:collaboration-runtime-contribution',
      ownerStepId: 'produce-collaboration-runtime',
      consumerStepIds: ['complete-ui-context-runtime']
    },
    {
      id: 'artifact:full-runtime-result',
      ownerStepId: 'complete-ui-context-runtime',
      consumerStepIds: [],
      terminal: true
    }
  ],
  routes: [
    {
      id: 'factory-to-collaboration',
      from: 'produce-factory-runtime',
      to: 'produce-collaboration-runtime',
      producedArtifacts: ['artifact:factory-runtime-contribution'],
      predicate: 'The Factory contribution is present at the selected source.'
    },
    {
      id: 'collaboration-to-ui-context',
      from: 'produce-collaboration-runtime',
      to: 'complete-ui-context-runtime',
      producedArtifacts: ['artifact:collaboration-runtime-contribution'],
      predicate:
        'The Collaboration contribution is present at the selected source.'
    },
    {
      id: 'ui-context-to-result',
      from: 'complete-ui-context-runtime',
      to: null,
      producedArtifacts: ['artifact:full-runtime-result'],
      predicate: 'All three contributions agree at one source.'
    }
  ],
  invariants: [],
  acceptanceContracts: []
}

const cases = {
  accepted: [
    [
      'accepted.factory',
      'produce-factory-runtime',
      'Accepted Factory behavior'
    ],
    [
      'accepted.collaboration',
      'produce-collaboration-runtime',
      'Accepted Collaboration behavior'
    ],
    [
      'accepted.ui-context',
      'complete-ui-context-runtime',
      'Accepted UI Context behavior'
    ]
  ],
  target: [
    [
      'runtime.factory',
      'produce-factory-runtime',
      'Full runtime Factory contribution'
    ],
    [
      'runtime.collaboration',
      'produce-collaboration-runtime',
      'Full runtime Collaboration contribution'
    ],
    [
      'runtime.ui-context',
      'complete-ui-context-runtime',
      'Full runtime UI Context contribution'
    ],
    [
      'runtime.integration',
      'complete-ui-context-runtime',
      'Full runtime one-source integration'
    ]
  ]
}

function manifest(kind) {
  const selected = cases[kind]
  return {
    version: 2,
    negativeCaseIds: [selected.at(-1)[0]],
    targetId: architecture.target.id,
    architecturePath,
    specPath,
    testFile: roleRoot + '/' + kind + '.test.ts',
    configFile: roleRoot + '/' + kind + '.config.ts',
    externalInputs: [],
    flows: [
      {
        id: kind === 'accepted' ? 'accepted-runtime' : 'full-runtime-delivery',
        title:
          kind === 'accepted'
            ? 'Preserve accepted full runtime behavior'
            : 'Deliver the full runtime target',
        goal:
          kind === 'accepted'
            ? 'Preserve each accepted package behavior.'
            : 'Integrate all three package contributions at one source.',
        stepIds: architecture.steps.map((step) => step.id),
        cases: selected.map(([id, stepId, testName]) => ({
          id,
          stepId,
          testName
        })),
        handoffs: [
          {
            routeId: 'factory-to-collaboration',
            decision: 'required',
            caseIds: [selected[0][0]]
          },
          {
            routeId: 'collaboration-to-ui-context',
            decision: 'required',
            caseIds: [selected[1][0]]
          }
        ]
      }
    ],
    defaultNegativeScenario: 'fixture-regression',
    scenarios: [
      { id: 'baseline', title: 'Current source', expectedFailedCaseIds: [] },
      {
        id: 'fixture-regression',
        title: 'Fixture regression',
        expectedFailedCaseIds: [selected.at(-1)[0]],
        mutation: {
          file: 'packages/factory/src/data-transact.ts',
          from: "if (options.outcome === 'rollback') {",
          to: "if (options.outcome === 'rollback' && false) {"
        }
      }
    ]
  }
}

const aliases = packageNames
  .map(
    (name) =>
      `      '@asyra/${name}': path.join(source, 'packages/${name}/src/index.ts')`
  )
  .join(',\n')
const config = (kind) => `import path from 'node:path'
import { defineConfig } from 'vitest/config'

const source = process.env.FLOW_PROOF_SOURCE as string

export default defineConfig({
  resolve: {
    alias: {
${aliases}
    }
  },
  test: {
    include: [path.join(source, '${roleRoot}/${kind}.test.ts')],
    environment: 'node'
  }
})
`

const acceptedTest = `import { expect, test } from 'vitest'
import { hasSharedDataChannel } from '@asyra/factory'
import { Collaboration } from '@asyra/collaboration'
import { propertyRegistry } from '@asyra/ui-context'

test('Accepted Factory behavior', () => {
  expect(hasSharedDataChannel('full-runtime-unregistered')).toBe(false)
})

test('Accepted Collaboration behavior', () => {
  expect(typeof Collaboration).toBe('function')
})

test('Accepted UI Context behavior', () => {
  expect(propertyRegistry.getAllPropertyKeys()).toEqual([])
})
`

const targetTest = `import { expect, test } from 'vitest'
import * as factoryRuntime from '@asyra/factory'
import type { SharedPublication } from '@asyra/factory'
import { Collaboration, type Provider } from '@asyra/collaboration'
import { propertyRegistry } from '@asyra/ui-context'

type PublicationSource = Readonly<{
  publish(publication: SharedPublication): void
  subscribe(subscriber: (publication: SharedPublication) => void): () => void
}>

type SentPublicationOwner = Collaboration & {
  observeSentPublicationIds?: (subscriber: (id: string) => void) => () => void
}

type PublicationRegistry = typeof propertyRegistry & {
  bindPublicationId?: (
    key: string,
    source: Pick<SentPublicationOwner, 'observeSentPublicationIds'>
  ) => () => void
}

const publication = (publicationId: string): SharedPublication => ({
  publicationId,
  artifactId: 'full-runtime-artifact',
  mode: 'atomic',
  origin: 'action',
  slices: []
})

const wrapChannel = (): PublicationSource => {
  const channel = factoryRuntime.createLocalSharedDataChannel()
  return {
    publish: (value) => channel.appendBatch([value]),
    subscribe: (subscriber) =>
      channel.observeBatch((values) =>
        values.forEach((value) => subscriber(value as SharedPublication))
      )
  }
}

const capturedFactorySource = (): PublicationSource => {
  const create = (
    factoryRuntime as typeof factoryRuntime & {
      createLocalPublicationSource?: () => PublicationSource
    }
  ).createLocalPublicationSource
  if (!create) throw new Error('Factory publication source is unavailable')
  return create()
}

const provider = (): Provider => ({
  identity: {
    documentId: 'full-runtime-document',
    roomId: 'full-runtime-room',
    actorId: 'full-runtime-actor'
  },
  connect: async () => undefined,
  disconnect: async () => undefined,
  reconnect: async () => undefined,
  destroy: async () => undefined,
  getStatus: () => 'connected',
  onStatusChange: () => () => undefined,
  sendPublication: async () => undefined,
  onPublication: () => () => undefined,
  sendAwareness: async () => undefined,
  onAwareness: () => () => undefined,
  onAwarenessDisconnect: () => () => undefined,
  onFailure: () => () => undefined
})

const collaborationFor = (source: PublicationSource) =>
  new Collaboration({
    documentId: 'full-runtime-document',
    roomId: 'full-runtime-room',
    actorId: 'full-runtime-actor',
    publicationSource: source,
    provider: provider(),
    processRemotePublication: async () => undefined
  })

const observeSent = (
  owner: Collaboration,
  subscriber: (id: string) => void
): (() => void) => {
  const observe = (owner as SentPublicationOwner).observeSentPublicationIds
  if (!observe) throw new Error('Collaboration sent-publication owner is unavailable')
  return observe.call(owner, subscriber)
}

const bindPublication = (
  key: string,
  source: SentPublicationOwner
): (() => void) => {
  const bind = (propertyRegistry as PublicationRegistry).bindPublicationId
  if (!bind) throw new Error('UI Context publication binding is unavailable')
  return bind.call(propertyRegistry, key, source)
}

test('Full runtime Factory contribution', () => {
  const source = capturedFactorySource()
  let received: SharedPublication | undefined
  const dispose = source.subscribe((value) => {
    received = value
  })
  source.publish(publication('factory-r1'))
  expect(received?.publicationId).toBe('factory-r1')
  dispose()
})

test('Full runtime Collaboration contribution', async () => {
  const source = wrapChannel()
  const owner = collaborationFor(source)
  const received: string[] = []
  await owner.start()
  const dispose = observeSent(owner, (id) => received.push(id))
  source.publish(publication('collaboration-r1'))
  await owner.whenIdle()
  expect(received).toEqual(['collaboration-r1'])
  dispose()
  await owner.dispose()
})

test('Full runtime UI Context contribution', () => {
  const key = 'full-runtime-ui-context'
  const source = {
    observeSentPublicationIds(subscriber: (id: string) => void) {
      subscriber('context-r1')
      return () => undefined
    }
  } as SentPublicationOwner
  const dispose = bindPublication(key, source)
  expect(String(propertyRegistry.get(key))).toMatch(/context-r1$/)
  dispose()
  propertyRegistry.unregister(key)
})

test('Full runtime one-source integration', async () => {
  const key = 'full-runtime-integration'
  const source = capturedFactorySource()
  const owner = collaborationFor(source)
  await owner.start()
  const dispose = bindPublication(key, owner as SentPublicationOwner)
  expect(propertyRegistry.get(key)).toBe(null)
  source.publish(publication('full-runtime-publication'))
  await owner.whenIdle()
  expect(propertyRegistry.get(key)).toBe('full-runtime-publication')
  dispose()
  propertyRegistry.unregister(key)
  await owner.dispose()
})
`

function git(repository, args) {
  return execFileSync('git', args, { cwd: repository, encoding: 'utf8' }).trim()
}

function write(repository, relative, bytes) {
  const file = path.join(repository, relative)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, bytes)
}

function replace(repository, relative, from, to) {
  const file = path.join(repository, relative)
  const before = fs.readFileSync(file, 'utf8')
  const after = before.replace(from, to)
  assert.notEqual(after, before, 'fixture mutation must change ' + relative)
  fs.writeFileSync(file, after)
}

function installContract(repository, kind) {
  write(
    repository,
    manifestPath,
    JSON.stringify(manifest(kind), null, 2) + '\n'
  )
}

function checkout(repository, ref) {
  git(repository, ['reset', '--hard', '-q'])
  git(repository, ['checkout', '-q', ref])
}

function commit(repository, message) {
  git(repository, ['add', 'packages'])
  git(repository, ['commit', '-qm', message])
  return git(repository, ['rev-parse', 'HEAD'])
}

function createFullRuntimeFixture(root, parent) {
  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'full-runtime-'))
  const repository = path.join(directory, 'repository')
  fs.mkdirSync(path.join(repository, 'packages'), { recursive: true })
  for (const name of packageNames)
    fs.cpSync(
      path.join(root, 'packages', name),
      path.join(repository, 'packages', name),
      {
        recursive: true
      }
    )
  for (const name of ['package.json', 'yarn.lock'])
    fs.copyFileSync(path.join(root, name), path.join(repository, name))
  write(
    repository,
    architecturePath,
    'module.exports = ' + JSON.stringify(architecture, null, 2) + '\n'
  )
  write(
    repository,
    specPath,
    '# Full runtime product evidence\n\nThe fixture requires all three package contributions at one captured source.\n'
  )
  write(repository, roleRoot + '/accepted.test.ts', acceptedTest)
  write(repository, roleRoot + '/target.test.ts', targetTest)
  write(repository, roleRoot + '/accepted.config.ts', config('accepted'))
  write(repository, roleRoot + '/target.config.ts', config('target'))
  installContract(repository, 'accepted')
  git(repository, ['init', '-q', '-b', 'fixture-base'])
  git(repository, ['config', 'user.name', 'Flow Fixture'])
  git(repository, ['config', 'user.email', 'flow-fixture@example.invalid'])
  git(repository, ['add', '.'])
  git(repository, ['commit', '-qm', 'fixture base'])
  const refs = { base: git(repository, ['rev-parse', 'HEAD']) }

  git(repository, ['checkout', '-qb', 'factory-contribution', refs.base])
  replace(
    repository,
    'packages/factory/src/index.ts',
    "import { initFactorySubscribe } from './subscribes.js'\n",
    "import { initFactorySubscribe } from './subscribes.js'\nimport type { SharedPublication } from './shared-delivery.js'\n"
  )
  replace(
    repository,
    'packages/factory/src/index.ts',
    'export const createLocalSharedDataChannel = () =>\n  factory.createLocalSharedDataChannel()\n',
    'export const createLocalSharedDataChannel = () =>\n  factory.createLocalSharedDataChannel()\n\nexport const createLocalPublicationSource = () => {\n  const channel = factory.createLocalSharedDataChannel()\n  return Object.freeze({\n    publish: (publication: SharedPublication) =>\n      channel.appendBatch([publication]),\n    subscribe: (subscriber: (publication: SharedPublication) => void) =>\n      channel.observeBatch((publications) =>\n        publications.forEach((publication) =>\n          subscriber(publication as SharedPublication)\n        )\n      )\n  })\n}\n'
  )
  refs.factory = commit(repository, 'Factory runtime contribution')

  git(repository, ['checkout', '-qb', 'collaboration-contribution', refs.base])
  replace(
    repository,
    'packages/collaboration/src/process.ts',
    '  observePublicationOutcomes(\n',
    "  observeSentPublicationIds(\n    subscriber: (publicationId: string) => void\n  ): () => void {\n    return this.observePublicationOutcomes((outcome) => {\n      if (outcome.direction === 'local' && outcome.status === 'sent') {\n        subscriber(outcome.publicationId)\n      }\n    })\n  }\n\n  observePublicationOutcomes(\n"
  )
  refs.collaboration = commit(repository, 'Collaboration runtime contribution')

  git(repository, ['checkout', '-qb', 'ui-context-contribution', refs.base])
  replace(
    repository,
    'packages/ui-context/src/property-registry.ts',
    "  getMatchingProperties(change: SceneTreeYjsChange['payload']): string[] {\n",
    "  bindPublicationId(\n    key: string,\n    source: {\n      observeSentPublicationIds(\n        subscriber: (publicationId: string) => void\n      ): () => void\n    }\n  ): () => void {\n    this.unregister(key)\n    this.register(key, { defaultValue: null })\n    return source.observeSentPublicationIds((publicationId) =>\n      this.set(key, 'ui-' + publicationId)\n    )\n  }\n\n  getMatchingProperties(change: SceneTreeYjsChange['payload']): string[] {\n"
  )
  refs.uiContext = commit(repository, 'UI Context runtime contribution')

  git(repository, ['checkout', '-qb', 'first-two-contributions', refs.base])
  git(repository, ['cherry-pick', refs.factory, refs.collaboration])
  refs.firstTwo = git(repository, ['rev-parse', 'HEAD'])

  git(repository, ['checkout', '-qb', 'integration-regression', refs.firstTwo])
  git(repository, ['cherry-pick', refs.uiContext])
  refs.integrationRegression = git(repository, ['rev-parse', 'HEAD'])
  replace(
    repository,
    'packages/ui-context/src/property-registry.ts',
    "this.set(key, 'ui-' + publicationId)",
    'this.set(key, publicationId)'
  )
  refs.integrated = commit(repository, 'Align full runtime integration')
  refs.integrationFix = refs.integrated

  git(repository, [
    'checkout',
    '-qb',
    'disconnected-collaboration',
    refs.integrated
  ])
  replace(
    repository,
    'packages/collaboration/src/process.ts',
    '  const publicationSource =\n    input.publicationSource ??\n    (input.factory\n      ? {\n          subscribe: input.factory.subscribeToSharedPublication.bind(\n            input.factory\n          )\n        }\n      : undefined)',
    '  const publicationSource = undefined'
  )
  refs.disconnectedCollaboration = commit(
    repository,
    'Disconnect Collaboration from Factory publications'
  )

  git(repository, [
    'checkout',
    '-qb',
    'disconnected-ui-context',
    refs.integrated
  ])
  replace(
    repository,
    'packages/ui-context/src/property-registry.ts',
    '    if (!isEqual(currentValue, value)) {\n      subject.next(value)\n    }',
    '    if (!isEqual(currentValue, value)) {\n      void value\n    }'
  )
  refs.disconnectedUiContext = commit(
    repository,
    'Disconnect UI Context property updates'
  )

  git(repository, ['checkout', '-qb', 'source-advance', refs.integrated])
  fs.appendFileSync(
    path.join(repository, 'packages/factory/src/index.ts'),
    '\n// Full runtime source advance fixture.\n'
  )
  refs.advanced = commit(repository, 'Advance the integrated source')

  git(repository, ['checkout', '-qb', 'accepted-regression', refs.factory])
  replace(
    repository,
    'packages/factory/src/index.ts',
    'export const hasSharedDataChannel = (name: SharedDataChannelName) =>\n  factory.hasSharedDataChannel(name)',
    'export const hasSharedDataChannel = (_name: SharedDataChannelName) => true'
  )
  refs.acceptedRegression = commit(
    repository,
    'Regress accepted Factory behavior'
  )

  git(repository, ['checkout', '-qb', 'reverted-integration', refs.integrated])
  git(repository, ['revert', '--no-edit', refs.integrationFix])
  refs.reverted = git(repository, ['rev-parse', 'HEAD'])
  checkout(repository, refs.base)

  async function produce({ ref, kind, label, expectedStatus }) {
    checkout(repository, ref)
    installContract(repository, kind)
    const contract = loadContract(repository)
    const id = randomUUID()
    const runDirectory = path.join(repository, '.proofs', label + '-' + id)
    const snapshot = sourceOwner.captureSource(
      repository,
      runDirectory,
      contract
    )
    const flowIds = contract.flows.map((flow) => flow.id)
    const runner = await runVerification({
      repositoryRoot: root,
      runDirectory,
      snapshot,
      contract,
      scenario: 'baseline',
      flowIds,
      timeoutMs: 30000
    })
    const admitted = sourceOwner.validateSourceSnapshot(snapshot, contract)
    const sourceAdmission = Object.freeze({
      attemptId: id,
      repository,
      head: snapshot.head,
      sourceDigest: snapshot.digest,
      ...admitted,
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      configurationDigest: snapshot.configurationDigest
    })
    const evidence = evidenceOwner.assessEvidence(
      contract,
      snapshot,
      runner,
      flowIds,
      'baseline',
      sourceAdmission
    )
    if (expectedStatus)
      assert.equal(
        evidence.status,
        expectedStatus,
        JSON.stringify(evidence.issues)
      )
    const record = {
      id,
      phase: 'completed',
      snapshot,
      runner,
      evidence,
      flowIds,
      scenario: 'baseline'
    }
    evidenceOwner.validateStoredEvidence(contract, record, sourceAdmission)
    assert.deepEqual(
      snapshot.runtimeAuthority.packageNames,
      packageNames.map((name) => '@asyra/' + name).sort()
    )
    return {
      contract,
      record,
      sourceAdmission,
      request: {
        id,
        contractDigest: contract.digest,
        verificationSourceDigest: sourceAdmission.verificationSource.digest,
        flowIds,
        record,
        sourceAdmission
      }
    }
  }

  async function prepareService(directory) {
    checkout(repository, refs.base)
    installContract(repository, 'accepted')
    const service = createService(repository, { directory })
    const acceptedSource = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    assert.equal(acceptedSource.evidence.status, 'passed')
    const acceptedReview = service.prepareEvolution(
      { attemptId: acceptedSource.id },
      LOCAL_ACTOR
    )
    service.decideEvolution(
      {
        id: acceptedReview.id,
        decision: 'accept',
        reason: 'Pin the real accepted full-runtime verifier'
      },
      LOCAL_ACTOR
    )

    checkout(repository, refs.integrated)
    installContract(repository, 'target')
    const targetSource = await service.wait(
      service.start({ mode: 'candidate' }, LOCAL_ACTOR)
    )
    assert.equal(targetSource.evidence.status, 'passed')
    const targetReview = service.prepareEvolution(
      { attemptId: targetSource.id },
      LOCAL_ACTOR
    )
    const targetContract = targetReview.candidate.contract
    const byCase = new Map(
      targetContract.cases.map((item) => [item.id, item.stepId])
    )
    const factoryWork = {
      id: randomUUID(),
      title: 'Factory runtime contribution',
      stepId: byCase.get('runtime.factory'),
      obligationIds: ['runtime.factory'],
      scope: 'Prove the captured Factory public behavior.',
      allowedFiles: ['packages/factory/src/index.ts'],
      prerequisites: []
    }
    const collaborationWork = {
      id: randomUUID(),
      title: 'Collaboration runtime contribution',
      stepId: byCase.get('runtime.collaboration'),
      obligationIds: ['runtime.collaboration'],
      scope: 'Prove the captured Collaboration public behavior.',
      allowedFiles: ['packages/collaboration/src/process.ts'],
      prerequisites: [
        {
          workId: factoryWork.id,
          handoff: 'Consume the Factory contribution from the same source.'
        }
      ]
    }
    const uiWork = {
      id: randomUUID(),
      title: 'UI Context runtime integration',
      stepId: byCase.get('runtime.ui-context'),
      obligationIds: ['runtime.ui-context', 'runtime.integration'],
      scope: 'Prove UI Context and the complete one-source integration.',
      allowedFiles: ['packages/ui-context/src/property-registry.ts'],
      prerequisites: [
        {
          workId: collaborationWork.id,
          handoff:
            'Consume the Collaboration contribution from the same source.'
        }
      ]
    }
    const target = service.decideTarget(
      {
        action: 'create',
        requestId: randomUUID(),
        expectedRevision: 0,
        reason: 'Create the reviewed full-runtime delivery target',
        flowId: targetContract.flows[0].id,
        targetRevision: targetContract.digest,
        targetReviewId: targetReview.id,
        acceptedBaseline: {
          revision: service.state().mapping.revision,
          contractDigest: service.contract().digest
        },
        objective: 'Deliver all three public runtime contributions.',
        works: [factoryWork, collaborationWork],
        pending: ['runtime.ui-context', 'runtime.integration']
      },
      LOCAL_ACTOR
    )
    const revise = (owner = service) =>
      owner.decideTarget(
        {
          action: 'revise',
          targetId: target.id,
          requestId: randomUUID(),
          expectedRevision: 1,
          reason: 'Add the final UI Context integration commitment',
          objective: 'Deliver all three public runtime contributions.',
          works: [factoryWork, collaborationWork, uiWork],
          pending: []
        },
        LOCAL_ACTOR
      )
    const assess = async (owner, source) => {
      let selected = source
      if (typeof source === 'string') {
        checkout(repository, source)
        installContract(repository, 'target')
        selected = await owner.wait(
          owner.start({ mode: 'candidate' }, LOCAL_ACTOR)
        )
      }
      const assessment = await owner.waitTargetAssessment(
        owner.startTargetAssessment(
          {
            requestId: randomUUID(),
            targetId: target.id,
            allocationRevision: 2,
            sourceAttemptId: selected.id
          },
          LOCAL_ACTOR
        )
      )
      return { source: selected, assessment }
    }
    return {
      service,
      acceptedSource,
      targetSource,
      targetReview,
      targetContract,
      target,
      works: [factoryWork, collaborationWork, uiWork],
      revise,
      assess
    }
  }

  return {
    directory,
    repository,
    refs,
    architecture: structuredClone(architecture),
    produce,
    prepareService,
    checkout: (ref) => checkout(repository, ref),
    installContract: (kind) => installContract(repository, kind),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
  }
}

module.exports = { createFullRuntimeFixture }
