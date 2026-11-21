import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'

export const startNativeProcess = (
  executable: string,
  args: readonly string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
) =>
  spawn(executable, [...args], {
    ...options,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  })

type TransportFailure = 'configuration' | 'protocol' | 'transport'
type StreamChannel = 'stdin' | 'stdout' | 'stderr'
type StreamStatus = 'error' | 'end' | 'close' | 'finish'

/** One process, byte-framed JSON RPC and synchronous identity admission. No model or App policy. */
export const createNativeRpcTransport = (options: {
  child: ChildProcessWithoutNullStreams
  maximumFrameBytes: number
  receive: (packet: unknown) => void
  fail: (error: Error) => void
  error: (kind: TransportFailure) => Error
  rpcError: (value: unknown) => Error
  isStopped: () => boolean
  isRetained: () => boolean
  isComplete: () => boolean
  closed: () => void
  observeBytes?: (
    direction: 'sent' | 'received',
    bytes: number,
    channel?: 'diagnostic'
  ) => void
  observeStream?: (
    channel: StreamChannel,
    status: StreamStatus,
    terminal: boolean
  ) => void
  observeRequest?: (event: {
    id: number
    method: string
    status: 'started' | 'completed' | 'failed'
    requestBytes: number
    durationMs: number
    error?: unknown
  }) => void
}) => {
  const { child } = options
  const pending = new Map<
    number,
    {
      resolve: (value: unknown) => void
      reject: (error: Error) => void
      admit?: (value: unknown) => void
    }
  >()
  const decoder = new StringDecoder('utf8')
  let sequence = 0
  let buffer = ''
  let terminal: Error | undefined

  const observe = (work: () => void) => {
    try {
      work()
    } catch {
      /* Observation cannot retire a live transport. */
    }
  }

  const abortPending = (error: Error) => {
    terminal ??= error
    for (const entry of pending.values()) {
      entry.reject(terminal)
    }

    pending.clear()
  }

  const fail = (kind: TransportFailure) => {
    const error = options.error(kind)

    abortPending(error)
    options.fail(error)
  }

  const write = (wire: string, bytes = Buffer.byteLength(wire, 'utf8')) => {
    if (terminal) {
      throw terminal
    }

    const result = child.stdin.write(wire)

    observe(() => options.observeBytes?.('sent', bytes))

    return result
  }

  const receiveResponse = (value: Record<string, unknown>) => {
    if (value.method || typeof value.id !== 'number') {
      return fail('protocol')
    }

    const entry = pending.get(value.id)

    if (!entry) {
      return fail('protocol')
    }

    pending.delete(value.id)
    if (value.error) {
      entry.reject(options.rpcError(value.error))
    } else {
      try {
        entry.admit?.(value.result)
        entry.resolve(value.result)
      } catch (error) {
        const rejected =
          error instanceof Error ? error : options.error('protocol')

        entry.reject(rejected)
        abortPending(rejected)
        options.fail(rejected)
      }
    }
  }

  const request = async (
    method: string,
    params: unknown,
    admit?: (value: unknown) => void
  ): Promise<unknown> => {
    if (terminal) {
      throw terminal
    }

    const id = ++sequence
    const wire = JSON.stringify({ id, method, params }) + '\n'
    const started = performance.now()
    const requestBytes = Buffer.byteLength(wire, 'utf8')

    const report = (
      status: 'started' | 'completed' | 'failed',
      error?: unknown
    ) =>
      observe(() =>
        options.observeRequest?.({
          id,
          method,
          status,
          requestBytes,
          durationMs: Math.max(0, performance.now() - started),
          error
        })
      )

    report('started')
    try {
      const value = await new Promise<unknown>((resolve, reject) => {
        pending.set(id, { resolve, reject, admit })
        try {
          write(wire, requestBytes)
        } catch (error) {
          pending.delete(id)
          reject(error)
        }
      })

      report('completed')

      return value
    } catch (error) {
      report('failed', error)
      throw error
    }
  }

  const requiredStream = (
    channel: 'stdin' | 'stdout',
    status: StreamStatus
  ) => {
    if (options.isStopped()) {
      return
    }

    const isTerminal = options.isRetained() || !options.isComplete()

    observe(() => options.observeStream?.(channel, status, isTerminal))
    if (isTerminal) {
      fail('transport')
    }
  }

  child.on('error', () => fail('configuration'))
  child.once('close', () => {
    if (
      !options.isStopped() &&
      (options.isRetained() || !options.isComplete())
    ) {
      fail('transport')
    }

    options.closed()
  })
  child.stdin.on('error', () => requiredStream('stdin', 'error'))
  child.stdin.once('finish', () => requiredStream('stdin', 'finish'))
  child.stdin.once('close', () => requiredStream('stdin', 'close'))
  child.stdout.on('error', () => requiredStream('stdout', 'error'))
  child.stdout.once('end', () => requiredStream('stdout', 'end'))
  child.stdout.once('close', () => requiredStream('stdout', 'close'))
  child.stderr.on('data', (chunk: Buffer) =>
    observe(() =>
      options.observeBytes?.('received', chunk.byteLength, 'diagnostic')
    )
  )
  child.stderr.on('error', () => {
    if (!options.isStopped()) {
      observe(() => options.observeStream?.('stderr', 'error', false))
    }
  })
  child.stdout.on('data', (chunk: Buffer) => {
    observe(() => options.observeBytes?.('received', chunk.byteLength))
    if (terminal) {
      return
    }

    buffer += decoder.write(chunk)
    let index: number

    while ((index = buffer.indexOf('\n')) >= 0 && !terminal) {
      const line = buffer.slice(0, index)

      if (Buffer.byteLength(line, 'utf8') > options.maximumFrameBytes) {
        return fail('protocol')
      }

      buffer = buffer.slice(index + 1)
      try {
        options.receive(JSON.parse(line))
      } catch {
        fail('protocol')
      }
    }

    if (Buffer.byteLength(buffer, 'utf8') > options.maximumFrameBytes) {
      fail('protocol')
    }
  })
  child.stderr.resume()

  return {
    write,
    request,
    receiveResponse,
    abortPending,

    get pendingCount() {
      return pending.size
    }
  }
}
