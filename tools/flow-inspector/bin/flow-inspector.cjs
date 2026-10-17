#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
require('../flow-files/commands.cjs')
  .main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error(
      JSON.stringify({ status: 'invalid', error: error.message, exitCode: 2 })
    )
    process.exitCode = 2
  })
