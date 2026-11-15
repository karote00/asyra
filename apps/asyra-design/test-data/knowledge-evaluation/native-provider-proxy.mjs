import { readFileSync, appendFileSync, mkdtempSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import process from 'node:process'

// External-service fixture only. App tool calls and replies pass through unchanged.
// Account authorization and the model endpoint are offline substitutes; the native
// engine still performs declaration discovery and successor-request serialization.
const configuration = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const args = process.argv.slice(3)
const nativeDirectory = mkdtempSync(configuration.directory + '/native-state-')
let inputReader
const native = spawn(
  configuration.executable,
  [
    ...args,
    ...(args[0] === 'app-server'
      ? Object.entries({
          model_provider: 'offline_fixture',
          'model_providers.offline_fixture.name': 'Offline fixed responses',
          'model_providers.offline_fixture.base_url': configuration.endpoint,
          'model_providers.offline_fixture.wire_api': 'responses',
          'model_providers.offline_fixture.requires_openai_auth': false,
          'model_providers.offline_fixture.supports_websockets': false,
          'model_providers.offline_fixture.request_max_retries': 0,
          'model_providers.offline_fixture.stream_max_retries': 0
        }).flatMap(([key, value]) => ['-c', `${key}=${JSON.stringify(value)}`])
      : [])
  ],
  {
    cwd: configuration.directory,
    env: {
      PATH: process.env.PATH,
      CODEX_HOME: nativeDirectory,
      HOME: nativeDirectory,
      TMPDIR: nativeDirectory
    },
    stdio: ['pipe', 'pipe', 'pipe']
  }
)

const processRecord = (record) =>
  appendFileSync(
    configuration.processes,
    JSON.stringify({ command: args[0], pid: native.pid, ...record }) + '\n'
  )

native.on('spawn', () => processRecord({ status: 'started' }))

native.stdout.pipe(process.stdout)
if (args[0] === 'app-server') {
  createInterface({ input: native.stdout }).on('line', (line) =>
    appendFileSync(configuration.nativeProtocol, line + '\n')
  )
}

native.stderr.on('data', (data) =>
  appendFileSync(
    configuration.directory + '/native-stderr.jsonl',
    JSON.stringify({ pid: native.pid, text: data.toString('utf8') }) + '\n'
  )
)
native.stderr.pipe(process.stderr)
native.on('error', (error) => {
  process.stderr.write(error.stack)
  process.exitCode = 1
})
native.on('close', (code, signal) => {
  processRecord({ status: 'closed', code, signal })
  inputReader?.close()
  process.stdin.destroy()
  process.exitCode = code ?? 1
})
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => native.kill(signal))
}

if (args[0] !== 'app-server') {
  process.stdin.pipe(native.stdin)
} else {
  inputReader = createInterface({ input: process.stdin })
    .on('line', (line) => {
      const message = JSON.parse(line)

      appendFileSync(configuration.protocol, line + '\n')
      if (message.method === 'account/read') {
        process.stdout.write(
          JSON.stringify({
            id: message.id,
            result: {
              account: {
                type: 'chatgpt',
                email: 'offline@example.invalid',
                planType: 'plus'
              },
              requiresOpenaiAuth: false
            }
          }) + '\n'
        )

        return
      }

      if (message.method === 'thread/start') {
        message.params.modelProvider = 'offline_fixture'
        if (configuration.fault === 'omit-instructions') {
          message.params.baseInstructions = 'Incomplete fixture instructions'
        }

        if (configuration.fault === 'alter-tool-schema') {
          const tool = message.params.dynamicTools
            .flatMap((group) => group.tools ?? [])
            .find((entry) => entry.name === 'execute_design')

          if (!tool) {
            throw Error('Missing original execute_design declaration')
          }

          tool.inputSchema = { type: 'object' }
        }
      }

      if (
        message.method === 'turn/start' &&
        configuration.fault === 'swap-attachment-association'
      ) {
        for (const item of message.params.input) {
          if (item.type !== 'text') {
            continue
          }

          const value = JSON.parse(item.text)
          const context = value.input?.metadata?.conversationContext
          const indexes = context?.attachmentIndexes

          if (indexes?.length === 2) {
            context.attachmentIndexes = [...indexes].reverse()
            item.text = JSON.stringify(value)
          }
        }
      }

      if (
        message.result?.contentItems &&
        configuration.fault === 'omit-outcome'
      ) {
        message.result.contentItems = message.result.contentItems.filter(
          (item) => !item.text?.includes('"toolOutcome"')
        )
      }

      if (
        message.result?.contentItems &&
        configuration.fault === 'alter-data'
      ) {
        const item = message.result.contentItems.find((item) =>
          item.text?.includes('"documents"')
        )

        if (item) {
          const value = JSON.parse(item.text)

          value.documents[0].text = 'Corrupted advice'
          item.text = JSON.stringify(value)
        }
      }

      if (
        message.result?.contentItems &&
        configuration.fault === 'omit-image'
      ) {
        message.result.contentItems = message.result.contentItems.filter(
          (item) => item.type !== 'inputImage'
        )
      }

      native.stdin.write(JSON.stringify(message) + '\n')
    })
    .on('close', () => native.stdin.end())
}
