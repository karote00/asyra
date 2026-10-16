/* eslint-disable @typescript-eslint/no-require-imports */
// A custom producer can replace this predicate with any real verification.
const { openProject } = require('../store.cjs')
const {
  FLOW_FILE_DIRECTORY,
  FLOW_ID,
  FLOW_NODE_ID,
  FLOW_EXPECTED_REVISION,
  FLOW_BINDING,
  FLOW_EXECUTION_ID
} = process.env
const passed = process.env.FLOW_EXAMPLE_FAIL !== '1'
openProject(FLOW_FILE_DIRECTORY).update(FLOW_ID, {
  expectedRevision: Number(FLOW_EXPECTED_REVISION),
  kind: 'observation',
  value: {
    nodeId: FLOW_NODE_ID,
    criterionId: 'check',
    kind: 'automated',
    status: passed ? 'passed' : 'failed',
    binding: FLOW_BINDING,
    actor: 'custom-check',
    executionId: FLOW_EXECUTION_ID,
    caseId: 'order-valid',
    summary: passed ? 'Order verified' : 'Order verification failed',
    at: new Date().toISOString()
  }
})
process.exitCode = passed ? 0 : 1
