import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { URL, fileURLToPath } from 'node:url'

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const repository = fs.realpathSync(
  fileURLToPath(new URL('../../../../', import.meta.url))
)
const inside = (root, file) => file.startsWith(root + path.sep)
const text = (value) => typeof value === 'string' && value.trim().length > 0
function requireValue(condition, message) {
  if (!condition) throw new Error('Invalid assessment: ' + message)
}
function object(value, required, optional = []) {
  requireValue(
    value && typeof value === 'object' && !Array.isArray(value),
    'expected object'
  )
  requireValue(
    required.every((key) => Object.hasOwn(value, key)) &&
      Object.keys(value).every((key) =>
        [...required, ...optional].includes(key)
      ),
    'unsupported or missing fields'
  )
}
function strings(value) {
  requireValue(
    Array.isArray(value) && value.length <= 100 && value.every(text),
    'expected bounded text list'
  )
}
function reference(directory, ref) {
  object(ref, ['root', 'path', 'sha256'], ['pointer', 'lines'])
  requireValue(
    text(ref.root) &&
      text(ref.path) &&
      !path.isAbsolute(ref.root) &&
      !path.isAbsolute(ref.path),
    'relative evidence paths required'
  )
  const root = fs.realpathSync(path.resolve(directory, ref.root))
  requireValue(
    root === repository || inside(repository, root),
    'evidence root escapes repository'
  )
  const filename = fs.realpathSync(path.resolve(root, ref.path))
  requireValue(inside(root, filename), 'evidence escapes declared root')
  requireValue(
    fs.statSync(filename).isFile() &&
      fs.statSync(filename).size <= 32 * 1024 * 1024,
    'evidence must be a bounded file'
  )
  const bytes = fs.readFileSync(filename)
  requireValue(digest(bytes) === ref.sha256, 'evidence digest mismatch')
  requireValue(
    Object.hasOwn(ref, 'pointer') !== Object.hasOwn(ref, 'lines'),
    'one exact locator required'
  )
  let value
  if (Object.hasOwn(ref, 'pointer')) {
    requireValue(
      typeof ref.pointer === 'string' &&
        (ref.pointer === '' || ref.pointer.startsWith('/')) &&
        !/~(?:[^01]|$)/.test(ref.pointer),
      'invalid JSON pointer'
    )
    value = JSON.parse(bytes)
    for (const token of ref.pointer === ''
      ? []
      : ref.pointer.slice(1).split('/')) {
      const key = token.replaceAll('~1', '/').replaceAll('~0', '~')
      requireValue(
        value !== null &&
          typeof value === 'object' &&
          Object.hasOwn(value, key),
        'JSON pointer does not resolve'
      )
      value = value[key]
    }
  } else {
    const lines = bytes.toString('utf8').replace(/\n$/, '').split('\n')
    requireValue(
      Array.isArray(ref.lines) &&
        ref.lines.length === 2 &&
        ref.lines.every(Number.isSafeInteger),
      'invalid line range'
    )
    const [first, last] = ref.lines
    requireValue(
      first >= 1 && last >= first && last <= lines.length,
      'line range does not resolve'
    )
    value = lines.slice(first - 1, last).join('\n')
  }
  return { ...ref, value }
}

export function assessRecordedChanges(directory, filename) {
  if (!filename)
    return {
      status: 'not-assessed',
      experience: {
        decision: 'NO_ENTRY',
        reasons: ['No analyst assessment supplied.']
      },
      changes: []
    }
  requireValue(
    path.resolve(filename) !== path.resolve(directory, 'analysis.json'),
    'assessment cannot be the output file'
  )
  const bytes = fs.readFileSync(filename)
  const input = JSON.parse(bytes)
  object(input, ['version', 'runSha256', 'reviewer', 'changes'])
  requireValue(input.version === 1, 'unsupported version')
  requireValue(
    input.runSha256 ===
      digest(fs.readFileSync(path.join(directory, 'run.json'))),
    'run digest mismatch'
  )
  object(input.reviewer, ['name', 'mode'])
  requireValue(
    text(input.reviewer.name) &&
      ['self-review', 'human-review'].includes(input.reviewer.mode),
    'reviewer identity and mode required'
  )
  requireValue(
    Array.isArray(input.changes) &&
      input.changes.length > 0 &&
      input.changes.length <= 100,
    'bounded nonempty changes required'
  )
  const ids = new Set()
  const changes = input.changes.map((change) => {
    object(
      change,
      [
        'id',
        'component',
        'description',
        'method',
        'proposedEffect',
        'observation',
        'support',
        'counterevidence',
        'limitations'
      ],
      ['lesson']
    )
    requireValue(
      [change.id, change.description, change.observation].every(text) &&
        !ids.has(change.id),
      'unique change identity and observations required'
    )
    ids.add(change.id)
    requireValue(
      ['tool', 'app-guidance', 'knowledge', 'evaluation'].includes(
        change.component
      ),
      'unsupported component'
    )
    requireValue(
      [
        'single-run',
        'historical-comparison',
        'deterministic-regression'
      ].includes(change.method),
      'unsupported method'
    )
    requireValue(
      [
        'helped',
        'hurt',
        'no-observed-effect',
        'confounded',
        'not-exercised'
      ].includes(change.proposedEffect),
      'unsupported effect'
    )
    requireValue(
      change.method !== 'deterministic-regression' ||
        ['tool', 'evaluation'].includes(change.component),
      'deterministic evidence cannot establish model or Knowledge effect'
    )
    strings(change.limitations)
    const resolve = (refs) => {
      requireValue(
        Array.isArray(refs) && refs.length <= 100,
        'bounded evidence list required'
      )
      return refs.map((ref) => reference(directory, ref))
    }
    const support = resolve(change.support)
    const counterevidence = resolve(change.counterevidence)
    const reasons = []
    if (!support.length) reasons.push('No supporting evidence.')
    if (!change.limitations.length) reasons.push('No stated limits.')
    if (change.proposedEffect === 'not-exercised')
      reasons.push('Behavior was not exercised.')
    if (change.lesson) {
      object(change.lesson, ['cue', 'observation', 'reviewed'])
      requireValue(
        text(change.lesson.cue) &&
          text(change.lesson.observation) &&
          typeof change.lesson.reviewed === 'boolean',
        'invalid lesson'
      )
      if (!change.lesson.reviewed) reasons.push('Lesson not reviewed.')
    } else reasons.push('No lesson proposed.')
    const effect =
      !support.length ||
      !change.limitations.length ||
      (change.method !== 'deterministic-regression' &&
        ['helped', 'hurt'].includes(change.proposedEffect))
        ? 'confounded'
        : change.proposedEffect
    return {
      ...change,
      support,
      counterevidence,
      effect,
      claim: 'analyst-observation-not-causal-proof',
      experience: reasons.length
        ? { decision: 'NO_ENTRY', reasons }
        : {
            decision: 'retain',
            scope: 'observed-only',
            cue: change.lesson.cue,
            observation: change.lesson.observation,
            support,
            counterevidence,
            limitations: change.limitations,
            reviewer: input.reviewer
          }
    }
  })
  return {
    status: 'assessed',
    runSha256: input.runSha256,
    assessmentSha256: digest(bytes),
    reviewer: input.reviewer,
    interpretation:
      'Evidence identity and locators are verified; relevance and truth remain analyst judgments.',
    changes
  }
}
