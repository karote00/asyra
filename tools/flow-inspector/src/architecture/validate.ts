import type { ArchitectureData } from './types'

const collections = [
  'links',
  'lanes',
  'steps',
  'routes',
  'artifacts',
  'invariants',
  'acceptanceContracts'
] as const
const stepLists = [
  'inputs',
  'outputs',
  'conditions',
  'bypasses',
  'allowedContributors',
  'forbiddenContributors',
  'cacheDimensions',
  'implementationBoundary',
  'specRefs'
] as const

export function validateArchitecture(data: ArchitectureData): string[] {
  const errors: string[] = []

  if (
    !data ||
    data.schema?.id !== 'flow-inspector' ||
    data.schema.version !== 2
  ) {
    return ['schema:expected-flow-inspector-v2']
  }

  for (const name of collections) {
    if (!Array.isArray(data[name])) {
      errors.push(`${name}:expected-array`)
    }
  }

  if (errors.length) {
    return errors
  }

  if (
    !data.target?.id ||
    !data.target.kind ||
    !data.target.title ||
    !data.authority?.specPath
  ) {
    errors.push('target:incomplete')
  }

  for (const name of collections) {
    if (name === 'links') {
      continue
    }

    const seen = new Set<string>()

    for (const item of data[name]) {
      if (!item || typeof item.id !== 'string' || seen.has(item.id)) {
        errors.push(`${name}:invalid-or-duplicate-id`)
      } else {
        seen.add(item.id)
      }
    }
  }

  if (errors.length) {
    return errors
  }

  for (const step of data.steps) {
    for (const field of stepLists) {
      if (!Array.isArray(step[field])) {
        errors.push(`${step.id}:missing:${field}`)
      }
    }
  }

  for (const route of data.routes) {
    if (!Array.isArray(route.producedArtifacts)) {
      errors.push(`${route.id}:producedArtifacts`)
    }
  }

  for (const artifact of data.artifacts) {
    if (!Array.isArray(artifact.consumerStepIds)) {
      errors.push(`${artifact.id}:consumerStepIds`)
    }
  }

  if (errors.length) {
    return errors
  }

  const steps = new Map(data.steps.map((step) => [step.id, step]))
  const lanes = new Set(data.lanes.map((lane) => lane.id))
  const artifacts = new Map(
    data.artifacts.map((artifact) => [artifact.id, artifact])
  )

  for (const step of data.steps) {
    if (!lanes.has(step.laneId)) {
      errors.push(`${step.id}:lane`)
    }

    if (!steps.has(step.failureOwnerStepId)) {
      errors.push(`${step.id}:failureOwnerStepId`)
    }

    for (const input of step.inputs) {
      if (
        typeof input === 'string' &&
        input.startsWith('artifact:') &&
        !artifacts.has(input)
      ) {
        errors.push(`${step.id}:input:${input}`)
      }
    }

    for (const output of step.outputs) {
      if (!artifacts.has(output)) {
        errors.push(`${step.id}:output:${output}`)
      }
    }
  }

  for (const route of data.routes) {
    if (!steps.has(route.from) || (route.to && !steps.has(route.to))) {
      errors.push(`${route.id}:endpoint`)
    }

    for (const id of route.producedArtifacts) {
      const artifact = artifacts.get(id)

      if (!artifact || artifact.ownerStepId !== route.from) {
        errors.push(`${route.id}:artifact-owner:${id}`)
      }

      if (
        artifact &&
        route.to &&
        !artifact.consumerStepIds.includes(route.to)
      ) {
        errors.push(`${route.id}:artifact-consumer:${id}`)
      }
    }
  }

  for (const artifact of data.artifacts) {
    if (!steps.get(artifact.ownerStepId)?.outputs.includes(artifact.id)) {
      errors.push(`${artifact.id}:owner-output`)
    }

    for (const id of artifact.consumerStepIds) {
      if (!steps.get(id)?.inputs.includes(artifact.id)) {
        errors.push(`${artifact.id}:consumer-input:${id}`)
      }
    }

    if (!artifact.terminal && !artifact.consumerStepIds.length) {
      errors.push(`${artifact.id}:missing-consumer`)
    }
  }

  for (const contract of [...data.invariants, ...data.acceptanceContracts]) {
    if (
      !Array.isArray(contract.stepIds) ||
      contract.stepIds.some((id) => !steps.has(id))
    ) {
      errors.push(`${contract.id}:step-reference`)
    }
  }

  return errors
}
