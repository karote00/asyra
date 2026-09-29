export function convertVTracerBuffer(input: {
  bytes: Uint8Array
  contentType: string
  profile: string
  signal: AbortSignal
}): Promise<string>
export function createVTracerMiddleware(): (
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
  next: () => void
) => Promise<void>
