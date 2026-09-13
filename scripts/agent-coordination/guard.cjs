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
    result = dispatch(process.argv[2], parsed)
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
