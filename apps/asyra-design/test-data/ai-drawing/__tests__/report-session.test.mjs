import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { join } from 'node:path'
import { requestReportSession } from '../taipei-101-report-session.mjs'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const script = fileURLToPath(
  new URL('../taipei-101-report-session.mjs', import.meta.url)
)

const serve = async (reply, run) => {
  let calls = 0
  const server = createServer((request, response) => {
    calls++
    request.resume()
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(reply))
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    await run({
      url: `http://127.0.0.1:${server.address().port}/api/ai/evaluation-report`,
      sessionId: 'retained-session',
      nativeThreadId: 'original-thread'
    })
    assert.equal(calls, 1, 'The client must not repeat inference')
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
}

const answer = {
  nativeThreadId: 'original-thread',
  nativeTurnId: 'original-turn',
  messages: [{ phase: 'commentary', text: 'Complete original answer' }]
}

for (const recording of [
  { status: 'saved' },
  { status: 'failed', message: 'Output storage unavailable' }
]) {
  test(`report client saves the complete answer and exposes ${recording.status} recording`, async () => {
    const directory = await mkdtemp(join(root, 'tmp/report-client-'))

    try {
      await serve({ ...answer, recording }, async (session) => {
        await writeFile(
          join(directory, 'report-session.json'),
          JSON.stringify(session)
        )
        const question = join(directory, 'question.txt')

        await writeFile(question, 'Explain the completed task')
        const { stdout } = await execute(
          process.execPath,
          [script, directory, 'ask', question],
          { cwd: root }
        )

        assert.deepEqual(JSON.parse(stdout).recording, recording)
        assert.deepEqual(
          JSON.parse(
            await readFile(
              join(directory, 'followup-original-turn.json'),
              'utf8'
            )
          ),
          { ...answer, recording }
        )
        assert.equal(
          await readFile(join(directory, 'followup-original-turn.txt'), 'utf8'),
          answer.messages[0].text
        )
      })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
}

for (const [name, recording] of [
  ['missing', undefined],
  ['unknown status', { status: 'complete' }],
  ['missing failure message', { status: 'failed' }],
  ['contradictory saved status', { status: 'saved', message: 'failed' }]
]) {
  test(`report client rejects a ${name} recording receipt`, async () => {
    await serve({ ...answer, recording }, async (session) => {
      await assert.rejects(
        requestReportSession(session, 'ask', 'Explain'),
        /Invalid report recording receipt/
      )
    })
  })
}
