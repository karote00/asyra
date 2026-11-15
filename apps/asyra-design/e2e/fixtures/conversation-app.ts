import { expect, type Page, type TestInfo } from '@playwright/test'
import { createServer } from 'vite'
import { createServer as createPortServer } from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { createNativeProviderFixture } from '../../server/__tests__/native-provider-fixture'

/** Own services only. The production App owns every request and result handoff. */
export async function withConversationApp(
  page: Page,
  testInfo: TestInfo,
  fixture: Awaited<ReturnType<typeof createNativeProviderFixture>>,
  run: (appURL: string) => Promise<void>
) {
  const portOwner = createPortServer()
  const previous = new Map<string, string | undefined>()
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  let collaboration: ChildProcess | undefined
  let collaborationClosed: Promise<void> | undefined
  const collaborationLog = createWriteStream(
    testInfo.outputPath('collaboration.log')
  )
  let failure: unknown
  const cleanupErrors: unknown[] = []

  try {
    await new Promise<void>((accept) =>
      portOwner.listen(0, '127.0.0.1', accept)
    )
    const socket = portOwner.address()

    if (!socket || typeof socket === 'string') {
      throw Error('Missing collaboration port')
    }

    const collaborationPort = socket.port

    await new Promise<void>((accept) => portOwner.close(() => accept()))
    const environment = {
      ...fixture.environment,
      E2E_OWN_SERVERS: '1',
      VITE_COLLABORATION_WS_URL: `ws://127.0.0.1:${collaborationPort}/collaboration`
    }

    for (const key of Object.keys(environment)) {
      previous.set(key, process.env[key])
    }

    Object.assign(process.env, environment)
    server = await createServer({
      root: resolve('.'),
      configFile: resolve('vite.config.ts'),
      server: {
        host: '127.0.0.1',
        port: 0,
        strictPort: true,
        open: false,
        hmr: false
      },
      logLevel: 'error'
    })
    await server.listen()
    const address = server.httpServer?.address()

    if (!address || typeof address === 'string') {
      throw Error('Missing owned Vite listener')
    }

    const appURL = `http://127.0.0.1:${address.port}`

    collaboration = spawn(
      process.execPath,
      ['dist/collaboration-server/collaboration-server.js'],
      {
        cwd: resolve('.'),
        env: {
          ...process.env,
          APP_URL: appURL,
          COLLABORATION_WS_PORT: String(collaborationPort),
          DOCUMENT_PERSISTENCE_BACKEND_URL:
            process.env.E2E_DOCUMENT_BACKEND_URL || 'http://127.0.0.1:4201'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )
    collaboration.stdout?.pipe(collaborationLog, { end: false })
    collaboration.stderr?.pipe(collaborationLog, { end: false })
    collaborationClosed = new Promise((accept) =>
      collaboration?.once('close', () => accept())
    )
    await writeFile(
      testInfo.outputPath('owned-process.json'),
      JSON.stringify({ pid: collaboration.pid, appURL, collaborationPort })
    )
    await expect
      .poll(
        async () => {
          if (collaboration?.exitCode !== null) {
            throw Error('Owned collaboration service exited')
          }

          try {
            return (await fetch(`http://127.0.0.1:${collaborationPort}/health`))
              .ok
          } catch {
            return false
          }
        },
        { timeout: 15000 }
      )
      .toBe(true)
    await run(appURL)
  } catch (error) {
    failure = error
    await testInfo.attach('conversation-state', {
      body: await page
        .getByTestId('ai-agent-message')
        .last()
        .innerText({ timeout: 1000 })
        .catch(() => 'No settled conversation message'),
      contentType: 'text/plain'
    })
    await page
      .screenshot({ path: testInfo.outputPath('failed-conversation.png') })
      .catch(async (captureError) => {
        await testInfo.attach('capture-error', {
          body: String(captureError),
          contentType: 'text/plain'
        })
      })
  } finally {
    const cleanups = [
      ...page
        .context()
        .pages()
        .map((ownedPage) => async () => {
          await ownedPage.close()
        }),
      async () => {
        if (server?.httpServer && 'closeAllConnections' in server.httpServer) {
          server.httpServer.closeAllConnections()
        }

        await server?.close()
      },
      async () => {
        collaboration?.kill('SIGTERM')
        await collaborationClosed
      },
      async () => {
        await new Promise<void>((accept) => collaborationLog.end(accept))
      },
      async () => {
        if (portOwner.listening) {
          await new Promise<void>((accept) => portOwner.close(() => accept()))
        }
      },
      async () => {
        await fixture.dispose()
      }
    ]

    for (const cleanup of cleanups) {
      try {
        await cleanup()
      } catch (error) {
        cleanupErrors.push(error)
      }
    }

    for (const [key, value] of previous) {
      if (value === undefined) {
        Reflect.deleteProperty(process.env, key)
      } else {
        process.env[key] = value
      }
    }
  }

  if (cleanupErrors.length) {
    throw new AggregateError(
      failure ? [failure, ...cleanupErrors] : cleanupErrors,
      'Browser handoff or resource cleanup failed'
    )
  }

  if (failure) {
    throw failure
  }
}
