#!/usr/bin/env node
'use strict'

const { dispatch, VERSION } = require('./guard-core.cjs')

function emit(result, exitCode) {
  process.stdout.write(`${JSON.stringify(result)}\n`)
  process.exitCode = exitCode
}

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  input += chunk
  if (input.length > 1024 * 1024) {
    emit(
      {
        version: VERSION,
        decision: 'deny',
        code: 'invalid_input',
        reason: 'Input exceeds the one-megabyte limit.'
      },
      1
    )
    process.stdin.destroy()
  }
})
process.stdin.on('end', () => {
  if (process.exitCode) return
  let parsed
  try {
    parsed = JSON.parse(input)
  } catch {
    emit(
      {
        version: VERSION,
        decision: 'deny',
        code: 'invalid_input',
        reason: 'stdin must contain one valid JSON object.'
      },
      1
    )
    return
  }
  let result
  try {
    const command = process.argv[2]
    const arguments_ = process.argv.slice(3)
    if (command === 'update-task-local') {
      if (
        arguments_.length !== 4 ||
        arguments_[0] !== '--request' ||
        arguments_[2] !== '--sha256'
      ) {
        throw new Error(
          'update-task-local requires --request <path> --sha256 <digest>.'
        )
      }
      parsed = {
        ...parsed,
        requestPath: arguments_[1],
        expectedRequestDigest: arguments_[3]
      }
    } else if (arguments_.length > 0) {
      throw new Error(
        'This guard command does not accept command-line arguments.'
      )
    }
    result = dispatch(command, parsed)
  } catch {
    result = {
      version: VERSION,
      decision: 'deny',
      code: 'invalid_input',
      reason: 'Request could not be evaluated.'
    }
  }
  emit(result, result.decision === 'allow' ? 0 : 2)
})
