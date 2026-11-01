/* global requestAnimationFrame */
import { AI_BATCH_RECEIPT_HEADER } from '../../src/ai/action-batch-endpoint.ts'
import { setTimeout } from 'node:timers'
import { URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const TAIPEI_101_PROMPT_SHA256 =
  '25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51'
export const TAIPEI_101_DEADLINE_MS = 10 * 60 * 1000
export const readTaipei101Prompt = () => {
  const bytes = readFileSync(
    new URL('./taipei-101-full-building-prompt.txt', import.meta.url)
  )
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== TAIPEI_101_PROMPT_SHA256)
    throw new Error('The user-approved fixed prompt has changed.')
  const text = bytes.toString('utf8')
  return {
    prompt: text.endsWith('\n') ? text.slice(0, -1) : text,
    sha256
  }
}
export const assertTaipei101Submission = (request, prompt, headers = {}) => {
  if (Object.hasOwn(headers, AI_BATCH_RECEIPT_HEADER)) return false
  if (
    request.intent !== prompt ||
    request.metadata?.imageAttachments?.length ||
    request.metadata?.conversationContext?.turns?.length
  )
    throw new Error(
      'The fixed benchmark requires the exact prompt in a fresh conversation without attachments.'
    )
  return true
}

/** A connected transport alone does not prove bootstrap application. */
export const recordedDocumentReady = (state, expectedCount) =>
  state.connected && !!state.workspaceId && state.elementCount === expectedCount

export const waitForRecordedDocument = async (page, expectedCount) => {
  const until = Date.now() + 60000
  while (Date.now() < until) {
    const state = await page.evaluate(async () => {
      const { core, getActiveCollaborationHandle } =
        await import('/src/testing/runtime-access.ts')
      return {
        connected: getActiveCollaborationHandle()?.getStatus() === 'connected',
        workspaceId: core.getCurrentWorkspaceId(),
        elementCount: core.deps.sceneTree.getAllElements().size
      }
    })
    if (recordedDocumentReady(state, expectedCount)) {
      await page.evaluate(async () => {
        const { getActiveCollaborationHandle } =
          await import('/src/testing/runtime-access.ts')
        await getActiveCollaborationHandle()?.whenIdle()
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        )
      })
      return state
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(
    'The recorded document did not finish loading within 60 seconds.'
  )
}
