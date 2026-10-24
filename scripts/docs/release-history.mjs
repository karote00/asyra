import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const digest = (source) =>
  createHash('sha256').update(JSON.stringify(source)).digest('hex')
const text = (value) => typeof value === 'string' && value.trim().length > 0
const summary = (source = '') => {
  const blocks = [...source.matchAll(/```release-summary\s*\n([\s\S]*?)\n```/g)]
  assert.equal(
    blocks.length,
    1,
    'Each release page requires one release-summary block'
  )
  return JSON.parse(blocks[0][1])
}

export function assertReleaseSummaryUnchanged(before, after) {
  if (
    before?.includes('```release-summary') &&
    summary(before).status === 'verified'
  ) {
    assert.equal(
      after,
      before,
      'Published release summaries are immutable; add a correction revision'
    )
  }
}

export function readReleaseHistory({ pages, read }) {
  const paths = new Set(pages.map((page) => page.path))
  const guideDigests = new Map()
  const records = pages
    .filter((page) => page.path.startsWith('updates/releases/'))
    .map((page) => ({
      ...summary(read(page.path)),
      path: page.path,
      title: page.title
    }))
  const byId = new Map()
  for (const record of records) {
    assert.ok(
      text(record.id) && /^[a-z0-9-]+$/.test(record.id),
      'Invalid release identity'
    )
    assert.ok(!byId.has(record.id), `Duplicate release identity: ${record.id}`)
    byId.set(record.id, record)
    assert.ok(
      text(record.owner) && ['npm', 'cloudflare'].includes(record.channel),
      'Release owner and channel are required'
    )
    assert.ok(
      ['verified', 'candidate', 'modeled'].includes(record.status),
      'Invalid release availability'
    )
    assert.match(
      record.target?.sourceSha ?? '',
      /^[a-f0-9]{40}$/,
      'Release requires an exact source'
    )
    assert.ok(
      text(record.target.integrity),
      'Release requires artifact integrity'
    )
    assert.ok(
      text(
        record.channel === 'npm'
          ? record.target.version
          : record.target.deploymentId
      ),
      'Release target identity is missing'
    )
    assert.ok(
      record.previous === null ? text(record.boundary) : text(record.previous),
      'Missing predecessor or explicit supported boundary'
    )
    assert.ok(
      Array.isArray(record.requires) && Array.isArray(record.changes),
      'Release changes and prerequisites are required'
    )
    assert.ok(
      Array.isArray(record.evidence) && record.evidence.length > 0,
      'Missing durable release evidence'
    )
    for (const url of record.evidence) {
      assert.ok(
        typeof url === 'string' &&
          url.startsWith('https://') &&
          !url.includes('/actions/'),
        'Evidence must use durable public references, not expiring Actions links'
      )
    }
    const changes = new Set()
    const guides = new Set()
    for (const change of record.changes) {
      assert.ok(
        text(change.change) && !changes.has(change.change),
        'Duplicate or missing change identity'
      )
      changes.add(change.change)
      assert.ok(
        text(change.summary) && text(change.reason),
        'Changes require a summary and reason'
      )
      assert.ok(
        ['integration', 'no-action'].includes(change.impact) &&
          Array.isArray(change.guides),
        'Invalid change impact'
      )
      assert.ok(
        change.impact !== 'integration' || change.guides.length > 0,
        'Missing integration guide'
      )
      for (const guide of change.guides) {
        if (!guideDigests.has(guide)) {
          const source =
            paths.has(guide) && guide.startsWith('updates/')
              ? read(guide)
              : undefined
          assert.ok(text(source), `Missing registered guide: ${guide}`)
          assert.match(
            source,
            /^## Canonical sources\s*$/m,
            `Missing guide sources: ${guide}`
          )
          guideDigests.set(guide, digest(source))
        }
        assert.equal(
          record.guideHashes?.[guide],
          guideDigests.get(guide),
          `Release guide changed: ${guide}`
        )
        guides.add(guide)
      }
    }
    assert.deepEqual(
      Object.keys(record.guideHashes ?? {}).sort(),
      [...guides].sort(),
      'Guide hash inventory changed'
    )
  }
  const corrections = new Map()
  for (const record of records) {
    for (const id of [
      record.previous,
      record.supersedes,
      ...record.requires
    ].filter(Boolean)) {
      assert.ok(byId.has(id), `Missing release reference: ${id}`)
    }
    if (record.previous) {
      const previous = byId.get(record.previous)
      assert.ok(
        previous.owner === record.owner && previous.channel === record.channel,
        'Predecessor owner/channel mismatch'
      )
    }
    if (record.supersedes) {
      const previous = byId.get(record.supersedes)
      assert.ok(text(record.correction), 'Missing correction reason')
      assert.deepEqual(
        [record.owner, record.channel, record.target, record.previous],
        [previous.owner, previous.channel, previous.target, previous.previous],
        'Correction changed the release boundary'
      )
      assert.ok(
        previous.changes.every((change) =>
          record.changes.some((next) => next.change === change.change)
        ) && previous.requires.every((id) => record.requires.includes(id)),
        'Corrections must retain required changes and prerequisites'
      )
      if (record.status === 'verified') {
        assert.ok(
          !corrections.has(record.supersedes),
          'Ambiguous release correction'
        )
        corrections.set(record.supersedes, record.id)
      }
    }
  }
  const visiting = new Set()
  const visited = new Set()
  const visit = (id) => {
    assert.ok(!visiting.has(id), 'Release history contains a cycle')
    if (visited.has(id)) return
    visiting.add(id)
    const record = byId.get(id)
    for (const next of [
      record.previous,
      record.supersedes,
      ...record.requires
    ].filter(Boolean))
      visit(next)
    visiting.delete(id)
    visited.add(id)
  }
  records.forEach((record) => visit(record.id))
  // Corrections can redirect predecessor/prerequisite edges; validate that graph too.
  const effective = (id) => {
    while (corrections.has(id)) id = corrections.get(id)
    return id
  }
  visiting.clear()
  visited.clear()
  const visitEffective = (id) => {
    id = effective(id)
    assert.ok(!visiting.has(id), 'Corrected release history contains a cycle')
    if (visited.has(id)) return
    visiting.add(id)
    const record = byId.get(id)
    for (const next of [record.previous, ...record.requires].filter(Boolean))
      visitEffective(next)
    visiting.delete(id)
    visited.add(id)
  }
  records.forEach((record) => visitEffective(record.id))
  return records
}

