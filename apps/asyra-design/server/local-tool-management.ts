import type { IncomingMessage, ServerResponse } from 'node:http'
import { createAiToolStoreManagement } from '@asyra/ai-agent-runtime'
import {
  ToolLibraryManagement,
  isToolLibraryRequest
} from '../src/ai/tool-library-management'
import { admitsLocalProviderRequest } from './local-request-admission'
import {
  createLocalToolStore,
  DEFAULT_TOOL_LIBRARY_DIRECTORY
} from './local-tool-store'
import { LocalToolLibraryLimits } from './local-tool-library-limits'

/** Local user controls delegate to Runtime; they never invoke the model or canvas. */
export const createToolLibraryManagementMiddleware =
  (
    options: {
      open?: () => ReturnType<typeof createLocalToolStore>
    } = {}
  ) =>
  async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void
  ): Promise<void> => {
    if (
      new URL(request.url ?? '/', 'http://app.local').pathname !==
      ToolLibraryManagement.endpoint
    ) {
      next()
      return
    }
    const send = (status: number, value: unknown) => {
      response.statusCode = status
      response.setHeader('content-type', 'application/json')
      response.setHeader('cache-control', 'no-store')
      response.end(JSON.stringify(value))
    }
    if (request.method !== 'POST' || !admitsLocalProviderRequest(request)) {
      send(403, { issue: 'Saved tools require a local same-origin request.' })
      return
    }
    let value: unknown
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of request) {
        const bytes = Buffer.from(chunk)
        size += bytes.byteLength
        if (size > ToolLibraryManagement.requestBytes) {
          throw new Error('Oversized request')
        }
        chunks.push(bytes)
      }
      value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      send(400, { issue: 'Invalid saved tool request.' })
      return
    }
    if (!isToolLibraryRequest(value)) {
      send(400, { issue: 'Invalid saved tool request.' })
      return
    }
    let store: Awaited<ReturnType<typeof createLocalToolStore>> | undefined
    try {
      store = await (
        options.open ??
        (() =>
          createLocalToolStore({
            directory:
              process.env.AI_TOOL_LIBRARY_DIR?.trim() ||
              DEFAULT_TOOL_LIBRARY_DIRECTORY,
            capacity: LocalToolLibraryLimits.entries,
            recordBytes: LocalToolLibraryLimits.recordBytes,
            totalBytes: LocalToolLibraryLimits.totalBytes
          }))
      )()
      const management = createAiToolStoreManagement({
        store,
        capacity: LocalToolLibraryLimits.entries
      })
      if (value.operation === 'list') {
        send(200, await management.list())
      } else {
        const result = await management.setState({
          name: value.name,
          revision: value.revision,
          expectedVersion: value.expectedVersion,
          availability: value.operation === 'remove' ? 'retired' : 'suspended'
        })
        send(result.status === 'saved' ? 200 : 409, result)
      }
    } catch {
      send(503, { issue: 'Saved tools are unavailable. Refresh to retry.' })
    } finally {
      try {
        await store?.close()
      } catch (error) {
        console.error('Saved tool store cleanup failed', error)
      }
    }
  }
