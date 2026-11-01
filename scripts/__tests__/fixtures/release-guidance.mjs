import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepareGuidance, writeGuidance } from '../../release-guidance.mjs'

export const frameworkNotes =
  'docs/ai/framework/decisions/releases/unreleased.md'

export function appendDecision(
  root,
  {
    owner = 'docs/ai/framework',
    change = 'candidate',
    summary = 'Candidate implementation',
    impact = 'no-action',
    reason = 'Internal contract preserved',
    guides = []
  } = {}
) {
  const plan = `${owner}/plans/completed/${change}.md`
  const file = `${owner}/decisions/releases/unreleased.md`

  fs.mkdirSync(path.dirname(path.join(root, plan)), { recursive: true })
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, plan), '# Completed fixture plan\n')
  fs.appendFileSync(
    path.join(root, file),
    `## ${summary}\n\n- Release impact: ${impact}\n- Release reason: ${reason}\n- Completed record: [Plan](/${plan})\n${guides.map((guide) => `- Guide: [Integration](/${guide})\n`).join('')}\n`
  )
}

export function initializeGuidance(root, packages, artifacts) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim()

  fs.writeFileSync(path.join(root, '.gitignore'), 'artifacts/\ntmp/\n')
  git('init', '-q')
  git('config', 'user.email', 'release-fixture@example.test')
  git('config', 'user.name', 'Release fixture')
  git('add', '.')
  git('commit', '-qm', 'Previous successful source')
  const baselineSha = git('rev-parse', 'HEAD')
  const sources = packages.map(
    (pkg) => `packages/${pkg.name.split('/')[1]}/package.json`
  )

  for (const source of sources) {
    const file = path.join(root, source)
    const value = JSON.parse(fs.readFileSync(file, 'utf8'))

    value.description = 'Candidate change'
    fs.writeFileSync(file, JSON.stringify(value))
  }

  appendDecision(root)
  git('add', '.')
  git('commit', '-qm', 'Candidate source')
  const sourceSha = git('rev-parse', 'HEAD')
  const deliveries = packages.map((pkg) => ({
    id: pkg.name,
    roots: [`packages/${pkg.name.split('/')[1]}`],
    baseline: {
      id: pkg.name,
      version: '1.0.0',
      integrity: 'previous-integrity',
      sourceSha: baselineSha
    },
    artifact: {
      id: pkg.name,
      version: pkg.version,
      integrity: artifacts.find((item) => item.name === pkg.name).integrity
    }
  }))
  const evidence = prepareGuidance({
    root,
    owner: 'framework',
    sourceSha,
    deliveries
  })
  const evidencePath = path.join(root, 'tmp/framework-release-guidance.json')

  writeGuidance(evidencePath, evidence)

  return { git, baselineSha, sourceSha, deliveries, evidence, evidencePath }
}
