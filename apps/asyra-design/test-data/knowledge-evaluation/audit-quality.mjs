/* global console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { verifyQualitySnapshot } from './quality.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const cases = JSON.parse(fs.readFileSync(path.join(here, 'quality-cases.json')))
const root = path.resolve(process.argv[2] ?? 'tmp/knowledge-evaluation')
const results = []
for (const directory of fs
  .readdirSync(root)
  .filter((name) => name.startsWith('knowledge-quality-'))) {
  const folder = path.join(root, directory)
  const run = JSON.parse(fs.readFileSync(path.join(folder, 'run.json')))
  const scenario = [...cases.development, ...cases.transfer].find(
    (item) => item.id === run.caseId
  )
  if (!scenario) {
    continue
  }
  if (run.failure || !fs.existsSync(path.join(folder, 'analysis.json'))) {
    throw new Error(`Incomplete quality capture: ${directory}`)
  }
  const analysis = JSON.parse(
    fs.readFileSync(path.join(folder, 'analysis.json'))
  )
  const snapshot = JSON.parse(fs.readFileSync(path.join(folder, 'after.json')))
  // These frozen briefs delimit exact supplied text with single quotes.
  const text = [...scenario.prompt.matchAll(/'([^']+)'/g)].map(
    (match) => match[1]
  )
  const size = /(\d+) by (\d+) px/.exec(scenario.prompt)
  if (!size || !text.length) {
    throw new Error('Frozen brief lacks an exact content oracle')
  }
  const content = verifyQualitySnapshot(snapshot, {
    width: Number(size[1]),
    height: Number(size[2]),
    text
  })
  const documents = analysis.streams
    .flatMap((stream) => stream.calls)
    .filter((call) => call.tool === 'read_knowledge')
    .flatMap((call) => call.outputValue?.documents ?? [])
  const condition =
    documents.length > 0 &&
    documents.every(
      (document) =>
        document.text.includes(
          'No additional domain advice is supplied in this evaluation condition.'
        ) ===
        (run.arm === 'quality-control')
    )
  const receipt = run.persistence
  const persistence =
    receipt?.sequence === receipt?.durableSequence &&
    Number.isInteger(receipt?.sequence)
  results.push({
    id: run.id,
    caseId: run.caseId,
    arm: run.arm,
    promptSha256: createHash('sha256').update(run.prompt).digest('hex'),
    ...content,
    condition,
    persistence,
    noBrowserErrors: run.errors.length === 0,
    outcome: run.outcome
  })
}
console.log(JSON.stringify(results, null, 2))
if (
  !results.length ||
  results.some(
    (result) =>
      !result.exactText ||
      !result.exactDimensions ||
      !result.condition ||
      !result.persistence ||
      !result.noBrowserErrors ||
      result.outcome !== 'success'
  )
) {
  process.exitCode = 1
}
