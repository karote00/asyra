import { createNativeProviderConfig } from '../../server/native-provider-config.ts'
import { setTimeout } from 'node:timers'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import {
  readFile,
  mkdir,
  mkdtemp,
  writeFile,
  realpath,
  access,
  readdir
} from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { spawn, execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath, URL } from 'node:url'
import { dirname, delimiter, join } from 'node:path'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import {
  createExecutionRecordSink,
  captureAiSourceIdentity
} from '@asyra/ai-agent-runtime/node'
import { createLiveTestDeadline } from '../ai-drawing/live-test-deadline.mjs'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const fixtureRoot = new URL('./fixtures/native-delivery/', import.meta.url)
const digest = (value) => createHash('sha256').update(value).digest('hex')
export async function loadFixtures() {
  const manifest = JSON.parse(
    await readFile(new URL('manifest.json', fixtureRoot), 'utf8')
  )
  return Promise.all(
    manifest.fixtures.map(async (fixture) => {
      const raw = await readFile(new URL(fixture.file, fixtureRoot), 'utf8')
      if (
        Buffer.byteLength(raw) !== fixture.bytes ||
        digest(raw) !== fixture.sha256
      )
        throw new Error('Fixture integrity mismatch')
      return { ...fixture, raw, nativeVersion: manifest.nativeVersion }
    })
  )
}

export function inspectSuccessor(request, callId, raw) {
  const output = request?.input?.find(
    (item) => item.type === 'function_call_output' && item.call_id === callId
  )?.output
  if (output === undefined) throw new Error('Missing successor tool output')
  if (
    typeof output !== 'string' &&
    (!Array.isArray(output) ||
      output.some(
        (item) =>
          !(
            (item.type === 'input_text' && typeof item.text === 'string') ||
            (item.type === 'input_image' && typeof item.image_url === 'string')
          )
      ))
  )
    throw new Error('Unsupported successor output')
  const text = typeof output === 'string' ? output : JSON.stringify(output)
  const blocks =
    typeof output === 'string'
      ? [output]
      : output
          .filter((item) => item.type === 'input_text')
          .map((item) => item.text)
  const images =
    typeof output === 'string'
      ? []
      : output
          .filter((item) => item.type === 'input_image')
          .map((item) => {
            const match =
              /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
                item.image_url
              )
            if (!match) throw new Error('Unsupported successor image')
            const bytes = Buffer.from(match[2], 'base64')
            return {
              mediaType: match[1],
              bytes: bytes.length,
              sha256: digest(bytes)
            }
          })
  const payload = blocks.find((block) => block.includes(raw.slice(0, 64))) || ''
  const content = payload.slice(payload.indexOf(raw.slice(0, 64)))
  const exact = blocks.includes(raw)
  const marker = exact ? null : /…(\d+) tokens truncated…/.exec(content)
  let omission = null
  if (marker) {
    const prefix = content.slice(0, marker.index)
    const suffix = content.slice(marker.index + marker[0].length)
    if (raw.startsWith(prefix) && raw.endsWith(suffix)) {
      const omitted = raw.slice(prefix.length, raw.length - suffix.length)
      omission = {
        startByte: Buffer.byteLength(prefix),
        endByte: Buffer.byteLength(raw) - Buffer.byteLength(suffix),
        bytes: Buffer.byteLength(omitted),
        sha256: digest(omitted),
        reportedTokens: Number(marker[1])
      }
    }
  }
  return {
    captured: true,
    exact,
    sourceBytes: Buffer.byteLength(raw),
    outputBytes: Buffer.byteLength(text),
    textBytes: Buffer.byteLength(blocks.join('\n')),
    sourceSHA256: digest(raw),
    outputSHA256: digest(text),
    containsSource: blocks.some((block) => block.includes(raw)),
    images,
    imageBytesInText: blocks.some((block) => block.includes('data:image/')),
    truncationMarker: Boolean(marker),
    omission
  }
}

// Fixed local responses exercise the native engine. They do not simulate native output.
function sendResponse(res, item, sequence) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache'
  })
  const response = {
    id: `resp_${sequence}`,
    object: 'response',
    status: 'in_progress',
    output: []
  }
  const event = (type, values) =>
    res.write(
      `event: ${type}\ndata: ${JSON.stringify({ type, ...values })}\n\n`
    )
  event('response.created', { response })
  event('response.output_item.added', { output_index: 0, item })
  event('response.output_item.done', { output_index: 0, item })
  event('response.completed', {
    response: {
      ...response,
      status: 'completed',
      output: [item],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
    }
  })
  res.end()
}

