/** Passive advice. No field grants invocation, instruction or mutation authority. */
export interface AiKnowledgeMetadata {
  readonly id: string
  readonly revision: number
  readonly description: string
  readonly provenance: readonly string[]
  readonly contexts?: readonly string[]
  /** Optional navigation only; never an automatic content dependency. */
  readonly children?: readonly string[]
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

export interface AiKnowledgeContent {
  readonly revision: number
  readonly text: string
  readonly overrides?: readonly {
    readonly target: string
    readonly text: string
  }[]
}

export interface AiKnowledgeQuery {
  /** Re-read advice after earlier results are absent from effective context. */
  readonly rehydrate?: boolean
  /** Complete earlier results explicitly still held by this caller. */
  readonly reuseFrom?: readonly string[]
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
  readonly documents: readonly ({
    readonly target: string
    readonly source: AiKnowledgeSource
    readonly replacedSource?: AiKnowledgeSource
  } & (
    | { readonly text: string; readonly retainedFrom?: never }
    | { readonly text?: never; readonly retainedFrom: string }
  ))[]
  readonly sources: readonly AiKnowledgeSource[]
}

export interface AiKnowledgeSession {
  /** Host notification that retained tool results were dropped or reconstructed. */
  invalidateContext(): void
  /** Optional roots select registered visible children, never content dependencies. */
  discover(
    contexts?: readonly string[],
    ids?: readonly string[]
  ): readonly AiKnowledgeMetadata[]
  retrieve(
    query: AiKnowledgeQuery,
    signal: AbortSignal
  ): Promise<AiKnowledgeResult>
  dispose(): void
}

export interface AiKnowledgeOptions {
  readonly tenantId: string
  readonly scopeId: string
  /** Trusted host policy; checked on both old/new update metadata, reuse and after reads. */
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
  ) => Promise<AiKnowledgeContent>
}
