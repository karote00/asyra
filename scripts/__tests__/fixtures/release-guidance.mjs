import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepareGuidance, writeGuidance } from '../../release-guidance.mjs'

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
  const note = {
    change: 'candidate',
    owner: 'Framework',
    summary: 'Candidate implementation',
    sources,
    impact: 'no-action',
    guides: [],
    reason: 'Internal contract preserved'
  }
  fs.writeFileSync(
    path.join(root, 'RELEASE_NOTES.md'),
    `\`\`\`update-note\n${JSON.stringify(note)}\n\`\`\`\n`
  )
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
