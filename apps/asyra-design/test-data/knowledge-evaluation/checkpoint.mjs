/* global fetch */
import fs from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { boundedCapture } from './capture-lifecycle.mjs'

/** Post-run evidence export through the existing document backend read route. */
export async function captureCheckpoint({
  url,
  filename,
  receipt,
  request = fetch,
  timeoutMs = 30000
}) {
  return boundedCapture(
    'checkpoint',
    async (signal) => {
      const response = await request(url, { signal })
      signal.throwIfAborted()
      if (!response.ok || !response.body) {
        throw new Error(`Checkpoint capture HTTP ${response.status}`)
      }
      await pipeline(
        Readable.fromWeb(response.body),
        fs.createWriteStream(filename, {
          fd: fs.openSync(filename, 'wx'),
          autoClose: true
        }),
        { signal }
      )
      const checkpoint = JSON.parse(fs.readFileSync(filename, 'utf8'))
      if (
        checkpoint.documentGeneration !== receipt.documentGeneration ||
        checkpoint.durableSequence !== receipt.durableSequence ||
        receipt.sequence !== receipt.durableSequence
      ) {
        throw new Error('Checkpoint does not match the persistence receipt')
      }
      if (
        !checkpoint.checkpoint?.sceneTree ||
        !checkpoint.checkpoint?.props ||
        typeof checkpoint.checkpoint.version !== 'string'
      ) {
        throw new Error('Checkpoint has no canonical document')
      }
      return {
        bytes: fs.statSync(filename).size,
        documentGeneration: checkpoint.documentGeneration,
        durableSequence: checkpoint.durableSequence
      }
    },
    timeoutMs
  )
}