// A pure documentation consumer: it reports gaps and never installs or migrates anything.
function releaseSelector(records) {
  const byId = new Map(records.map((record) => [record.id, record]))
  const corrections = new Map(
    records
      .filter((record) => record.supersedes && record.status === 'verified')
      .map((record) => [record.supersedes, record.id])
  )
  const effective = (id) => {
    while (corrections.has(id)) id = corrections.get(id)
    return byId.get(id)
  }
  return ({ from, to, pending, dependencies = {} }) => {
    const result = {
      releases: [],
      guides: [],
      prerequisites: [],
      gaps: [],
      needsInspection: pending === undefined
    }
    const start = byId.get(from)
    const target = effective(to)
    if (!start) result.gaps.push(`Unsupported baseline: ${from}`)
    if (!target) result.gaps.push(`Missing target: ${to}`)
    if (result.gaps.length) return result
    const checkedPrerequisites = new Set()
    const requirements = (record) => {
      for (const required of record.requires) {
        const prerequisite = effective(required)
        if (checkedPrerequisites.has(prerequisite.id)) continue
        checkedPrerequisites.add(prerequisite.id)
        result.prerequisites.push(prerequisite.id)
        const selection =
          dependencies[`${prerequisite.channel}:${prerequisite.owner}`]
        if (!selection?.to) {
          result.needsInspection = true
          result.gaps.push(`Missing prerequisite target: ${prerequisite.owner}`)
        } else if (effective(selection.to)?.id !== prerequisite.id) {
          result.gaps.push(
            `Incompatible prerequisite: ${prerequisite.owner} requires ${prerequisite.id}, selected ${selection.to}`
          )
        }
        collectRange(selection?.from, prerequisite, selection?.pending)
      }
    }
    const add = (record) => {
      if (record.status !== 'verified') {
        result.gaps.push(`Release unavailable: ${record.id}`)
        return
      }
      if (result.releases.includes(record.id)) return
      requirements(record)
      result.releases.push(record.id)
      result.guides.push(...record.changes.flatMap((change) => change.guides))
    }
    const chain = (end, baseline) => {
      const path = []
      let cursor = end
      while (cursor && cursor.id !== baseline?.id) {
        path.unshift(cursor)
        cursor = cursor.previous ? effective(cursor.previous) : undefined
      }
      if (baseline && !cursor)
        result.gaps.push(
          `Unsupported baseline ${baseline.id} for target ${end.id}`
        )
      return path
    }
    const collectRange = (adoptedId, end, deferredIds) => {
      const adopted = byId.get(adoptedId)
      let baseline = effective(adoptedId)
      if (
        !adopted ||
        adopted.owner !== end.owner ||
        adopted.channel !== end.channel
      ) {
        result.gaps.push(
          `Unsupported baseline ${adoptedId ?? '(missing)'} for ${end.channel}:${end.owner}`
        )
        result.needsInspection = true
        baseline = undefined
      } else if (adopted.status !== 'verified') {
        result.gaps.push(`Baseline unavailable: ${adopted.id}`)
      }
      if (end.status !== 'verified')
        result.gaps.push(`Release unavailable: ${end.id}`)
      if (deferredIds === undefined) result.needsInspection = true
      for (const id of deferredIds ?? []) {
        const deferred = effective(id)
        if (!deferred) {
          result.gaps.push(`Missing pending release: ${id}`)
          continue
        }
        for (const record of chain(deferred)) add(record)
      }
      // A correction is guidance to inspect, never evidence of actual adoption.
      if (baseline && adopted.id !== baseline.id) {
        result.needsInspection = true
        add(baseline)
      }
      for (const record of chain(end, baseline)) add(record)
      // Even an already-adopted target may have unresolved prerequisite adoption.
      requirements(end)
    }
    collectRange(from, target, pending)
    for (const key of ['guides', 'prerequisites', 'gaps'])
      result[key] = [...new Set(result[key])]
    return result
  }
}

