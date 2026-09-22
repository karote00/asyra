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
    'yarn release:validate --framework --preserve',
    'node scripts/framework-release-artifacts.js --prepare'
  ],
  publish: [
    'node scripts/publish-framework-release.js --validation=tmp/framework-release-validation.json'
  ],
  verify: [
    'yarn release:consumer:registry',
    'node scripts/framework-release-artifacts.js --cleanup'
  ]
}

if (printPlan) {
  process.stdout.write(`${JSON.stringify(releasePlan, null, 2)}\n`)
  process.exit(0)
}

const run = (command) => {
  console.log(`\n> ${command}`)
  execSync(command, { stdio: 'inherit' })
}

for (const command of releasePlan.prepare) run(command)
releasePlan.publish.forEach(run)
releasePlan.verify.forEach(run)

console.log('\nFramework release completed')
