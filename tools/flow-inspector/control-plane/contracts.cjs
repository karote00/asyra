/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

const MANIFEST_PATH = 'packages/factory/flow-contracts.json'
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0
const requireCondition = (condition, message) => {
  if (!condition) throw new Error('Invalid proof contract: ' + message)
}
const unique = (values, label) => {
  requireCondition(
    Array.isArray(values) && values.length > 0,
    label + ' is empty'
  )
  requireCondition(
    values.every(nonempty) && new Set(values).size === values.length,
    label + ' is invalid or duplicated'
  )
}
const digest = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

function admitContract(manifest, architecture) {
  requireCondition(manifest?.version === 2, 'unsupported mapping version')
  requireCondition(
    architecture?.schema?.version === 2 &&
      architecture.target.id === manifest.targetId,
    'target/schema mismatch'
  )
  unique(
    manifest.flows?.map((flow) => flow.id),
    'flow ids'
  )
  const steps = new Map(architecture.steps.map((step) => [step.id, step]))
  requireCondition(
    steps.size === architecture.steps.length,
    'duplicate architecture steps'
  )
  const artifacts = new Map(
    architecture.artifacts.map((artifact) => [artifact.id, artifact])
  )
  requireCondition(
    artifacts.size === architecture.artifacts.length,
    'duplicate artifacts'
  )
  for (const artifact of artifacts.values()) {
    requireCondition(steps.has(artifact.ownerStepId), 'missing artifact owner')
    requireCondition(
      steps.get(artifact.ownerStepId).outputs.includes(artifact.id),
      'missing artifact producer output'
    )
    requireCondition(
      artifact.consumerStepIds.every(
        (id) => steps.has(id) && steps.get(id).inputs.includes(artifact.id)
      ),
      'missing artifact consumer'
    )
  }
  unique(
    architecture.routes.map((route) => route.id),
    'route ids'
  )
  for (const route of architecture.routes) {
    requireCondition(
      steps.has(route.from) && (!route.to || steps.has(route.to)),
      'broken route'
    )
    requireCondition(
      route.producedArtifacts.every((id) => artifacts.has(id)),
      'missing route artifact'
    )
    requireCondition(nonempty(route.predicate), 'missing route predicate')
    for (const id of route.producedArtifacts) {
      const artifact = artifacts.get(id)
      requireCondition(
        artifact.ownerStepId === route.from,
        'incorrect route producer'
      )
      requireCondition(
        route.to
          ? artifact.consumerStepIds.includes(route.to)
          : artifact.terminal === true,
        'incorrect route consumer'
      )
    }
  }
  const cases = []
  const flows = manifest.flows.map((flow) => {
    unique(flow.stepIds, 'selected steps')
    requireCondition(
      nonempty(flow.title) && nonempty(flow.goal),
      'missing flow outcome'
    )
    unique(
      flow.cases?.map((item) => item.id),
      'required cases'
    )
    const selected = new Set(flow.stepIds)
    const resolved = flow.stepIds.map((id) => {
      const step = steps.get(id)
      requireCondition(
        step && nonempty(step.ownerPackage),
        'unknown step or owner'
      )
      for (const key of ['purpose', 'failureOwnerStepId'])
        requireCondition(nonempty(step[key]), 'missing ' + key)
      requireCondition(
        steps.has(step.failureOwnerStepId),
        'unknown failure owner'
      )
      for (const key of [
        'inputs',
        'outputs',
        'conditions',
        'bypasses',
        'allowedContributors',
        'forbiddenContributors',
        'implementationBoundary',
        'specRefs'
      ]) {
        unique(step[key], id + ' ' + key)
      }
      for (const output of step.outputs.filter((value) =>
        value.startsWith('artifact:')
      )) {
        requireCondition(
          artifacts.get(output)?.ownerStepId === id,
          'conflicting output owner'
        )
      }
      for (const input of step.inputs.filter((value) =>
        value.startsWith('artifact:')
      )) {
        const artifact = artifacts.get(input)
        requireCondition(
          artifact && artifact.consumerStepIds.includes(id),
          'missing input producer/consumer'
        )
        if (!selected.has(artifact.ownerStepId)) {
          requireCondition(
            manifest.externalInputs.includes(input),
            'undeclared external input'
          )
        } else {
          requireCondition(
            architecture.routes.some(
              (route) =>
                route.from === artifact.ownerStepId &&
                route.to === id &&
                route.producedArtifacts.includes(input)
            ),
            'missing selected handoff'
          )
        }
      }
      requireCondition(
        flow.cases.some((item) => item.stepId === id),
        'step lacks an obligation'
      )
      return structuredClone(step)
    })
    for (const item of flow.cases) {
      requireCondition(
        selected.has(item.stepId) && nonempty(item.testName),
        'missing case mapping'
      )
      cases.push({ ...item, flowId: flow.id })
    }
    unique(
      flow.handoffs?.map((item) => item.routeId),
      'handoff ids'
    )
    const incoming = architecture.routes.filter(
      (route) => selected.has(route.to) && route.producedArtifacts.length
    )
    requireCondition(
      incoming.length === flow.handoffs.length &&
        incoming.every((route) =>
          flow.handoffs.some((item) => item.routeId === route.id)
        ),
      'missing or unrelated incoming handoff'
    )
    const handoffs = flow.handoffs.map((item) => {
      const route = incoming.find((value) => value.id === item.routeId)
      requireCondition(
        ['required', 'bypassed'].includes(item.decision),
        'unresolved handoff decision'
      )
      unique(item.caseIds, 'handoff evidence')
      requireCondition(
        item.caseIds.every((id) => flow.cases.some((value) => value.id === id)),
        'unknown handoff evidence'
      )
      if (item.decision === 'bypassed') {
        requireCondition(nonempty(item.reason), 'missing bypass reason')
        requireCondition(
          steps.get(route.to).bypasses.length > 0,
          'consumer has no bypass contract'
        )
      }
      return {
        ...structuredClone(route),
        decision: item.decision,
        reason: item.reason ?? null,
        caseIds: [...item.caseIds]
      }
    })
    return {
      id: flow.id,
      title: flow.title,
      goal: flow.goal,
      steps: resolved,
      handoffs
    }
  })
  unique(
    cases.map((item) => item.id),
    'case ids'
  )
  unique(
    cases.map((item) => item.testName),
    'test names'
  )
  unique(manifest.negativeCaseIds, 'negative proof cases')
  requireCondition(
    manifest.negativeCaseIds.every((id) =>
      cases.some((item) => item.id === id)
    ),
    'unknown negative proof case'
  )
  unique(
    manifest.scenarios?.map((scenario) => scenario.id),
    'scenario ids'
  )
  const scenarios = manifest.scenarios.map((scenario) => {
    requireCondition(
      nonempty(scenario.title) && Array.isArray(scenario.expectedFailedCaseIds),
      'invalid scenario'
    )
    if (scenario.id === 'baseline') {
      requireCondition(
        !scenario.mutation && !scenario.expectedFailedCaseIds.length,
        'baseline cannot mutate runtime'
      )
    } else {
      unique(scenario.expectedFailedCaseIds, 'scenario obligations')
      requireCondition(
        scenario.expectedFailedCaseIds.every((id) =>
          cases.some((item) => item.id === id)
        ),
        'unknown scenario obligations'
      )
      requireCondition(
        scenario.mutation?.file === 'packages/factory/src/data-transact.ts' &&
          nonempty(scenario.mutation.from) &&
          nonempty(scenario.mutation.to) &&
          scenario.mutation.from !== scenario.mutation.to,
        'invalid runtime mutation'
      )
    }
    return {
      id: scenario.id,
      title: scenario.title,
      expectedFailedCaseIds: [...scenario.expectedFailedCaseIds]
    }
  })
  requireCondition(
    scenarios.some((scenario) => scenario.id === 'baseline') &&
      scenarios.some(
        (scenario) =>
          scenario.id === manifest.defaultNegativeScenario &&
          scenario.id !== 'baseline'
      ),
    'missing registered scenario'
  )
  for (const key of [
    'testFile',
    'configFile',
    'architecturePath',
    'specPath'
  ]) {
    requireCondition(
      nonempty(manifest[key]) &&
        !path.isAbsolute(manifest[key]) &&
        !manifest[key].split('/').includes('..'),
      'invalid ' + key
    )
  }
  return freeze({
    version: manifest.version,
    definition: structuredClone(manifest),
    architectureDefinition: structuredClone(architecture),
    mappingVersion: digest(manifest),
    architectureVersion: digest(architecture),
    scenarios,
    defaultNegativeScenario: manifest.defaultNegativeScenario,
    negativeCaseIds: [...manifest.negativeCaseIds],
    targetId: manifest.targetId,
    manifestPath: MANIFEST_PATH,
    architecturePath: manifest.architecturePath,
    specPath: manifest.specPath,
    testFile: manifest.testFile,
    configFile: manifest.configFile,
    digest: digest({ manifest, architecture }),
    flows,
    cases
  })
}

