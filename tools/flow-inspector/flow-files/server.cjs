/* eslint-disable @typescript-eslint/no-require-imports */
const { URL } = require('node:url')
const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path'),
  { randomBytes } = require('node:crypto')
const { createFlowService } = require('./service.cjs')
const { architectureFor } = require('./view.cjs')
const { compactContext } = require('./context.cjs')
async function startFlowServer(
  root,
  { directory, url = 'http://127.0.0.1:4318', projectId } = {}
) {
  const address = new URL(url)
  if (
    address.protocol !== 'http:' ||
    address.hostname !== '127.0.0.1' ||
    !address.port ||
    address.pathname !== '/' ||
    address.search ||
    address.hash ||
    address.username ||
    address.password
  )
    throw new Error('Expected loopback HTTP origin with explicit port')
  const service = createFlowService(root, directory, { projectId }),
    capability = randomBytes(32).toString('hex')
  const assets = {
    '/': ['public/index.html', 'text/html'],
    '/flow.js': ['public/flow.js', 'text/javascript'],
    '/flow.css': ['public/flow.css', 'text/css'],
    '/viewer.js': ['../viewer.js', 'text/javascript'],
    '/viewer.css': ['../viewer.css', 'text/css']
  }
  let origin = address.origin
  const server = http.createServer(async (req, res) => {
    const send = (status, value) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      })
      res.end(JSON.stringify(value))
    }
    try {
      if (req.headers.host !== new URL(origin).host)
        return send(403, { error: 'Invalid host' })
      const route = new URL(req.url, origin)
      if (req.method === 'GET') {
        if (assets[route.pathname]) {
          const [file, type] = assets[route.pathname]
          res.writeHead(200, {
            'Content-Type': type,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
          })
          return res.end(fs.readFileSync(path.join(__dirname, file)))
        }
        if (route.pathname === '/api/session') return send(200, { capability })
        if (route.pathname === '/api/flows') {
          const current = service.snapshot()
          return send(200, {
            ...current,
            views: Object.fromEntries(
              current.documents.map((d) => [d.flowId, architectureFor(d)])
            )
          })
        }
        if (route.pathname === '/api/evidence')
          return send(
            200,
            service.context(
              route.searchParams.get('flow'),
              route.searchParams.get('node')
            )
          )
        if (route.pathname === '/api/context')
          return send(
            200,
            compactContext(
              service.context(
                route.searchParams.get('flow'),
                route.searchParams.get('node')
              )
            )
          )
        return send(404, { error: 'Unknown route' })
      }
      if (req.method !== 'POST')
        return send(405, { error: 'Unsupported method' })
      if (
        (req.headers.origin && req.headers.origin !== origin) ||
        req.headers['x-flow-capability'] !== capability
      )
        return send(403, { error: 'Local action authorization required' })
      if (req.headers['content-type'] !== 'application/json')
        return send(415, { error: 'Expected JSON' })
      const chunks = []
      let bytes = 0
      for await (const chunk of req) {
        bytes += chunk.length
        if (bytes > 1024 * 1024)
          return send(413, { error: 'Request too large' })
        chunks.push(chunk)
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (route.pathname === '/api/update')
        return send(200, service.update(body.flowId, body.request))
      if (route.pathname === '/api/preview')
        return send(
          200,
          service.preview(body.flowId, body.nodeId, body.actionId)
        )
      if (route.pathname === '/api/rerun')
        return send(200, await service.rerun(body))
      if (route.pathname === '/api/cancel') {
        await service.cancel()
        return send(200, { settled: true })
      }
      return send(404, { error: 'Unknown route' })
    } catch (error) {
      return send(409, { error: error.message })
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(Number(address.port), '127.0.0.1', resolve)
  })
  origin = 'http://127.0.0.1:' + server.address().port
  return {
    origin,
    service,
    close: async () => {
      await service.close()
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      })
    }
  }
}
module.exports = { startFlowServer }