async function nativeIdentity(executable) {
  let launcher
  for (const path of executable.includes('/')
    ? [executable]
    : process.env.PATH.split(delimiter).map((directory) =>
        join(directory, executable)
      )) {
    try {
      await access(path)
      launcher = await realpath(path)
      break
    } catch {
      /* Search the next declared PATH entry. */
    }
  }
  if (!launcher) throw new Error('Native executable unavailable')
  let binary = launcher
  if (launcher.endsWith('.js')) {
    const require = createRequire(launcher)
    const packageFile = require.resolve(
      `@openai/codex-${process.platform}-${process.arch}/package.json`
    )
    const vendor = join(dirname(packageFile), 'vendor')
    const targets = await readdir(vendor)
    if (targets.length !== 1) throw new Error('Ambiguous native vendor target')
    binary = join(vendor, targets[0], 'bin', 'codex')
  }
  return { launcher, binary, binarySHA256: digest(await readFile(binary)) }
}

export async function runNativeDelivery({
  fixture,
  executions,
  outputProbe,
  inspectHistory = false,
  searches = []
}) {
  if (
    outputProbe &&
    (executions ||
      !['progressive', 'silent', 'interrupted'].includes(outputProbe))
  )
    throw new Error('Invalid unfinished output probe')
  if (
    executions &&
    (!Array.isArray(executions) ||
      !executions.length ||
      executions.length > 16 ||
      executions.some(
        (execution) =>
          typeof execution.expected !== 'string' || !execution.expected
      ))
  )
    throw new Error('Invalid scripted execution sequence')
  const executable = process.env.NATIVE_DELIVERY_CODEX || 'codex'
  const identity = await nativeIdentity(executable)
  const version = execFileSync(identity.binary, ['--version'], {
    encoding: 'utf8',
    timeout: 5000
  }).trim()
  if (version !== fixture.nativeVersion)
    throw new Error(`Native version mismatch: ${version}`)
  await mkdir(join(root, 'tmp'), { recursive: true })
  const directory = await mkdtemp(join(root, 'tmp/native-handoff-'))
  const nativeHome = join(directory, 'home')
  await mkdir(nativeHome)
  const id = randomUUID()
  const sink = createExecutionRecordSink(directory)
  sink.write({
    requestId: id,
    stage: 'native_handoff_start',
    version,
    sourceFixture: fixture.sha256,
    replySHA256: digest(fixture.raw),
    fixtureKind: fixture.kind || 'preserved'
  })
  const save = (phase, value) => {
    const receipt = sink.writePayload(id, fixture.tool, phase, value)
    sink.write({ requestId: id, stage: phase, receipt })
    return receipt
  }
  const source = await captureAiSourceIdentity({
    directory: root,
    paths: [
      'apps/asyra-design/test-data/knowledge-evaluation/native-delivery.mjs',
      'apps/asyra-design/server/local-information-delivery.ts',
      'apps/asyra-design/server/local-ai-provider.ts',
      'apps/asyra-design/server/__tests__/native-output-observation.integration.test.ts',
      'apps/asyra-design/server/local-knowledge.ts',
      'apps/asyra-design/server/local-operation-tools.ts',
      'apps/asyra-design/server/local-tool-invocation.ts',
      'apps/asyra-design/server/__tests__/information-delivery.integration.test.ts',
      'apps/asyra-design/server/__tests__/image-delivery.integration.test.ts',
      'packages/ai-agent-runtime/src/knowledge.ts',
      'apps/asyra-design/test-data/knowledge-evaluation/__tests__/native-delivery.test.mjs',
      'apps/asyra-design/test-data/knowledge-evaluation/fixtures/native-delivery',
      'packages/ai-agent-runtime/src/node',
      'apps/asyra-design/test-data/ai-drawing/live-test-deadline.mjs'
    ]
  })
  save('source', source)
  const requests = [],
    notifications = [],
    pending = new Map()
  let child,
    deadline,
    buffer = '',
    rpcId = 0,
    nativeReplyExact = false,
    failure,
    shuttingDown = false
  let complete, rejectComplete
  const completed = new Promise((resolve, reject) => {
    complete = resolve
    rejectComplete = reject
  })
  completed.catch(() => {
    /* Awaited after native startup; retain early failures. */
  })
  const fail = (error) => {
    failure = error
    rejectComplete(error)
  }
  const callId = 'native_delivery_call'
  const expectedRequests = executions
    ? executions.length + 1
    : searches.length + 2
  const nativeReplies = []
  let activeExecution = -1
  let probe
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== 'POST' || req.url !== '/v1/responses')
        throw new Error(`Unexpected local request: ${req.method} ${req.url}`)
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const raw = Buffer.concat(chunks).toString('utf8')
      const body = JSON.parse(raw)
      requests.push(body)
      // Store the actual wire body as text; no authentication headers are collected.
      save(`request-${requests.length}`, {
        wireBody: raw,
        sha256: digest(raw),
        bytes: Buffer.byteLength(raw)
      })
      if (requests.length === 1) {
        assert.equal(body.model, 'gpt-6-astra')
        assert.equal(body.reasoning.effort, 'medium')
      }
      if (requests.length <= searches.length) {
        const item = searches[requests.length - 1]
        save(`search-response-${requests.length}`, item)
        sendResponse(res, item, requests.length)
      } else if (executions && requests.length <= executions.length) {
        activeExecution = requests.length - 1
        const item = {
          type: 'function_call',
          id: `fc_script_${activeExecution}`,
          call_id: `${callId}_${activeExecution}`,
          name: fixture.tool,
          namespace: fixture.namespace,
          arguments: JSON.stringify(executions[activeExecution].input)
        }
        save(`scripted-response-${activeExecution}`, item)
        sendResponse(res, item, requests.length)
      } else if (requests.length === searches.length + 1) {
        const item = {
          type: 'function_call',
          id: 'fc_fixture',
          call_id: callId,
          name: fixture.tool,
          namespace: fixture.namespace,
          arguments: JSON.stringify(fixture.input)
        }
        save('scripted-response', item)
        if (outputProbe) {
          res.writeHead(200, { 'content-type': 'text/event-stream' })
          const event = (type, values) =>
            res.write(
              `event: ${type}\ndata: ${JSON.stringify({ type, ...values })}\n\n`
            )
          const response = {
            id: 'resp_probe',
            object: 'response',
            status: 'in_progress',
            output: []
          }
          const argumentsText = ' '.repeat(64000) + item.arguments
          event('response.created', { response })
          event('response.output_item.added', {
            output_index: 0,
            item: { ...item, arguments: '' }
          })
          let bytes = 0
          for (let index = 0; index < 4; index++) {
            if (outputProbe === 'progressive') {
              const delta = argumentsText.slice(
                index * 16000,
                (index + 1) * 16000
              )
              event('response.function_call_arguments.delta', {
                item_id: item.id,
                output_index: 0,
                delta
              })
              bytes += Buffer.byteLength(delta)
            }
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
          probe = {
            mode: outputProbe,
            emittedArgumentBytes: bytes,
            completed: false,
            publicItems: notifications
              .filter(
                (event) =>
                  event.method === 'item/started' ||
                  event.method === 'item/completed'
              )
              .map((event) => ({
                method: event.method,
                kind: event.params.item?.type,
                id: event.params.item?.id
              }))
          }
          save('unfinished-output-probe', probe)
          if (outputProbe === 'interrupted') {
            res.destroy()
            return
          }
          const delta = argumentsText.slice(
            outputProbe === 'progressive' ? 64000 : 0
          )
          event('response.function_call_arguments.delta', {
            item_id: item.id,
            output_index: 0,
            delta
          })
          event('response.function_call_arguments.done', {
            item_id: item.id,
            output_index: 0,
            arguments: argumentsText
          })
          event('response.output_item.done', {
            output_index: 0,
            item: { ...item, arguments: argumentsText }
          })
          event('response.completed', {
            response: {
              ...response,
              status: 'completed',
              output: [{ ...item, arguments: argumentsText }],
              usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
            }
          })
          res.end()
        } else sendResponse(res, item, requests.length)
      } else if (requests.length === expectedRequests) {
        sendResponse(
          res,
          {
            type: 'message',
            id: 'msg_complete',
            role: 'assistant',
            status: 'completed',
            content: [
              {
                type: 'output_text',
                text: 'Offline fixture complete.',
                annotations: []
              }
            ]
          },
          expectedRequests
        )
      } else throw new Error('Unexpected additional native request')
    } catch (error) {
      res.writeHead(500)
      res.end('Fixture rejected')
      fail(error)
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const isolation = {
    'features.shell_tool': false,
    'features.unified_exec': false,
    'features.apply_patch_freeform': false,
    'features.multi_agent': false,
    'features.multi_agent_v2': false,
    'features.hooks': false,
    'features.plugins': false,
    'features.apps': false,
    'features.memories': false,
    'features.shell_snapshot': false,
    'features.skill_mcp_dependency_install': false,
    'apps._default.enabled': false,
    notify: [],
    'analytics.enabled': false,
    'history.persistence': 'none',
    web_search: 'disabled',
    model_reasoning_effort: 'medium',
    model_provider: 'offline_fixture',
    model: 'gpt-6-astra',
    'model_providers.offline_fixture.name': 'Offline fixed responses',
    'model_providers.offline_fixture.base_url': `http://127.0.0.1:${server.address().port}/v1`,
    'model_providers.offline_fixture.wire_api': 'responses',
    'model_providers.offline_fixture.requires_openai_auth': false,
    'model_providers.offline_fixture.supports_websockets': false,
    'model_providers.offline_fixture.request_max_retries': 0,
    'model_providers.offline_fixture.stream_max_retries': 0
  }
  const send = (value) => child.stdin.write(JSON.stringify(value) + '\n')
  const rpc = (method, params) =>
    new Promise((resolve, reject) => {
      if (failure) {
        reject(failure)
        return
      }
      const id = ++rpcId
      pending.set(id, { resolve, reject })
      send({ id, method, params })
    })
  let outcome, cleanup, receipt, configuration
  try {
    configuration = await createNativeProviderConfig({
      executable: identity.binary,
      model: 'gpt-6-astra',
      directory
    })
    isolation.model_catalog_json = configuration.path
    child = spawn(
      identity.binary,
      [
        'app-server',
        '--listen',
        'stdio://',
        ...Object.entries(isolation).flatMap(([key, value]) => [
          '-c',
          `${key}=${JSON.stringify(value)}`
        ])
      ],
      {
        cwd: nativeHome,
        detached: true,
        env: {
          PATH: process.env.PATH,
          HOME: nativeHome,
          CODEX_HOME: nativeHome,
          TMPDIR: nativeHome,
          RUST_LOG: 'warn'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
    child.stderr.on('data', (chunk) => {
      buffer += chunk.toString()
    })
    child.on('error', fail)
    child.on('exit', (code, signal) => {
      if (shuttingDown) return
      const error = new Error(
        `Native exited: ${code}/${signal}; ${buffer.slice(-1500)}`
      )
      for (const promise of pending.values()) promise.reject(error)
      pending.clear()
      fail(error)
    })
    deadline = createLiveTestDeadline({
      deadlineAt: Date.now() + 45000,
      groups: [child.pid],
      evidencePath: join(directory, 'deadline.json')
    })
    await deadline.ready
    createInterface({ input: child.stdout }).on('line', async (line) => {
      try {
        const event = JSON.parse(line)
        if (event.id !== undefined && !event.method) {
          const promise = pending.get(event.id)
          pending.delete(event.id)
          if (event.error)
            promise?.reject(new Error(JSON.stringify(event.error)))
          else promise?.resolve(event.result)
        } else if (event.method === 'item/tool/call') {
          save('native-call', event.params)
          assert.equal(event.params.tool, fixture.tool)
          assert.equal(event.params.namespace, fixture.namespace)
          const selected = executions?.[activeExecution]
          assert.deepEqual(
            event.params.arguments,
            selected?.input ?? fixture.input
          )
          if (
            executions &&
            typeof selected?.reply !== 'string' &&
            !Array.isArray(selected?.reply)
          )
            throw new Error('Unexpected scripted tool invocation')
          const reply = selected?.reply ?? fixture.raw
          const contentItems =
            typeof reply === 'string'
              ? [{ type: 'inputText', text: reply }]
              : reply
          nativeReplies.push(contentItems)
          save('submitted-reply', { callId: event.params.callId, contentItems })
          send({
            id: event.id,
            result: {
              success: true,
              contentItems
            }
          })
        } else {
          notifications.push(event)
          if (event.method === 'item/completed') {
            save('native-completed', event.params)
            if (
              event.params.item?.contentItems?.some(
                (item) => item.text === fixture.raw
              )
            )
              nativeReplyExact = true
          }
          if (event.method === 'turn/completed') complete(event.params)
        }
      } catch (error) {
        fail(error)
      }
    })
    await rpc('initialize', {
      clientInfo: { name: 'native-delivery-test', version: '1' },
      capabilities: { experimentalApi: true }
    })
    send({ method: 'initialized' })
    const effectiveConfig = await rpc('config/read', { includeLayers: false })
    save('config', effectiveConfig)
    assert.equal(effectiveConfig.config.tool_output_token_limit, null)
    const thread = await rpc('thread/start', {
      model: 'gpt-6-astra',
      modelProvider: 'offline_fixture',
      ephemeral: true,
      allowProviderModelFallback: false,
      environments: [],
      dynamicTools: [fixture.declaration],
      runtimeWorkspaceRoots: [],
      selectedCapabilityRoots: [],
      approvalPolicy: 'never',
      sandbox: 'read-only',
      baseInstructions:
        'Execute the fixed offline tool fixture. Do not access external services.',
      config: isolation
    })
    save('thread', thread)
    await rpc('turn/start', {
      threadId: thread.thread.id,
      input: [
        { type: 'text', text: 'Run the fixed tool fixture.', text_elements: [] }
      ]
    })
    const turn = await completed
    if (turn.turn?.status !== 'completed')
      throw new Error(`Native turn failed: ${JSON.stringify(turn)}`)
    assert.equal(requests.length, expectedRequests)
    if (!executions)
      assert.equal(nativeReplyExact, true, 'Missing exact native completion')
    for (const reply of nativeReplies)
      assert.ok(
        notifications.some(
          (event) =>
            event.method === 'item/completed' &&
            JSON.stringify(event.params.item?.contentItems) ===
              JSON.stringify(reply)
        ),
        'Missing exact native completion'
      )
    let history
    if (inspectHistory) {
      const project = (items) => ({
        itemTypes: items.map((item) => item.type),
        outputs: items
          .filter((item) => item.type === 'functionCallOutput')
          .map(({ id, name, namespace, output }) => ({
            id,
            name,
            namespace,
            output
          }))
      })
      const observe = async (method, params, items) => {
        try {
          const reply = await rpc(method, params)
          return { status: 'available', ...project(items(reply)) }
        } catch (error) {
          return { status: 'unavailable', reason: error.message }
        }
      }
      history = {
        notifications: project(
          notifications
            .filter((event) => event.method === 'item/completed')
            .map((event) => event.params.item)
        ),
        read: await observe(
          'thread/read',
          { threadId: thread.thread.id, includeTurns: true },
          (reply) => reply.thread.turns.flatMap((entry) => entry.items)
        ),
        page: await observe(
          'thread/items/list',
          { threadId: thread.thread.id, turnId: turn.turn.id, limit: 100 },
          (reply) => reply.data
        )
      }
      save('public-forwarding-history', history)
    }
    outcome = {
      ...(history ? { history } : {}),
      source,
      ...(probe ? { outputProbe: probe } : {}),
      version,
      identity,
      tool: fixture.tool,
      directory,
      requests: requests.length,
      initialToolDelivery: {
        tools: requests[0].tools ?? [],
        additionalTools: requests[0].input.filter(
          (item) => item.type === 'additional_tools'
        )
      },
      searchResults: searches.map((search, index) =>
        requests[index + 1].input.filter(
          (item) =>
            item.call_id === search.call_id &&
            ['function_call_output', 'tool_search_output'].includes(item.type)
        )
      ),
      ...(executions
        ? {
            comparisons: executions.map((execution, index) =>
              inspectSuccessor(
                requests[index + 1],
                `${callId}_${index}`,
                execution.expected
              )
            ),
            nativeReplies: nativeReplies.length,
            publicItems: [
              ...new Set(
                notifications
                  .filter((event) => event.method === 'item/completed')
                  .map((event) => event.params.item?.type)
              )
            ],
            delivery: 'native-tool-response'
          }
        : {
            nativeReplyExact,
            comparison: inspectSuccessor(
              requests[searches.length + 1],
              callId,
              fixture.raw
            )
          })
    }
    save('comparison', outcome)
  } catch (error) {
    failure = error
    throw new Error(`${error.message}; evidence: ${directory}`, {
      cause: error
    })
  } finally {
    shuttingDown = true
    if (deadline) cleanup = await deadline.stop('offline-test-cleanup')
    await configuration?.dispose()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    save('diagnostics', {
      stderr: buffer,
      failure: failure?.message,
      notifications
    })
    receipt = await sink.flush()
    await writeFile(
      join(directory, 'result.json'),
      JSON.stringify({ outcome, cleanup, receipt }, null, 2) + '\n'
    )
  }
  return { ...outcome, cleanup, receipt }
}
