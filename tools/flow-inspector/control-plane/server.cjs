/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('node:http')
const { URL } = require('node:url')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { randomBytes, timingSafeEqual } = require('node:crypto')
const { createService, LOCAL_ACTOR, ActionError } = require('./service.cjs')

function parseLocalUrl(value) {
  if (!value)
    throw new Error('Set FLOW_PROOF_URL, for example http://127.0.0.1:4318')
  const url = new URL(value)
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      'FLOW_PROOF_URL must be an HTTP loopback origin with an explicit port'
    )
  return url
}
const readBody = async (request) => {
  if (
    request.headers['content-type']?.split(';')[0].trim() !== 'application/json'
  )
    throw new ActionError(415, 'JSON body required')
  if (Number(request.headers['content-length']) > 4096)
    throw new ActionError(413, 'Request too large')
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 4096) throw new ActionError(413, 'Request too large')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString())
  } catch {
    throw new ActionError(400, 'Invalid JSON')
  }
}

async function startServer(
  repositoryRoot,
  { url = process.env.FLOW_PROOF_URL, serviceOptions } = {}
) {
  const address = parseLocalUrl(url)
  const capability = randomBytes(32).toString('hex')
  const workspacePath = '/tools/flow-inspector/workspace/'
  const targetPath = workspacePath + 'target.html'
  const assets = new Map([
    [
      '/board.js',
      [
        path.join(__dirname, 'public/board.js'),
        'text/javascript; charset=utf-8'
      ]
    ],
    [
      '/board.css',
      [path.join(__dirname, 'public/board.css'), 'text/css; charset=utf-8']
    ]
  ])
  for (const relative of [
    'viewer.js',
    'viewer.css',
    'workspace/workspace.html',
    'workspace/target.html',
    'workspace/target.js',
    'workspace/legacy-viewer.js',
    'workspace/workspace-bundle.data.js',
    'workspace/generated/flow-inspector-workspace.js',
    'workspace/generated/flow-inspector-workspace.css'
  ]) {
    const extension = path.extname(relative)
    const type = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css'
    }[extension]
    assets.set('/tools/flow-inspector/' + relative, [
      path.join(__dirname, '..', relative),
      type + '; charset=utf-8'
    ])
  }
  // Load the committed catalog once for this server lifetime. Only resources
  // explicitly linked by that artifact are readable; this is not a file server.
  const workspaceSnapshot = {}
  vm.runInNewContext(
    fs.readFileSync(
      path.join(__dirname, '../workspace/workspace-bundle.data.js'),
      'utf8'
    ),
    workspaceSnapshot,
    { timeout: 1000 }
  )
  const localBase = new URL('http://catalog.local/')
  for (const entry of workspaceSnapshot.FLOW_INSPECTOR_WORKSPACE_BUNDLE
    .entries) {
    const source = new URL(entry.sourcePath, localBase)
    const resources = [
      source,
      ...(entry.data?.links ?? []).map((link) => new URL(link.href, source))
    ]
    for (const resource of resources) {
      if (resource.origin !== localBase.origin || assets.has(resource.pathname))
        continue
      const file = path.resolve(
        repositoryRoot,
        decodeURIComponent(resource.pathname.slice(1))
      )
      if (
        !file.startsWith(repositoryRoot + path.sep) ||
        !['.md', '.cjs', '.js'].includes(path.extname(file)) ||
        !fs.existsSync(file) ||
        fs.realpathSync(file) !== file ||
        !fs.statSync(file).isFile()
      )
        continue
      assets.set(resource.pathname, [file, 'text/plain; charset=utf-8'])
    }
  }
  const service = createService(repositoryRoot, serviceOptions)
  let origin
  let closing = false
  const server = http.createServer(
    { maxHeaderSize: 8192 },
    async (request, response) => {
      const send = (status, data) => {
        response.writeHead(status, {
          'Content-Type': 'application/json; charset=utf-8'
        })
        response.end(JSON.stringify(data))
      }
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'"
      )
      try {
        if (closing) throw new ActionError(503, 'Service is closing')
        if (
          request.headers.host !== new URL(origin).host ||
          (request.headers.origin && request.headers.origin !== origin)
        )
          throw new ActionError(403, 'Origin is not authorized')
        const route = new URL(request.url, origin)
        const targetQuery =
          route.pathname === targetPath &&
          [...route.searchParams.keys()].length === 1 &&
          Boolean(route.searchParams.get('inspector'))
        if (route.search && !targetQuery)
          throw new ActionError(400, 'Query parameters are unsupported')
        if (request.method === 'GET') {
          if (route.pathname === '/') {
            response.writeHead(302, {
              Location:
                workspacePath +
                'workspace.html#inspector=' +
                encodeURIComponent(service.contract().targetId)
            })
            return response.end()
          }
          if (route.pathname === '/api/session')
            return send(200, { capability })
          if (route.pathname === '/api/state') return send(200, service.state())
          const match = route.pathname.match(/^\/api\/runs\/([a-f0-9-]{36})$/)
          if (match) return send(200, service.get(match[1]))
          const asset = assets.get(route.pathname)
          if (!asset) throw new ActionError(404, 'Route not found')
          // Existing canvas geometry uses style attributes; target.js owns a
          // same-origin base URL. Scripts remain external and same-origin only.
          response.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors " +
              (route.pathname === targetPath ? "'self'" : "'none'") +
              "; object-src 'none'; base-uri 'self'"
          )
          let content = fs.readFileSync(asset[0])
          if (route.pathname === targetPath) {
            content = content
              .toString()
              .replace(
                '</head>',
                '<link rel="stylesheet" href="/board.css" /></head>'
              )
              .replace('</body>', '<script src="/board.js"></script></body>')
          }
          response.writeHead(200, { 'Content-Type': asset[1] })
          return response.end(content)
        }
        if (request.method !== 'POST')
          throw new ActionError(405, 'Method not allowed')
        const provided = request.headers['x-proof-capability']
        if (
          typeof provided !== 'string' ||
          provided.length !== capability.length ||
          !timingSafeEqual(Buffer.from(provided), Buffer.from(capability))
        )
          throw new ActionError(403, 'Action is not authorized')
        const body = await readBody(request)
        if (route.pathname === '/api/runs')
          return send(202, { id: service.start(body, LOCAL_ACTOR) })
        const cancel = route.pathname.match(
          /^\/api\/runs\/([a-f0-9-]{36})\/cancel$/
        )
        if (cancel) {
          if (
            !body ||
            typeof body !== 'object' ||
            Array.isArray(body) ||
            Object.keys(body).length
          )
            throw new ActionError(400, 'Cancellation takes an empty body')
          await service.cancel(cancel[1], LOCAL_ACTOR)
          return send(200, { id: cancel[1] })
        }
        throw new ActionError(404, 'Action not found')
      } catch (error) {
        if (!response.destroyed)
          send(error.status ?? 500, { error: error.message })
      }
    }
  )
  server.requestTimeout = 5000
  server.headersTimeout = 5000
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(Number(address.port), '127.0.0.1', resolve)
    })
    origin = 'http://127.0.0.1:' + server.address().port
  } catch (error) {
    await service.close()
    throw error
  }
  return {
    origin,
    service,
    async close() {
      closing = true
      await service.close()
      server.closeAllConnections()
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
    }
  }
}
module.exports = { startServer, parseLocalUrl }
