/** Passive advice. No field grants invocation, instruction or mutation authority. */
export interface AiKnowledgeMetadata {
  readonly id: string
  readonly revision: number
  readonly description: string
  readonly provenance: readonly string[]
  readonly contexts?: readonly string[]
  readonly references?: readonly string[]
  readonly extends?: readonly string[]
  readonly overrides?: readonly {
    readonly target: string
    readonly priority: number
  }[]
}

export interface AiKnowledgeIdentity {
  readonly tenantId: string
  readonly scopeId: string
  readonly taskId?: string
  readonly principal: unknown
}

export type AiKnowledgeOperation =
  'register' | 'update' | 'unregister' | 'discover' | 'read'

export interface AiKnowledgeQuery {
  readonly ids: readonly string[]
  readonly contexts?: readonly string[]
}

export interface AiKnowledgeSource {
  readonly id: string
  readonly revision: number
  readonly provenance: readonly string[]
}

export interface AiKnowledgeResult {
  readonly trust: 'untrusted-advice'
  readonly generation: number
  readonly contextKey: string
  readonly alreadyDelivered: boolean
  readonly documents: readonly {
    readonly target: string
    readonly source: AiKnowledgeSource
    readonly replacedSource?: AiKnowledgeSource
    readonly text: string
  }[]
  readonly sources: readonly AiKnowledgeSource[]
}

export interface AiKnowledgeSession {
  discover(contexts?: readonly string[]): readonly AiKnowledgeMetadata[]
  retrieve(
    query: AiKnowledgeQuery,
    signal: AbortSignal
  ): Promise<AiKnowledgeResult>
  dispose(): void
}

export interface AiKnowledgeOptions {
  readonly tenantId: string
  readonly scopeId: string
  /** Trusted host policy; called again on reuse and after asynchronous reads. */
  readonly authorize: (
    operation: AiKnowledgeOperation,
    identity: AiKnowledgeIdentity,
    metadata?: AiKnowledgeMetadata
  ) => boolean
  /** App owns content retrieval/cache; Runtime never reads or writes files. */
  readonly read: (
    metadata: AiKnowledgeMetadata,
    identity: AiKnowledgeIdentity,
    signal: AbortSignal
  ) => Promise<{ readonly revision: number; readonly text: string }>
}
