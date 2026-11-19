/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')

// Definitions come from a separate native runner collection, never the result
// report being assessed. Spec coverage remains an independent human review.
function collectRunnerCases(
  producer,
  input,
  { root, cwd, files, project = '' }
) {
  const cases = []
  const expected = new Set(files)
  const identities = new Set()

  const add = (file, title, observedProject = '') => {
    if (
      typeof file !== 'string' ||
      typeof title !== 'string' ||
      !title.trim()
    ) {
      throw new Error('Malformed collected case')
    }

    const relative = path
      .relative(root, path.resolve(cwd, file))
      .split(path.sep)
      .join('/')
    const identity = JSON.stringify([relative, title])

    if (!expected.has(relative) || observedProject !== project) {
      throw new Error('Unexpected collection file or project: ' + file)
    }

    if (identities.has(identity)) {
      throw new Error('Duplicate collected case: ' + identity)
    }

    identities.add(identity)
    cases.push({ file: relative, title })
  }

  if (producer === 'vitest') {
    if (!Array.isArray(input)) {
      throw new Error('Malformed Vitest collection')
    }

    for (const item of input) {
      if (
        !Array.isArray(item?.titlePath) ||
        !item.titlePath.length ||
        item.titlePath.some((name) => typeof name !== 'string' || !name.trim())
      ) {
        throw new Error('Malformed Vitest collection title path')
      }

      // Match the native JSON reporter using names, never its CLI display string.
      add(item.file, item.titlePath.join(' '), item.projectName ?? '')
    }
  } else if (producer === 'node') {
    if (!Array.isArray(input)) {
      throw new Error('Malformed Node collection')
    }

    const declarations = new Map()

    const key = (file, id) => JSON.stringify([file, id])

    for (const event of input) {
      if (event?.type !== 'test:enqueue' || !event.data?.entryFile) {
        continue
      }

      const data = event.data
      const identity = key(data.entryFile, data.testId)

      if (
        !Number.isSafeInteger(data.testId) ||
        !Number.isSafeInteger(data.parentId) ||
        !['test', 'suite'].includes(data.type)
      ) {
        throw new Error('Malformed Node declaration')
      }

      if (declarations.has(identity)) {
        throw new Error('Duplicate Node declaration')
      }

      declarations.set(identity, data)
    }

    for (const data of declarations.values()) {
      if (data.type === 'suite') {
        continue
      }

      const names = [data.name]
      const visited = new Set([data.testId])
      let parentId = data.parentId

      while (parentId) {
        const parent = declarations.get(key(data.entryFile, parentId))

        if (!parent || visited.has(parentId)) {
          throw new Error('Missing or cyclic Node collection parent')
        }

        visited.add(parentId)
        names.unshift(parent.name)
        parentId = parent.parentId
      }

      if (names.some((name) => typeof name !== 'string' || !name.trim())) {
        throw new Error('Malformed Node collection title')
      }

      add(data.entryFile, names.join(' '))
    }
  } else if (producer === 'playwright') {
    if (
      !input?.config?.rootDir ||
      !Array.isArray(input.suites) ||
      !Array.isArray(input.errors) ||
      input.errors.length
    ) {
      throw new Error('Malformed Playwright collection or collection errors')
    }

    const walk = (suites, parents, depth) => {
      for (const suite of suites) {
        if (typeof suite.title !== 'string' || !Array.isArray(suite.specs)) {
          throw new Error('Malformed Playwright collection suite')
        }

        const names = depth === 0 ? parents : [...parents, suite.title]

        for (const spec of suite.specs) {
          if (
            typeof spec.file !== 'string' ||
            typeof spec.title !== 'string' ||
            !Array.isArray(spec.tests) ||
            !spec.tests.length
          ) {
            throw new Error('Malformed Playwright collected case')
          }

          for (const item of spec.tests) {
            add(
              path.resolve(input.config.rootDir, spec.file),
              [...names, spec.title].join(' '),
              item.projectName
            )
          }
        }

        if (suite.suites !== undefined) {
          if (!Array.isArray(suite.suites)) {
            throw new Error('Malformed Playwright nested suites')
          }

          walk(suite.suites, names, depth + 1)
        }
      }
    }

    walk(input.suites, [], 0)
  } else {
    throw new Error('Unsupported collection producer')
  }

  const collectedFiles = new Set(cases.map((item) => item.file))

  if (!cases.length || files.some((file) => !collectedFiles.has(file))) {
    throw new Error('Missing collected cases for required files')
  }

  return cases
}

module.exports = { collectRunnerCases }
