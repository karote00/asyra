export interface ReferenceLink {
  id?: string
  kind?: string
  label: string
  href: string
}

export interface ArchitectureStep {
  id: string
  order: number
  laneId: string
  title: string
  ownerPackage: string
  purpose: string
  inputs: string[]
  outputs: string[]
  conditions: string[]
  bypasses: string[]
  allowedContributors: string[]
  forbiddenContributors: string[]
  cacheDimensions: string[]
  implementationBoundary: string[]
  specRefs: string[]
  failureOwnerStepId: string
  tags?: string[]
}

export interface ArchitectureRoute {
  id: string
  from: string
  to?: string
  kind: string
  predicate: string
  producedArtifacts: string[]
}

export interface ArchitectureData {
  schema: { id: string; version: number }
  target: { id: string; kind: string; title: string; subtitle: string }
  authority: { specPath: string; inspectorPath: string }
  links: ReferenceLink[]
  lanes: { id: string; title: string; order?: number }[]
  steps: ArchitectureStep[]
  routes: ArchitectureRoute[]
  artifacts: {
    id: string
    ownerStepId: string
    consumerStepIds: string[]
    channel: string
    terminal?: boolean
  }[]
  invariants: {
    id: string
    stepIds: string[]
    statement?: string
    assertion?: string
    title?: string
    artifactIds?: string[]
    specRefs?: string[]
  }[]
  acceptanceContracts: {
    id: string
    stepIds: string[]
    assertions: string[]
    specRefs: string[]
  }[]
}
