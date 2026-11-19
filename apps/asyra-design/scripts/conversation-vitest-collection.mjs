import process from 'node:process'
import { writeFileSync } from 'node:fs'
import { createVitest } from 'vitest/node'

const [config, environment, output, ...files] = process.argv.slice(2)

if (!config || !environment || !output || !files.length) {
  throw Error('Expected config, environment, output and selected test files')
}

const runner = await createVitest('test', {
  config,
  environment,
  watch: false,
  fileParallelism: false,
  reporters: []
})

try {
  const { testModules, unhandledErrors } = await runner.collect(files)
  const errors = [
    ...unhandledErrors,
    ...testModules.flatMap((module) => [
      ...module.errors(),
      ...[...module.children.allSuites()].flatMap((suite) => suite.errors())
    ])
  ]

  if (errors.length || process.exitCode) {
    throw Error('Vitest collection failed: ' + JSON.stringify(errors))
  }

  const cases = testModules.flatMap((module) =>
    [...module.children.allTests()].map((test) => {
      const titlePath = [test.name]
      let parent = test.parent

      while (parent.type === 'suite') {
        titlePath.unshift(parent.name)
        parent = parent.parent
      }

      return {
        file: module.moduleId,
        titlePath,
        projectName: module.project.name
      }
    })
  )

  writeFileSync(output, JSON.stringify(cases, null, 2) + '\n')
} finally {
  await runner.close()
}
