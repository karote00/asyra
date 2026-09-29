import { cases } from './catalog.mjs'
import { createRunner } from './engine.mjs'

const [command, ...args] = process.argv.slice(2)
const runner = createRunner()
const arity = {
  list: 0,
  prepare: 4,
  admit: 1,
  regression: 1,
  evaluate: 1,
  report: 1,
  review: 2
}

try {
  if (
    command !== 'summary' &&
    (!(command in arity) || args.length !== arity[command])
  ) {
    throw new Error(
      'Usage: agent-evals list | prepare <case> <run> <actor> <agent|replay> | admit <run> | regression <run> | evaluate <run> | review <run> <review.json> | report <run> | summary <run>...'
    )
  }
  let result
  if (command === 'list') result = cases.map(({ id, title }) => ({ id, title }))
  else if (command === 'prepare') {
    const prepared = runner.prepare(...args)
    result = {
      run: prepared.run,
      workspace: prepared.workspace,
      prompt: prepared.prompt
    }
  } else if (command === 'review')
    result = runner.review(args[0], runner.readReview(args[1]))
  else if (command === 'summary') result = runner.summarize(args)
  else result = runner[command](...args)
  console.log(JSON.stringify(result, null, 2))
  if (
    result.status === 'failed' ||
    result.reports?.some((item) => item.status === 'failed')
  )
    process.exitCode = 1
  else if (
    result.status === 'needs-review' ||
    result.reports?.some((item) => item.status === 'needs-review')
  )
    process.exitCode = 2
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
