import console from 'node:console'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { siteSecurityHeaders } from '../lib/site-security-headers.mjs'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../out'
)
const origin = new URL(process.env.SITE_URL ?? '')
if (
  origin.protocol !== 'http:' ||
  origin.hostname !== '127.0.0.1' ||
  !origin.port
) {
  throw new Error('Static preview requires SITE_URL=http://127.0.0.1:<port>')
}
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
}
const server = createServer(async (request, response) => {
  try {
    const route = decodeURIComponent(new URL(request.url, origin).pathname)
    const requested = path.resolve(root, `.${route}`)
    if (!requested.startsWith(`${root}${path.sep}`) && requested !== root) {
      response.writeHead(400).end()
      return
    }
    let selected
    for (const candidate of [
      requested,
      `${requested}.html`,
      path.join(requested, 'index.html')
    ]) {
      if (
        await stat(candidate).then(
          (info) => info.isFile(),
          () => false
        )
      ) {
        selected = candidate
        break
      }
    }
    const status = selected ? 200 : 404
    selected ??= path.join(root, '404.html')
    const type = types[path.extname(selected)] ?? 'application/octet-stream'
    let body = await readFile(selected)
    const headers = Object.fromEntries(
      siteSecurityHeaders({ ...process.env, NODE_ENV: 'production' }).map(
        ({ key, value }) => [key, value]
      )
    )
    headers['Content-Type'] = type
    if (
      request.headers['accept-encoding']?.includes('gzip') &&
      /^(text\/|application\/(json|xml))/u.test(type)
    ) {
      body = gzipSync(body)
      headers['Content-Encoding'] = 'gzip'
      headers.Vary = 'Accept-Encoding'
    }
    response.writeHead(status, headers)
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch {
    response.writeHead(500).end('Static preview failed')
  }
})
server.listen(Number(origin.port), origin.hostname, () => {
  console.log(`Static preview PID ${process.pid}: ${origin.origin}`)
})
