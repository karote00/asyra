/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
function document() {
  return {
    schemaVersion: 1,
    projectId: 'example',
    flowId: 'checkout',
    revision: 0,
    definition: {
      title: 'Checkout',
      purpose: 'Accept an order',
      nodes: [
        {
          id: 'review',
          title: 'Review order',
          objective: 'Confirm the order is correct',
          owner: 'Product owner',
          required: true,
          applicable: true,
          dependsOn: [],
          criteria: [
            { id: 'accepted', title: 'Order accepted', kind: 'manual' }
          ],
          specRefs: [],
          implementationRefs: [],
          actions: []
        }
      ],
      criteria: []
    },
    current: {
      observations: [],
      notes: [],
      progress: [],
      sources: [],
      warnings: []
    }
  }
}
function directory(t) {
  const parent = path.resolve(__dirname, '../../../../tmp/flow-files-tests')
  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'case-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
module.exports = { document, directory }