export function selectReleaseUpdates(records, selection) {
  return releaseSelector(records)(selection)
}

export function renderReleaseHistory(records) {
  const lines = [
    '# Release History and Update Coverage',
    '',
    'This page is generated from registered, committed release summaries. It is available through the same repository and website documentation entries; it does not depend on CI artifact retention.',
    '',
    'Start with [the update guide](index.md). Identify the owner/channel and actual adopted baseline, then follow predecessor links to the requested target. Read every intervening summary and its guides in order. A version number alone does not establish coverage.',
    '',
    '## Covered deliveries',
    ''
  ]
  if (!records.some((record) => record.status === 'verified'))
    lines.push(
      'No verified release summaries are registered yet. There is no supported release-to-release range to claim. Existing Text guides are modeled integration examples, not evidence that any published version introduced Text.',
      ''
    )
  if (records.length) {
    lines.push(
      '| Summary | Owner / channel | Availability | Previous boundary | Prerequisites | Correction | Coverage |',
      '| --- | --- | --- | --- | --- | --- | --- |'
    )
    const select = releaseSelector(records)
    const byId = new Map(records.map((record) => [record.id, record]))
    const link = (id) => {
      const record = byId.get(id)
      return `[${id}](${record.path.replace(/^updates\//, '')})`
    }
    for (const record of records) {
      const selection = select({
        from: record.previous ?? record.id,
        to: record.id,
        pending: []
      })
      lines.push(
        `| ${link(record.id)} | ${record.owner} / ${record.channel} | ${record.status} | ${record.previous ? link(record.previous) : record.boundary} | ${record.requires.map(link).join(', ') || 'None declared'} | ${record.supersedes ? link(record.supersedes) + ': ' + record.correction : 'None'} | ${selection.gaps.join('; ') || 'Declared path; inspect adoption and dependency state'} |`
      )
    }
    lines.push('')
  }
  lines.push(
    '## Gaps and partial adoption',
    '',
    '- Stop if a predecessor or guide is missing, the baseline is outside the stated boundary, the target is unavailable, or a prerequisite does not match the selected dependency. Do not infer missing releases from adjacent version numbers.',
    '- Inspect installed packages, actual definitions and Features, stored document schemas and the adoption note separately. Without a note, inspect the App and sample data before deciding what is already adopted.',
    '- Keep the exact adopted guide revision in that note. A later correction must be read and checked even when its original release is already adopted; resolving a correction does not mark it adopted.',
    '- For each prerequisite owner/channel, identify its own adopted baseline, selected target and deferred changes, then follow its entire predecessor chain and nested prerequisites. A matching installed or target version is not adoption evidence. Report missing or incompatible baselines, unavailable intermediate releases and unresolved targets before integrating.',
    '- Revisit earlier summaries for retained or deferred changes even when packages are already at the target. Resolve guide corrections without dropping required conversions; retain custom fields, read/write paths, projections, Features and saved data.',
    '- Apply required migrations in their documented order; intermediate package installation is needed only when a guide explicitly requires it. Mark each change adopted, already satisfied, retained, deferred or inapplicable with a reason, and preserve that note for the next update.',
    '',
    '## Canonical sources',
    '',
    '- [Release guidance rule](../../ai/framework/rules/release-update-guidance.md)',
    '- [App-owned migration](../build/persistence-migration.md)',
    ''
  )
  return lines.join('\n')
}
