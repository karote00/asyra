import type {
  AiStoredToolSummary,
  createAiToolStoreManagement
} from '@asyra/ai-agent-runtime'

/** One transport contract for the local saved-tool control plane. */
export const ToolLibraryManagement = Object.freeze({
  endpoint: '/api/ai/tool-library',
  requestBytes: 4096
})
export type ToolLibraryInventory = Awaited<
  ReturnType<ReturnType<typeof createAiToolStoreManagement>['list']>
>
export type ToolLibraryRequest =
  | { operation: 'list' }
  | {
      operation: 'suspend' | 'remove'
      name: string
      revision: number
      expectedVersion: string
    }
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const availability = (value: unknown) =>
  ['candidate', 'eligible', 'suspended', 'retired'].includes(value as string)
export const isToolLibraryRequest = (
  value: unknown
): value is ToolLibraryRequest =>
  record(value) &&
  (value.operation === 'list'
    ? Object.keys(value).length === 1
    : (value.operation === 'suspend' || value.operation === 'remove') &&
      Object.keys(value).sort().join(',') ===
        'expectedVersion,name,operation,revision' &&
      text(value.name) &&
      text(value.expectedVersion) &&
      Number.isSafeInteger(value.revision) &&
      (value.revision as number) > 0)
const summary = (value: unknown): value is AiStoredToolSummary =>
  record(value) &&
  text(value.name) &&
  text(value.description) &&
  Number.isSafeInteger(value.revision) &&
  (value.revision as number) > 0 &&
  text(value.version) &&
  availability(value.availability)
const post = async (
  input: ToolLibraryRequest,
  signal: AbortSignal
): Promise<unknown> => {
  const response = await fetch(ToolLibraryManagement.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal
  })
  const value: unknown = await response.json()
  if (!response.ok)
    throw new Error(
      record(value) && text(value.issue)
        ? value.issue
        : 'Saved tools are unavailable. Refresh to retry.'
    )
  return value
}
export const readToolLibrary = async (
  signal: AbortSignal
): Promise<ToolLibraryInventory> => {
  const value = await post({ operation: 'list' }, signal)
  if (
    !record(value) ||
    !Array.isArray(value.entries) ||
    !value.entries.every(summary) ||
    !Array.isArray(value.unavailable) ||
    !value.unavailable.every(
      (item) =>
        record(item) && typeof item.key === 'string' && text(item.reason)
    ) ||
    typeof value.truncated !== 'boolean'
  )
    throw new Error('Saved tool inventory was invalid. Refresh to retry.')
  return value as unknown as ToolLibraryInventory
}
export const updateToolLibrary = async (
  input: Exclude<ToolLibraryRequest, { operation: 'list' }>,
  signal: AbortSignal
): Promise<void> => {
  const value = await post(input, signal)
  if (
    !record(value) ||
    value.status !== 'saved' ||
    !text(value.version) ||
    value.availability !==
      (input.operation === 'remove' ? 'retired' : 'suspended')
  )
    throw new Error(
      'The saved tool change was not acknowledged. Refresh before retrying.'
    )
}
