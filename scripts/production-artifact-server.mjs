/* global URL */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm'
}

// Serve the artifact only. No Vite plugins, source modules, API mocks or HTML fallback.
export async function serveArtifact(directory, headers = {}) {
  const root = path.resolve(directory)
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname
      )
      const file = path.resolve(
        root,
        `.${pathname === '/' ? '/index.html' : pathname}`
      )
      if (
        !file.startsWith(`${root}${path.sep}`) ||
        !(await stat(file)).isFile()
      )
        throw new Error('Not found')
      response.writeHead(200, {
        ...headers,
        'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store'
      })
      response.end(await readFile(file))
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections()
        server.close(resolve)
      })
  }
}
