import { Buffer } from 'node:buffer'
import process from 'node:process'
import { createServer } from 'node:http'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import {
  createNativeProviderConfig,
  createNativeRpcTransport
} from '@asyra/ai-agent-runtime/node'

/** Real pinned native client and offline model endpoint; no product host is mocked here. */
export async function nativeSessionFixture(steps) {
  const executable = process.env.NATIVE_DELIVERY_CODEX

  if (
    !executable ||
    execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim() !==
      'codex-cli 0.160.0'
  ) {
    throw Error('The pinned NATIVE_DELIVERY_CODEX is required')
  }

  const root = resolve(import.meta.dirname, '../../../../..')

  await mkdir(join(root, 'tmp'), { recursive: true })
  const directory = await mkdtemp(join(root, 'tmp/native-session-'))
  const home = join(directory, 'home')

  await mkdir(home)
  const requests = []
  const connections = []
  const server = createServer(async (request, response) => {
    const chunks = []

    for await (const chunk of request) {
      chunks.push(chunk)
    }

    const body = JSON.parse(Buffer.concat(chunks).toString())
    const index = requests.push(body) - 1

    response.writeHead(200, { 'content-type': 'text/event-stream' })

    const event = (type, values) =>
      response.write(
        `event: ${type}\ndata: ${JSON.stringify({ type, ...values })}\n\n`
      )

    const base = {
      id: `response-${index}`,
      object: 'response',
      status: 'in_progress',
      output: []
    }

    event('response.created', { response: base })
    const step = steps[index]

    if (step === 'wait') {
      return
    }

    const item = typeof step === 'function' ? step(body) : step

    if (!item) {
      response.destroy(Error('Unexpected model request'))

      return
    }

    event('response.output_item.added', { output_index: 0, item })
    event('response.output_item.done', { output_index: 0, item })
    event('response.completed', {
      response: {
        ...base,
        status: 'completed',
        output: [item],
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
      }
    })
    response.end()
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const config = await createNativeProviderConfig({
    executable,
    model: 'gpt-6-astra',
    directory
  })
  const settings = {
    model_provider: 'offline',
    project_doc_max_bytes: 0,
    'model_providers.offline.name': 'Offline',
    'model_providers.offline.base_url': `http://127.0.0.1:${server.address().port}/v1`,
    'model_providers.offline.wire_api': 'responses',
    'model_providers.offline.requires_openai_auth': false,
    'model_providers.offline.supports_websockets': false,
    'model_providers.offline.request_max_retries': 0,
    'model_providers.offline.stream_max_retries': 0,
    'features.shell_tool': false,
    'features.unified_exec': false,
    'features.multi_agent': false,
    'features.hooks': false,
    'features.memories': false,
    web_search: 'disabled'
  }

  const connect = async () => {
    const child = spawn(
      executable,
      [
        'app-server',
        '--listen',
        'stdio://',
        ...config.arguments,
        ...Object.entries(settings).flatMap(([k, v]) => [
          '-c',
          `${k}=${JSON.stringify(v)}`
        ])
      ],
      {
        cwd: directory,
        env: {
          PATH: process.env.PATH,
          CODEX_HOME: home,
          HOME: home,
          TMPDIR: directory
        },
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
    let stopped = false
    let terminal
    const packets = []
    const waits = new Set()
    let onPacket
    const closed = new Promise((resolve) => child.once('close', resolve))
    const transport = createNativeRpcTransport({
      child,
      maximumFrameBytes: 32 * 1024 * 1024,

      receive(packet) {
        packets.push(packet)
        if (packet.id !== undefined && !packet.method) {
          transport.receiveResponse(packet)
        } else {
          onPacket?.(packet)
        }

        for (const check of waits) {
          check()
        }
      },

      fail(error) {
        terminal = error
        for (const check of waits) {
          check()
        }
      },

      error: (kind) => Error(kind),

      rpcError: (value) => Error(JSON.stringify(value)),

      isStopped: () => stopped,

      isRetained: () => true,

      isComplete: () => false,

      closed() {
        /* The fixture awaits the child close event. */
      }
    })

    const waitFor = (predicate) =>
      new Promise((resolve, reject) => {
        const check = () => {
          const found = packets.find(predicate)

          if (terminal || found) {
            waits.delete(check)
            if (terminal) {
              reject(terminal)
            } else {
              resolve(found)
            }
          }
        }

        waits.add(check)
        check()
      })

    const connection = {
      transport,
      packets,
      waitFor,

      listen(listener) {
        onPacket = listener
      },

      async dispose() {
        if (!stopped) {
          stopped = true
          child.kill('SIGTERM')
        }

        await closed
      }
    }

    connections.push(connection)
    await transport.request('initialize', {
      clientInfo: { name: 'inventory-session-test', version: '1' },
      capabilities: { experimentalApi: true }
    })
    transport.write(JSON.stringify({ method: 'initialized' }) + '\n')

    return connection
  }

  return {
    directory,
    requests,
    connect,
    nativeOptions: {
      executable,
      model: 'gpt-6-astra',
      directory,
      configuration: settings,
      cwd: directory,
      environment: {
        PATH: process.env.PATH,
        CODEX_HOME: home,
        HOME: home,
        TMPDIR: directory
      }
    },

    async dispose() {
      await Promise.all(connections.map((c) => c.dispose()))
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
      await config.dispose()
    }
  }
}

export const nativeMessage = (text) => ({
  type: 'message',
  id: 'answer-' + text,
  role: 'assistant',
  status: 'completed',
  content: [{ type: 'output_text', text, annotations: [] }]
})

export const nativeCall = (id, args) => ({
  type: 'function_call',
  id,
  call_id: id,
  namespace: 'inventory',
  name: 'reserve',
  arguments: JSON.stringify(args)
})

export const inventoryTools = [
  {
    type: 'namespace',
    name: 'inventory',
    description: 'Inventory operations',
    tools: [
      {
        type: 'function',
        name: 'reserve',
        description: 'Reserve a quantity',
        inputSchema: {
          type: 'object',
          properties: { quantity: { type: 'integer', minimum: 1 } },
          required: ['quantity'],
          additionalProperties: false
        }
      }
    ]
  }
]
export const nativeThreadInput = {
  model: 'gpt-6-astra',
  modelProvider: 'offline',
  ephemeral: false,
  environments: [],
  runtimeWorkspaceRoots: [],
  selectedCapabilityRoots: [],
  approvalPolicy: 'never',
  sandbox: 'read-only',
  baseInstructions: 'Use only the provided inventory tools.',
  developerInstructions: 'Return the supplied answer.',
  dynamicTools: inventoryTools
}

export const nativeTurnInput = (threadId, text) => ({
  threadId,
  input: [{ type: 'text', text, text_elements: [] }]
})