function mappingDiff(accepted, candidate) {
  requireCondition(
    accepted.architectureVersion === candidate.architectureVersion,
    'mapping review cannot change architecture'
  )
  const withoutTestNames = (contract) => {
    const definition = structuredClone(contract.definition)
    for (const flow of definition.flows)
      for (const item of flow.cases) delete item.testName
    return definition
  }
  requireCondition(
    digest(withoutTestNames(accepted)) === digest(withoutTestNames(candidate)),
    'mapping review permits only test-name changes'
  )
  return candidate.cases.flatMap((item) => {
    const before = accepted.cases.find((value) => value.id === item.id).testName
    return before === item.testName
      ? []
      : [
          {
            caseId: item.id,
            flowId: item.flowId,
            stepId: item.stepId,
            before,
            after: item.testName
          }
        ]
  })
}

function loadContract(repositoryRoot, acceptedDefinition) {
  const manifest =
    acceptedDefinition ??
    JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, MANIFEST_PATH), 'utf8')
    )
  // This proof executes trusted repository-owned contracts, never uploaded code.
  const inspector = path.resolve(repositoryRoot, manifest.architecturePath)
  requireCondition(
    inspector.startsWith(repositoryRoot + path.sep),
    'architecture path escape'
  )
  Reflect.deleteProperty(require.cache, require.resolve(inspector))
  return admitContract(manifest, require(inspector))
}

module.exports = { admitContract, loadContract, mappingDiff, MANIFEST_PATH }
