import process from 'node:process'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export function describeSubmission(tool, input) {
  if (!input) {
    return { kind: 'unavailable', steps: [] }
  }

  if (tool !== 'execute_design') {
    return { kind: tool, steps: [] }
  }

  const work = input.workflow ?? input

  if (work.retryDelivery) {
    return { kind: 'delivery-correction', steps: [] }
  }

  if (work.invocation) {
    return {
      kind: 'invocation',
      steps: [work.invocation.namespace + '.' + work.invocation.tool]
    }
  }

  const steps = []
  const stages = work.stages ?? [work]

  if (!Array.isArray(stages)) {
    return { kind: 'invalid-submission', steps: [] }
  }

  for (const stage of stages) {
    if (!stage || !Array.isArray(stage.operations)) {
      return { kind: 'invalid-submission', steps: [] }
    }

    steps.push(...stage.operations)
    if (stage.iteration) {
      if (!Array.isArray(stage.iteration.repairs)) {
        return { kind: 'invalid-submission', steps: [] }
      }

      steps.push(stage.iteration.check, ...stage.iteration.repairs)
    }

    if (stage.apply !== undefined) {
      if (!Array.isArray(stage.apply)) {
        return { kind: 'invalid-submission', steps: [] }
      }

      steps.push(...stage.apply)
    }
  }

  if (steps.some((step) => typeof step?.name !== 'string')) {
    return { kind: 'invalid-submission', steps: [] }
  }

  return {
    kind: 'submission',
    steps: steps.map((step) => step.name),
    ...(steps.some((step) => step.arguments?.repair?.draftId)
      ? { draftCorrection: true }
      : {})
  }
}

/** Observe returned Responses items before any diagnostic projection drops call arguments. */
export function describeResponseItem(item) {
  const entry = { type: item.type }

  if (item.type === 'tool_search_call') {
    return {
      ...entry,
      execution: item.execution,
      searchNames: item.arguments?.names
    }
  }

  if (item.type === 'web_search_call') {
    return { ...entry, action: item.action?.type }
  }

  if (item.type !== 'function_call') {
    return entry
  }

  let input

  try {
    input = JSON.parse(item.arguments)
  } catch {
    /* A malformed provider argument is observable. */
  }

  const described = describeSubmission(item.name, input)

  return {
    ...entry,
    name: item.name,
    callId: item.call_id,
    kind: described.kind,
    operations: described.steps,
    ...(described.draftCorrection ? { draftCorrection: true } : {})
  }
}

export function readRecordedSubmissions(directory) {
  const records = resolve(directory, 'provider-records')
  const rows = []
  const completions = new Map()

  for (const file of readdirSync(records).filter((name) =>
    name.endsWith('.jsonl')
  )) {
    for (const line of readFileSync(resolve(records, file), 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)) {
      const event = JSON.parse(line)
      const key = JSON.stringify([event.requestId, event.callId])
      const receipt = event.evidence?.result?.toolOutcome

      if (event.stage === 'tool_completed' && receipt) {
        completions.set(key, {
          status: receipt.status,
          settlement: receipt.settlement
        })
      }

      const activity = event.evidence?.activity

      if (event.stage === 'provider_notification' && activity?.outcome) {
        completions.set(
          JSON.stringify([event.requestId, activity.callId]),
          activity.outcome
        )
      }

      if (
        event.stage !== 'tool_started' ||
        event.diagnostic?.attribution?.actor !== 'provider' ||
        event.diagnostic.attribution.parentCallId
      ) {
        continue
      }

      const payload = event.diagnostic?.input?.payload
      let input

      if (payload?.path) {
        const path = resolve(records, payload.path)

        if (!path.startsWith(records + sep)) {
          throw Error('Invalid recorded payload path')
        }

        const raw = readFileSync(path)

        if (createHash('sha256').update(raw).digest('hex') !== payload.sha256) {
          throw Error('Recorded input digest mismatch')
        }

        input = JSON.parse(raw)
      }

      rows.push({
        key,
        at: event.recordedAt,
        callId: event.callId,
        tool: event.tool,
        bytes: payload?.bytes,
        ...describeSubmission(event.tool, input)
      })
    }
  }

  return rows
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(({ key, ...row }) => ({
      ...row,
      outcome: completions.get(key) ?? null
    }))
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const directory = process.argv[2]
  const calls = readRecordedSubmissions(directory)
  const receipts = readFileSync(
    resolve(directory, 'responses-usage.jsonl'),
    'utf8'
  )
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
  const exchanges = receipts
    .filter((row) => row.event === 'end')
    .map((row) => ({
      responseId: row.id,
      usage: row.usage,
      returned: row.output?.map(
        ({ type, name, callId, searchNames, action }) => ({
          type,
          name,
          callId,
          searchNames,
          action
        })
      )
    }))

  process.stdout.write(JSON.stringify({ exchanges, calls }, null, 2) + '\n')
}
