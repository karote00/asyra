const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

module.exports = (data) => {
  const workspace = path.resolve(__dirname, '../../workspace')
  const context = vm.createContext({})

  vm.runInContext(
    fs.readFileSync(path.join(workspace, 'workspace-bundle.data.js'), 'utf8'),
    context
  )

  const entries = context.FLOW_INSPECTOR_WORKSPACE_BUNDLE.entries
  const entry = entries.find((candidate) =>
    candidate.sourcePath.endsWith(path.basename(data.authority.inspectorPath))
  )

  assert.ok(entry, 'The current contract must be included in the React catalog')
  assert.deepEqual(JSON.parse(JSON.stringify(entry.data)), data)
  assert.equal(Object.hasOwn(entry, 'standalonePath'), false)

  return entry
}
