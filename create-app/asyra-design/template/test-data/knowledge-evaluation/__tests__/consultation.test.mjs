import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { URL } from 'node:url'
import { createHash } from 'node:crypto'
import {
  consultationScenario,
  runConsultationPhases
} from '../run-consultation.mjs'

test('consultation shares one deadline and preserves ordinary prompts', async () => {
  const seen = []
  const result = await runConsultationPhases({
    now: () => 10,
    workDeadlineAt: 100,
    prompts: ['Direction', 'Material detail'],
    runTurn: async (input) => {
      seen.push(input)
      return { settled: true, resultSaved: true, outcome: 'success' }
    }
  })
  assert.equal(result.stopped, 'completed')
  assert.deepEqual(
    seen.map((x) => [x.prompt, x.workDeadlineAt]),
    [
      ['Direction', 100],
      ['Material detail', 100]
    ]
  )
})
test('first-turn work and capture cannot reset the work budget or start another request', async () => {
  let time = 0,
    calls = 0
  const result = await runConsultationPhases({
    now: () => time,
    workDeadlineAt: 100,
    runTurn: async () => {
      calls++
      time = 101
      return { settled: true, resultSaved: true, outcome: 'success' }
    }
  })
  assert.equal(calls, 1)
  assert.equal(result.stopped, 'work-deadline')
})
test('missing evidence or unsuccessful work does not trigger an automatic follow-up', async () => {
  for (const turn of [
    { settled: false },
    { settled: true, resultSaved: false },
    { settled: true, resultSaved: true, outcome: 'failed' }
  ]) {
    let calls = 0
    const result = await runConsultationPhases({
      now: () => 0,
      workDeadlineAt: 100,
      runTurn: async () => {
        calls++
        return turn
      }
    })
    assert.equal(calls, 1)
    assert.notEqual(result.stopped, 'completed')
  }
})

test('only the final turn receives an evaluation window; the predecessor stays ordinary', async () => {
  const seen = []
  await runConsultationPhases({
    now: () => 10,
    workDeadlineAt: 100,
    reportTimeoutMs: 60,
    runTurn: async (input) => {
      seen.push(input)
      return { settled: true, resultSaved: true, outcome: 'no-change' }
    }
  })
  assert.equal(seen.length, 2)
  assert.equal(seen[0].evaluationWindow, undefined)
  assert.deepEqual(seen[1].evaluationWindow, {
    workDeadlineAt: 100,
    reportTimeoutMs: 60
  })
})

test('a predecessor deadline failure never dispatches the next model request', async () => {
  let calls = 0
  await assert.rejects(
    runConsultationPhases({
      now: () => 0,
      workDeadlineAt: 100,
      runTurn: async () => {
        calls++
        throw new Error('First work deadline')
      }
    }),
    /First work deadline/
  )
  assert.equal(calls, 1)
})

test('drawing continuity keeps frozen 101 references and separates drawing from follow-up', () => {
  const scenario = consultationScenario(['--scenario=architecture-101'])
  assert.equal(scenario.id, 'taipei-101-continuity')
  assert.equal(scenario.prompts.length, 2)
  assert.match(scenario.prompts[0], /Draw the entire Taipei 101/)
  assert.match(scenario.prompts[0], /initial editable pass/)
  assert.match(scenario.prompts[1], /Keep the existing geometry/)
  assert.equal(scenario.attachments.length, 2)
  for (const attachment of scenario.attachments) {
    const bytes = fs.readFileSync(
      new URL('../' + attachment.path, import.meta.url)
    )
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      attachment.sha256
    )
  }
  assert.equal(consultationScenario([]).attachments.length, 0)
  assert.throws(() => consultationScenario(['--scenario=unknown']), /Unknown/)
})

// Recorded drawing-continuity run 1792947710242 settled with this outcome and
// retained an editable document; its initial-finish criterion remained failed.
const retainedPartial = () => ({
  settled: true,
  resultSaved: true,
  outcome: 'partial',
  documentPath: 'turn-1-document.json',
  inputIdle: true,
  sourceRequestIds: ['631cc2c8-9d6f-4543-92dc-10028367672f'],
  answer: {
    turnId: 'conversation-b81fa870-ee33-4dea-93f5-9c7432dd4134:turn:1',
    text: 'The drawing still needs adjustment: finish: fail.',
    attribution: 'ordinary-assistant-answer'
  }
})

test('retained terminal partial initial work continues once without replay or outcome promotion', async () => {
  const first = retainedPartial()
  const seen = []
  const result = await runConsultationPhases({
    now: () => 79,
    workDeadlineAt: 120,
    prompts: ['Initial drawing', 'Refine existing materials'],
    runTurn: async (input) => {
      seen.push(input)
      return input.index === 0
        ? first
        : { settled: true, resultSaved: true, outcome: 'no-change' }
    }
  })
  assert.equal(result.stopped, 'completed')
  assert.deepEqual(
    seen.map((s) => s.prompt),
    ['Initial drawing', 'Refine existing materials']
  )
  assert.equal(first.outcome, 'partial')
  assert.equal(seen[0].evaluationWindow, undefined)
  assert.deepEqual(seen[1].evaluationWindow, {
    workDeadlineAt: 120,
    reportTimeoutMs: 60000
  })
  assert.strictEqual(result.turns[0], first)
})

test('partial continuation requires saved evidence, identity and idle input', async () => {
  for (const missing of [
    { settled: false },
    { resultSaved: false },
    { documentPath: undefined },
    { inputIdle: false },
    { sourceRequestIds: [] },
    { answer: undefined },
    { answer: { text: '', turnId: 'turn' } },
    { answer: { text: 'Initial work', turnId: '' } },
    {
      answer: {
        text: 'Diagnostic report',
        turnId: 'turn',
        attribution: 'evaluation-report'
      }
    },
    { outcome: 'failed' },
    { outcome: 'cancelled' }
  ]) {
    let calls = 0
    const result = await runConsultationPhases({
      now: () => 79,
      workDeadlineAt: 120,
      runTurn: async () => {
        calls++
        return { ...retainedPartial(), ...missing }
      }
    })
    assert.equal(calls, 1, JSON.stringify(missing))
    assert.notEqual(result.stopped, 'completed', JSON.stringify(missing))
  }
})

test('capture crossing the deadline cannot continue partial work', async () => {
  let time = 79,
    calls = 0
  const result = await runConsultationPhases({
    now: () => time,
    workDeadlineAt: 120,
    runTurn: async () => {
      calls++
      time = 120
      return retainedPartial()
    }
  })
  assert.equal(calls, 1)
  assert.equal(result.stopped, 'work-deadline')
})

test('a captured final partial report completes collection without artwork acceptance', async () => {
  const result = await runConsultationPhases({
    now: () => 79,
    workDeadlineAt: 120,
    runTurn: async ({ index }) =>
      index === 0
        ? retainedPartial()
        : {
            settled: true,
            resultSaved: true,
            outcome: 'partial',
            documentPath: 'turn-2-document.json',
            report: { text: 'Work remains.' }
          }
  })
  assert.equal(result.stopped, 'completed')
  assert.equal(result.turns.length, 2)
  assert.equal(result.turns[1].outcome, 'partial')
})
