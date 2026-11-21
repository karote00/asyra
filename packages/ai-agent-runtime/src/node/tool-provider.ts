import type { TokenUsage } from '../profiler/recorder.js'
import type { AiActionBatch, AiProvider, AiProviderInput } from '../provider.js'
import type { ProviderContentItem } from './provider-content.js'

export interface ProviderToolGroup {
  readonly name: string
  readonly description: string
  readonly tools: readonly {
    readonly name: string
    readonly description: string
    readonly inputSchema: Readonly<Record<string, unknown>>
    readonly deferLoading?: boolean
  }[]
}
export interface ToolProviderBinding {
  readonly instructions: string
  readonly tools: readonly ProviderToolGroup[]
  readonly webSearch?: boolean
  input(resumed: boolean): readonly ProviderContentItem[]
  invoke(call: {
    namespace: string
    name: string
    callId: string
    arguments: unknown
  }): Promise<{ readonly contentItems: readonly ProviderContentItem[] }>
  decode(result: {
    readonly id: string
    readonly text: string
  }): AiActionBatch | Promise<AiActionBatch>
  observe?(event: {
    readonly direction: 'request' | 'response'
    readonly value: unknown
    readonly usage?: { readonly total: TokenUsage }
  }): void
  dispose?(): void | Promise<void>
}

export type PrepareToolProvider = (
  input: AiProviderInput,
  context: Parameters<AiProvider['requestActionBatch']>[1]
) => Promise<ToolProviderBinding>
