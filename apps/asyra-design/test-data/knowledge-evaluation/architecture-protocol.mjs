import { qualityScenario } from './quality.mjs'

export const architectureFiles = [
  'domain-knowledge/illustration.architecture.md',
  'apps/asyra-design/knowledge/design.architectural-illustration.md'
]

export function architectureScenario(specification) {
  if (specification.id !== 'taipei-101' || specification.deadlineMs !== 600000)
    throw new Error('Only Taipei 101 with a 600000 ms hard deadline is allowed')
  if (
    JSON.stringify(specification.modules) !==
      JSON.stringify(['design.architectural-illustration']) ||
    JSON.stringify(specification.contexts) !==
      JSON.stringify(['architectural-illustration'])
  )
    throw new Error('The comparison must use the frozen architectural content')
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
