import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { AiActionNames } from '../src/constants/ai-actions'
import type {
  AiActionBatch,
  AiProviderInput,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
import type { createLocalImageTools } from './local-image-tools'

const maximumInspectionCount = 6

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Tool-specific preparation stays on the server; only canonical receipts return to the model. */
export const createLocalOperationTools = (
  actions: AiProviderInput['actions'],
  images: ReturnType<typeof createLocalImageTools>,
  executeBatch: (batch: AiActionBatch) => Promise<AiBatchReceipt>,
  options: {
    reviewTargetId?: string
    onInspection?: (status: 'running' | 'completed') => void
  } = {}
) => {
  const allowed = new Set<string>(Object.values(AiActionNames))
  const registered = images
    .modelActions(actions)
    .filter(
      (action) =>
        allowed.has(action.name) &&
        ![
          AiActionNames.REPORT_OUTCOME,
          AiActionNames.REQUEST_CLARIFICATION,
          AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE
        ].includes(action.name as never)
    )
  let reviewTargetId = options.reviewTargetId
  let inspectionCount = 0
  let inspectionUnavailable = false
  const canInspect = registered.some(
    (action) => action.name === AiActionNames.INSPECT_DRAWING
  )
  const inspect = async (elementId: string) => {
    if (inspectionCount >= maximumInspectionCount)
      return {
        actionResults: [
          {
            actionId: randomUUID(),
            actionName: AiActionNames.INSPECT_DRAWING,
            result: {
              available: false,
              message:
                'The review limit has been reached. Explain remaining differences instead of making further changes.'
            }
          }
        ],
        context: {}
      } as AiBatchReceipt
    inspectionCount += 1
    options.onInspection?.('running')
    try {
      const receipt = await executeBatch({
        batchId: randomUUID(),
        actions: [
          {
            id: randomUUID(),
            name: AiActionNames.INSPECT_DRAWING,
            arguments: { elementId },
            summary: 'Reviewing the drawing'
          }
        ]
      })
      inspectionUnavailable = !receipt.actionResults.some(
        (entry) => isRecord(entry.result) && entry.result.available === true
      )
      return receipt
    } finally {
      options.onInspection?.('completed')
    }
  }
  return {
    settleOutcome: (batch: AiActionBatch): AiActionBatch => {
      if (
        canInspect &&
        batch.actions.some(
          (action) =>
            registered.some((definition) => definition.name === action.name) &&
            ![
              AiActionNames.SELECT_ELEMENTS,
              AiActionNames.INSPECT_DRAWING
            ].includes(action.name as never)
        )
      )
        throw new Error(
          'Final response cannot contain unreviewed drawing operations'
        )
      if (!inspectionUnavailable) return batch
      return {
        ...batch,
        actions: batch.actions.map((action) => {
          if (
            action.name !== AiActionNames.REPORT_OUTCOME ||
            !isRecord(action.arguments) ||
            action.arguments.outcome !== 'completed'
          )
            return action
          return {
            ...action,
            arguments: {
              outcome: 'unsupported',
              message:
                'This app could not complete visual review of the drawing.'
            }
          }
        })
      }
    },
    definitions: registered.map((action) => ({
      type: 'function',
      name: action.name,
      description: action.description,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['arguments'],
        properties: {
          arguments: action.inputSchema,
          message: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            description:
              'Optional: one short phrase only for a material user-relevant impact. Omit for routine operations; the App supplies status.'
          }
        }
      }
    })),
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      if (
        signal.aborted ||
        !registered.some((action) => action.name === name) ||
        !isRecord(args) ||
        !isRecord(args.arguments) ||
        (args.message !== undefined &&
          (typeof args.message !== 'string' ||
            !args.message.trim() ||
            args.message.length > 1000)) ||
        Object.keys(args).some((key) => !['arguments', 'message'].includes(key))
      )
        throw new Error('Invalid backend operation')
      if (name === AiActionNames.INSPECT_DRAWING) {
        if (typeof args.arguments.elementId !== 'string')
          throw new Error('Missing inspection target')
        reviewTargetId = args.arguments.elementId
        return JSON.stringify(await inspect(reviewTargetId))
      }
      if (
        canInspect &&
        inspectionCount >= maximumInspectionCount &&
        name !== AiActionNames.SELECT_ELEMENTS
      )
        return JSON.stringify({
          actionResults: [
            {
              actionName: name,
              result: {
                status: 'no-change',
                message:
                  'The visual review limit has been reached. No further changes were applied. Explain remaining limitations.'
              }
            }
          ],
          context: {}
        })
      const message =
        typeof args.message === 'string' ? args.message : 'Updating the drawing'
      const prepared = images.resolveBatch({
        batchId: randomUUID(),
        explanation: message,
        actions: [
          {
            id: randomUUID(),
            name,
            arguments: args.arguments,
            summary: message
          }
        ]
      }) as unknown as AiActionBatch
      const receipt = await executeBatch(prepared)
      if (signal.aborted) throw new Error('Backend operation cancelled')
      if (canInspect && name !== AiActionNames.SELECT_ELEMENTS) {
        for (const entry of receipt.actionResults) {
          if (
            isRecord(entry.result) &&
            typeof entry.result.compositionId === 'string'
          )
            reviewTargetId = entry.result.compositionId
        }
        if (!reviewTargetId) inspectionUnavailable = true
        if (reviewTargetId) {
          const inspection = await inspect(reviewTargetId)
          if (signal.aborted) throw new Error('Backend operation cancelled')
          return JSON.stringify({
            ...receipt,
            actionResults: [
              ...receipt.actionResults,
              ...inspection.actionResults
            ]
          })
        }
      }
      return JSON.stringify(receipt)
    }
  }
}

/** Native image payloads are separated from text; only actual bounded PNG receipts are admitted. */
export const localToolContent = (
  text: string
): (
  { type: 'inputText'; text: string } | { type: 'inputImage'; imageUrl: string }
)[] => {
  const value = JSON.parse(text)
  const images: { type: 'inputImage'; imageUrl: string }[] = []
  if (isRecord(value) && Array.isArray(value.actionResults)) {
    for (const entry of value.actionResults) {
      if (
        !isRecord(entry) ||
        entry.actionName !== AiActionNames.INSPECT_DRAWING ||
        !isRecord(entry.result) ||
        entry.result.available !== true
      )
        continue
      const snapshot = entry.result.image
      if (
        !isRecord(snapshot) ||
        typeof snapshot.dataUrl !== 'string' ||
        snapshot.dataUrl.length > 8 * 1024 * 1024 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(snapshot.dataUrl)
      )
        throw new Error('Invalid drawing snapshot')
      const bytes = Buffer.from(
        snapshot.dataUrl.slice('data:image/png;base64,'.length),
        'base64'
      )
      if (
        bytes.length < 24 ||
        !bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.readUInt32BE(16) !== snapshot.width ||
        bytes.readUInt32BE(20) !== snapshot.height ||
        Number(snapshot.width) < 1 ||
        Number(snapshot.height) < 1 ||
        Number(snapshot.width) > 1024 ||
        Number(snapshot.height) > 1024
      )
        throw new Error('Invalid drawing snapshot dimensions')
      images.push({ type: 'inputImage', imageUrl: snapshot.dataUrl })
      const { dataUrl: _dataUrl, ...metadata } = snapshot
      entry.result = { ...entry.result, image: metadata }
    }
  }
  return [{ type: 'inputText', text: JSON.stringify(value) }, ...images]
}
