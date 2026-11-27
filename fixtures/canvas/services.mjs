import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { setTimeout } from 'node:timers/promises'
import { URL, fileURLToPath } from 'node:url'
import { build } from 'vite'

const app = fileURLToPath(new URL('../../apps/asyra-design/', import.meta.url))

async function availablePort() {
  const socket = createServer()

  socket.listen(0, '127.0.0.1')
  await once(socket, 'listening')
  const { port } = socket.address()

  await new Promise((resolve) => socket.close(resolve))

  return port
}

export async function withDocumentServices(directory, origin, exercise) {
  const children = []

  async function start(name, port, env) {
    const outDir = path.join(directory, name)

    await build({
      root: app,
      configFile: path.join(app, 'vite.' + name + '.config.ts'),
      build: { outDir },
      logLevel: 'error'
    })
    const child = spawn(process.execPath, [path.join(outDir, name + '.js')], {
      cwd: directory,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const closed = once(child, 'close')

    children.push({ child, closed })
    let output = ''

    const capture = (data) => {
      output = (output + data).slice(-2000)
    }

    child.stdout.on('data', capture)
    child.stderr.on('data', capture)
    const deadline = Date.now() + 15000

    while (child.exitCode === null && Date.now() < deadline) {
      if (
        (
          await globalThis
            .fetch('http://127.0.0.1:' + port + '/health')
            .catch(() => null)
        )?.ok
      ) {
        return
      }

      await setTimeout(50)
    }

    throw new Error(name + ' startup failed: ' + output)
  }

  try {
    const storagePort = await availablePort()

    await start('document-backend', storagePort, {
      DOCUMENT_BACKEND_PORT: String(storagePort),
      DOCUMENT_BACKEND_DATA_DIR: path.join(directory, 'documents')
    })
    const port = await availablePort()

    await start('collaboration-server', port, {
      APP_URL: origin,
      COLLABORATION_WS_HOST: '127.0.0.1',
      COLLABORATION_WS_PORT: String(port),
      DOCUMENT_PERSISTENCE_BACKEND_URL: 'http://127.0.0.1:' + storagePort
    })
    await exercise(
      'ws://127.0.0.1:' + port + '/collaboration',
      'http://127.0.0.1:' + storagePort
    )
  } finally {
    for (const { child, closed } of children.reverse()) {
      child.kill()
      await closed
    }
  }
}
