#!/usr/bin/env node
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const productArgument = args.find((arg) => arg.startsWith('--prod='))
const product = productArgument?.slice('--prod='.length)
const printPlan = args.includes('--plan')

if (!product || !/^[a-z0-9-]+$/u.test(product)) {
  console.error('Must specify a safe --prod=<app-name>')
  process.exit(1)
}
if (args.some((arg) => arg !== productArgument && arg !== '--plan')) {
  console.error('Unknown argument')
  process.exit(1)
}

const releasePlan = {
  framework: ['yarn release:framework'],
  createApp: [`yarn release:create-app --prod=${product}`]
}

if (printPlan) {
  process.stdout.write(`${JSON.stringify(releasePlan, null, 2)}\n`)
  process.exit(0)
}

for (const command of [...releasePlan.framework, ...releasePlan.createApp]) {
  console.log(`\n> ${command}`)
  execSync(command, { stdio: 'inherit' })
}

console.log('\nFull staged release completed')
