import type { ArchitectureData } from '../architecture/types'

export interface Criterion {
  id: string
  title: string
  kind: string
  binding: string
  satisfied: boolean
}

export interface Note {
  id: string
  nodeId: string
  actor: string
  text: string
}

export interface TaskNode {
  id: string
  title: string
  status: string
  criteria: Criterion[]
  context: {
    revision: number
    actions: {
      id: string
      kind: string
      label: string
      instructions?: string
    }[]
    errors: { status: string; summary: string }[]
    blockers: string[]
    warnings: { summary: string }[]
    specRefs: string[]
    implementationRefs: string[]
    notes: Note[]
  }
}

export interface FlowSnapshot {
  evaluation: {
    flows: {
      id: string
      title: string
      status: string
      nodes: TaskNode[]
      integration: TaskNode
    }[]
  }
  views: Record<string, ArchitectureData>
}

export interface ActionPreview {
  argv: string[]
  [key: string]: unknown
}
