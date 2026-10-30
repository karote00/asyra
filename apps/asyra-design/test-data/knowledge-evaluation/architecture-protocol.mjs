import { qualityScenario } from './quality.mjs'

export const architectureFiles = [
  'domain-knowledge/illustration.architecture.md',
  'apps/asyra-design/knowledge/design.architectural-illustration.md'
]

export function architectureScenario(specification) {
  if (
    specification.id !== 'taipei-101' ||
    specification.deadlineMs !== 900000
  ) {
    throw new Error('Only Taipei 101 with a 900000 ms hard deadline is allowed')
  }
  if (
    JSON.stringify(specification.modules) !==
      JSON.stringify(['design.architectural-illustration']) ||
    JSON.stringify(specification.contexts) !==
      JSON.stringify(['architectural-illustration'])
  ) {
    throw new Error('The comparison must use the frozen architectural content')
  }
  return qualityScenario(
    {
      deadlineMs: specification.deadlineMs,
      commonInstruction: specification.commonInstruction,
      development: [specification],
      transfer: []
    },
    specification.id
  )
}

export function observationDeadline(specification, args) {
  if (!args.length) {
    return specification.deadlineMs
  }
  if (args.length !== 1 || !/^--deadline-ms=[1-9][0-9]*$/.test(args[0])) {
    throw new Error('Expected one positive integer --deadline-ms override')
  }
  const limit = Number(args[0].slice('--deadline-ms='.length))
  if (!Number.isSafeInteger(limit) || limit > specification.deadlineMs) {
    throw new Error('Observation deadline cannot extend the scenario deadline')
  }
  return limit
}

/** Explicit opt-in; ordinary observation commands retain the production budget. */
export function evaluationArtifactBudget(args) {
  const overrides = args.filter((value) =>
    value.startsWith('--expanded-node-limit')
  )
  if (overrides.length === 0) {
    return undefined
  }
  if (overrides.length !== 1 || overrides[0] !== '--expanded-node-limit=2000') {
    throw new Error(
      'Only the explicit test expanded-node-limit=2000 override is supported'
    )
  }
  return 2000
}
