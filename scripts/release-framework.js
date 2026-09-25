#!/usr/bin/env node

import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const printPlan = args.includes('--plan')

if (args.some((arg) => arg !== '--plan')) {
  console.error('Unknown argument')
  process.exit(1)
}

const releasePlan = {
  prepare: [
    'yarn release:validate --framework',
    'yarn bump:workspace --env=release',
    'yarn release:ranges:check'
  ],
  publish: [
    'node scripts/publish-framework-release.js --record=release-records/framework/current.json'
  ],
  verify: ['yarn release:consumer:registry'],
  finally: ['yarn bump:workspace --env=dev']
}

if (printPlan) {
  process.stdout.write(`${JSON.stringify(releasePlan, null, 2)}\n`)
  process.exit(0)
}

const run = (command) => {
  console.log(`\n> ${command}`)
  execSync(command, { stdio: 'inherit' })
}

let exactRangesApplied = false
try {
  for (const command of releasePlan.prepare) {
    run(command)
    if (command === 'yarn bump:workspace --env=release') {
      exactRangesApplied = true
    }
  }
  releasePlan.publish.forEach(run)
  releasePlan.verify.forEach(run)
} finally {
  if (exactRangesApplied) releasePlan.finally.forEach(run)
}

console.log('\nFramework release completed')
