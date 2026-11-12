/** Managed same-thread report questions after the live recorder has returned. */
import { readFileSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import process from 'node:process'
import console from 'node:console'
import path from 'node:path'
import { URL, pathToFileURL } from 'node:url'

export const requestReportSession = (session, operation, question) =>
  new Promise((resolve, reject) => {
    const url = new URL(session.url)

    if (
      url.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    ) {
      reject(Error('Report sessions require the local App service'))

      return
    }

    // No response/header timeout: the drawing deadline does not bound reports.
    const connection = request(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      },
      (response) => {
        let body = ''

        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('error', reject)
        response.on('end', () => {
          try {
            const value = JSON.parse(body)

            if (response.statusCode !== 200) {
              throw Error(value.message ?? value.code)
            }

            if (value.nativeThreadId !== session.nativeThreadId) {
              throw Error('Original report thread changed')
            }

            resolve(value)
          } catch (error) {
            reject(error)
          }
        })
      }
    )

    connection.on('error', reject)
    connection.end(
      JSON.stringify({ operation, sessionId: session.sessionId, question })
    )
  })

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const [directory, operation, questionFile] = process.argv.slice(2)

  if (
    !directory ||
    !['status', 'ask', 'close'].includes(operation) ||
    (operation === 'ask' && !questionFile)
  ) {
    throw Error(
      'Usage: node taipei-101-report-session.mjs RUN_DIRECTORY status|ask|close [QUESTION_FILE]'
    )
  }

  const session = JSON.parse(
    readFileSync(path.join(directory, 'report-session.json'), 'utf8')
  )
  const result = await requestReportSession(
    session,
    operation,
    operation === 'ask' ? readFileSync(questionFile, 'utf8') : undefined
  )

  if (operation === 'ask') {
    const filename = path.join(
      directory,
      `followup-${result.nativeTurnId}.json`
    )

    writeFileSync(filename, JSON.stringify(result, null, 2), { flag: 'wx' })
    const report = path.join(directory, `followup-${result.nativeTurnId}.txt`)

    writeFileSync(
      report,
      result.messages.map((message) => message.text).join('\n\n'),
      { flag: 'wx' }
    )
    console.log(
      JSON.stringify({
        nativeThreadId: result.nativeThreadId,
        nativeTurnId: result.nativeTurnId,
        report
      })
    )
  } else {
    console.log(JSON.stringify(result))
  }
}
