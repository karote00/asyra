import assert from 'node:assert/strict'
import test from 'node:test'
import { ESLint } from 'eslint'
import { fileURLToPath, URL } from 'node:url'

test('ESLint excludes generated templates while checking create-app owners', async () => {
  const cwd = fileURLToPath(new URL('../../', import.meta.url))
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: `${cwd}eslint.config.js`
  })

  for (const product of ['starter-app', 'asyra-design']) {
    assert.equal(
      await eslint.isPathIgnored(`create-app/${product}/template/src/main.ts`),
      true
    )
    assert.equal(
      await eslint.isPathIgnored(`create-app/${product}/bin/index.js`),
      false
    )
  }
})
