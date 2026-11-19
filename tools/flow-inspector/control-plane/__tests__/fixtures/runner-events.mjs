import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import process from 'node:process'

const scenario = process.env.FLOW_TEST_SCENARIO

if (scenario !== 'empty') {
  describe('first parent', () => {
    test('same child name', { skip: scenario === 'skipped' }, () => {
      assert.equal(scenario === 'failed', false)
    })
  })
  describe('second parent', () => {
    test('same child name', () => assert.equal(2 + 2, 4))
  })
}

if (scenario === 'interrupted') {
  test('process termination', () => process.exit(17))
}
