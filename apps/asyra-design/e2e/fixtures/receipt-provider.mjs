#!/usr/bin/env node
// Deterministic protocol peer: no model, network, tools outside the advertised App.
import readline from 'node:readline'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { URL } from 'node:url'
if (process.argv.slice(2).join(' ') === 'debug models --bundled') {
  process.stdout.write(
    JSON.stringify({ models: [{ slug: 'fixture-model' }] }) + '\n'
  )
  process.exit(0)
}
const recorded = JSON.parse(
  readFileSync(
    new URL(
      '../../server/__tests__/fixtures/recorded-101/ordered-preparation-20261019.json',
      import.meta.url
    ),
    'utf8'
  )
)
const send = (packet) => process.stdout.write(JSON.stringify(packet) + '\n')
const pending = new Map()
const namespaces = new Map()
let sequence = 5000
const call = (tool, args) =>
  new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, (result) => {
      if (!result?.contentItems?.[0]?.text) {
        return reject(Error('Missing tool reply'))
      }
      resolve({
        success: result.success,
        value: JSON.parse(result.contentItems[0].text)
      })
    })
    send({
      id,
      method: 'item/tool/call',
      params: {
        threadId: 'fixture-thread',
        turnId: 'fixture-turn',
        callId: `fixture-${id}`,
        tool,
        namespace: namespaces.get(tool),
        arguments: args
      }
    })
  })
async function run() {
  const anchor = await call('prepare_and_apply_design', {
    draft: {
      type: 'group',
      name: 'Receipt fixture anchor',
      children: [
        { type: 'rect', key: 'anchor', name: 'Anchor', width: 10, height: 10 }
      ]
    },
    inspection: 'defer'
  })
  const root = anchor.value.actionResults.find(
    (r) => r.actionName === 'apply_prepared_design'
  ).result.compositionId
  const input = JSON.parse(JSON.stringify(recorded.input))
  input.inspection = 'defer'
  input.parts.forEach((part) => {
    part.parentId = root
  })
  const failure = await call('prepare_and_apply_design', input)
  const crown = failure.value.parts[0].actionResults.find(
    (r) => r.actionName === 'apply_prepared_design'
  ).result.compositionId
  const checkSelection = { ids: [`measurement:${crown}`] }
  const before = await call('read_design_checks', checkSelection)
  const rejected = failure.value.parts?.[1]
  let repaired
  if (rejected?.draftId) {
    const children = input.parts[1].draft.children.flatMap((child) => {
      if (child.type !== 'projected-face') {
        return [child]
      }
      return child.vertices.slice(2).map((vertex, index) => ({
        ...child,
        key: `${child.key}-triangle-${index}`,
        vertices: [child.vertices[0], child.vertices[index + 1], vertex]
      }))
    })
    repaired = await call('prepare_and_apply_design', {
      parts: [
        {
          key: 'base-details',
          parentId: root,
          repair: {
            draftId: rejected.draftId,
            replacements: [{ path: '/children', value: children }]
          }
        }
      ],
      inspection: 'defer'
    })
  }
  const after = await call('read_design_checks', checkSelection)
  return { anchor, failure, before, repaired, after }
}
const lines = readline.createInterface({ input: process.stdin })
lines.on('line', async (line) => {
  try {
    const packet = JSON.parse(line)
    if (pending.has(packet.id)) {
      const accept = pending.get(packet.id)
      pending.delete(packet.id)
      accept(packet.result)
      return
    }
    if (packet.id === undefined) {
      return
    }
    let result = {}
    if (packet.method === 'config/read') {
      result = { config: {} }
    }
    if (packet.method === 'account/read') {
      result = { account: { type: 'chatgpt', email: 'fixture@example.test' } }
    }
    if (packet.method === 'thread/start') {
      for (const group of packet.params.dynamicTools) {
        for (const tool of group.tools) {
          namespaces.set(tool.name, group.name)
        }
      }
    }
    if (packet.method === 'thread/start') {
      result = {
        thread: { id: 'fixture-thread' },
        model: packet.params.model,
        reasoningEffort: 'medium',
        instructionSources: [],
        runtimeWorkspaceRoots: []
      }
    }
    if (packet.method === 'turn/start') {
      result = { turn: { id: 'fixture-turn' } }
    }
    send({ id: packet.id, result })
    if (packet.method === 'turn/start') {
      const report = await run()
      send({
        method: 'item/completed',
        params: {
          threadId: 'fixture-thread',
          turnId: 'fixture-turn',
          item: {
            id: 'fixture-final',
            type: 'agentMessage',
            phase: 'final_answer',
            text: JSON.stringify({
              batchId: 'receipt-fixture-outcome',
              actions: [
                {
                  id: 'outcome',
                  name: 'report_outcome',
                  arguments: {
                    outcome: 'unsupported',
                    message: JSON.stringify(report)
                  },
                  summary: 'Deterministic integration evidence'
                }
              ]
            })
          }
        }
      })
      send({
        method: 'turn/completed',
        params: {
          threadId: 'fixture-thread',
          turnId: 'fixture-turn',
          turn: { id: 'fixture-turn', status: 'completed' }
        }
      })
    }
  } catch (error) {
    process.stderr.write(String(error) + '\n')
    process.exitCode = 1
    lines.close()
  }
})
