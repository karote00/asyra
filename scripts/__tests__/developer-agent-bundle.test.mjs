import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import {
  checkBundle,
  createBundle,
  inspectPlugin,
  inspectSkill,
  exportSkill,
  renderReference,
  writeBundle
} from '../developer-agent-bundle.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PLUGIN = 'plugins/asyra-agent'
const SKILL = 'skills/asyra-agent'
const RECORD = `${PLUGIN}/${SKILL}/bundle.json`
const scratch = path.join(ROOT, 'tmp/developer-agent-tests')
fs.mkdirSync(scratch, { recursive: true })
const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8')
const write = (root, file, bytes) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), bytes)
}
const saveJson = (root, file, value) =>
  write(root, file, JSON.stringify(value, null, 2) + '\n')
function fixture() {
  const root = fs.mkdtempSync(path.join(scratch, 'case-'))
  fs.cpSync(path.join(ROOT, PLUGIN), path.join(root, PLUGIN), {
    recursive: true
  })
  const { documents } = JSON.parse(read(ROOT, `${PLUGIN}/bundle.config.json`))
  for (const file of [
    ...documents,
    'docs/public/generated/package-reference.json',
    '.agents/plugins/marketplace.json',
    '.claude-plugin/marketplace.json'
  ])
    write(root, file, read(ROOT, file))
  return root
}
function changeVersion(root, version) {
  const file = `${PLUGIN}/bundle.config.json`
  const value = JSON.parse(read(root, file))
  value.identity.version = version
  saveJson(root, file, value)
}

test('maintained plugin is current, self-contained and has valid local reference links', () => {
  const record = checkBundle(ROOT)
  assert.equal(
    record.referenceVersions['@asyra/core'],
    JSON.parse(read(ROOT, 'packages/core/package.json')).version
  )
  const destination = fs.mkdtempSync(path.join(scratch, 'standalone-'))
  fs.cpSync(path.join(ROOT, PLUGIN), path.join(destination, 'plugin'), {
    recursive: true
  })
  const plugin = path.join(destination, 'plugin')
  assert.deepEqual(inspectPlugin(plugin), record)
  for (const relative of Object.keys(record.files).filter((file) =>
    file.endsWith('.md')
  )) {
    const source = read(plugin, relative).replace(/```[\s\S]*?```/g, '')
    for (const [, href] of source.matchAll(
      /(?<!!)\[[^\]\n]+\]\(([^\s)]+)\)/g
    )) {
      if (/^(https?:|#)/.test(href)) continue
      const target = path.resolve(
        plugin,
        path.dirname(relative),
        href.split('#')[0]
      )
      assert.ok(
        target.startsWith(plugin + path.sep),
        `Escaping link: ${relative} -> ${href}`
      )
      assert.ok(fs.existsSync(target), `Missing link: ${relative} -> ${href}`)
    }
  }
})

test('standalone consumers receive the complete maintained Starter architecture', () => {
  const source = 'apps/starter-app/docs/ARCHITECTURE.md'
  const { documents } = JSON.parse(read(ROOT, `${PLUGIN}/bundle.config.json`))
  assert.ok(
    documents.includes(source),
    'Complete App architecture must be bundled'
  )
  const root = fixture()
  writeBundle(root)
  const directory = fs.mkdtempSync(path.join(scratch, 'relocated-'))
  const plugin = path.join(directory, 'custom-cache', 'developer', 'candidate')
  fs.cpSync(path.join(root, PLUGIN), plugin, { recursive: true })
  const record = inspectPlugin(plugin)
  const skillFile = path.join(plugin, SKILL, 'SKILL.md')
  const skill = fs.readFileSync(skillFile, 'utf8')
  const links = [...skill.matchAll(/\[[^\]\n]+\]\(([^\s)]+)\)/g)]
  const architecture = links.find(([, href]) => href.endsWith(source))
  assert.ok(
    architecture,
    'The loaded Skill must route to the architecture guide'
  )
  const resolved = path.resolve(path.dirname(skillFile), architecture[1])
  assert.equal(
    fs.readFileSync(resolved, 'utf8'),
    renderReference(source, read(ROOT, source), documents)
  )
  assert.ok(record.inputs[source])
  write(root, source, read(root, source) + '\nUpdated architecture contract.\n')
  assert.throws(() => checkBundle(root), /Stale bundle/)
})

test('the guide allowlist rejects unrelated private App documents', () => {
  const root = fixture()
  const file = `${PLUGIN}/bundle.config.json`
  const config = JSON.parse(read(root, file))
  config.documents.push('apps/starter-app/docs/private-notes.md')
  saveJson(root, file, config)
  assert.throws(() => createBundle(root), /Unapproved guide source/)
})

test('same inputs reproduce identical bytes; document changes require regeneration and a release bump', () => {
  const root = fixture()
  const baseline = checkBundle(root)
  assert.deepEqual(createBundle(root).record, baseline)
  writeBundle(root)
  assert.deepEqual(checkBundle(root), baseline)
  const guide = 'docs/public/learn/canonical-state.md'
  write(root, guide, read(root, guide) + '\nNew documented boundary.\n')
  assert.throws(() => checkBundle(root), /Stale bundle/)
  writeBundle(root)
  assert.throws(() => checkBundle(root, baseline), /bump the plugin version/)
  const nextVersion = baseline.pluginVersion.replace(/\d+$/, (patch) =>
    String(Number(patch) + 1)
  )
  changeVersion(root, nextVersion)
  writeBundle(root)
  assert.equal(checkBundle(root, baseline).pluginVersion, nextVersion)
  const later = checkBundle(root)
  changeVersion(root, '0.1.0')
  writeBundle(root)
  assert.throws(() => checkBundle(root, later), /older/)
})

test('Skill changes are versioned and package reference changes invalidate the bundle', () => {
  const root = fixture()
  const baseline = checkBundle(root)
  write(
    root,
    `${PLUGIN}/${SKILL}/SKILL.md`,
    read(root, `${PLUGIN}/${SKILL}/SKILL.md`) + '\nAdditional guidance.\n'
  )
  assert.throws(() => checkBundle(root), /Changed or stale/)
  writeBundle(root)
  assert.throws(() => checkBundle(root, baseline), /bump/)
  const inventory = JSON.parse(
    read(root, 'docs/public/generated/package-reference.json')
  )
  inventory.packages.find((item) => item.name === '@asyra/core').version =
    '99.0.0'
  saveJson(root, 'docs/public/generated/package-reference.json', inventory)
  assert.throws(() => checkBundle(root), /Stale bundle/)
})

test('missing inputs fail before any generated file is replaced', () => {
  const root = fixture()
  const before = read(root, RECORD)
  fs.unlinkSync(path.join(root, 'docs/public/build/ai-actions.md'))
  assert.throws(() => writeBundle(root), /ENOENT/)
  assert.equal(read(root, RECORD), before)
})

test('unlisted files and secrets never enter a deliverable', () => {
  const root = fixture()
  write(root, `${PLUGIN}/.env`, 'secret=fixture-only')
  assert.throws(() => checkBundle(root), /Unexpected plugin file/)
  assert.throws(() => writeBundle(root), /unexpected or modified file/)
  assert.equal(read(root, `${PLUGIN}/.env`), 'secret=fixture-only')
})

test('source traversal and symlinked destinations cannot escape the checkout', () => {
  const root = fixture()
  saveJson(root, `${PLUGIN}/bundle.config.json`, {
    ...JSON.parse(read(root, `${PLUGIN}/bundle.config.json`)),
    documents: ['docs/public/../../.env.md']
  })
  assert.throws(() => writeBundle(root), /Unsafe bundle path/)
  const clean = fixture()
  const destination = path.join(clean, PLUGIN, SKILL, 'references')
  const saved = path.join(clean, 'saved-references')
  fs.renameSync(destination, saved)
  fs.symlinkSync(saved, destination, 'dir')
  assert.throws(() => writeBundle(clean), /Symlink bundle path/)
  assert.throws(
    () => inspectPlugin(path.join(clean, PLUGIN)),
    /Symlink bundle path/
  )
})

test('symlinked input files are rejected before writes', () => {
  const root = fixture()
  const source = path.join(root, 'docs/public/learn/canonical-state.md')
  const saved = path.join(root, 'saved-guide.md')
  fs.renameSync(source, saved)
  fs.symlinkSync(saved, source)
  assert.throws(() => writeBundle(root), /Symlink bundle path/)
})

test('removed allowlist entries remove only unchanged previously generated guides', () => {
  const root = fixture()
  const config = JSON.parse(read(root, `${PLUGIN}/bundle.config.json`))
  const removed = config.documents.pop()
  saveJson(root, `${PLUGIN}/bundle.config.json`, config)
  writeBundle(root)
  assert.equal(
    fs.existsSync(path.join(root, PLUGIN, SKILL, 'references', removed)),
    false
  )
  checkBundle(root)
  const modified = fixture()
  saveJson(modified, `${PLUGIN}/bundle.config.json`, config)
  write(
    modified,
    `${PLUGIN}/${SKILL}/references/${removed}`,
    'local user change'
  )
  assert.throws(() => writeBundle(modified), /unexpected or modified file/)
  assert.equal(
    read(modified, `${PLUGIN}/${SKILL}/references/${removed}`),
    'local user change'
  )
})

test('invalid versions, record formats and marketplace paths reject', () => {
  const root = fixture()
  changeVersion(root, 'latest')
  assert.throws(() => writeBundle(root), /version/)
  changeVersion(root, '0.1.0')
  const record = JSON.parse(read(root, RECORD))
  record.schemaVersion = 99
  saveJson(root, RECORD, record)
  assert.throws(
    () => inspectPlugin(path.join(root, PLUGIN)),
    /Invalid bundle identity/
  )
  const clean = fixture()
  const market = JSON.parse(read(clean, '.agents/plugins/marketplace.json'))
  market.plugins[0].source.path = '../elsewhere'
  saveJson(clean, '.agents/plugins/marketplace.json', market)
  assert.throws(() => checkBundle(clean), /marketplace/)
})

test('reference conversion keeps code and bundled links, externalizes provenance links', () => {
  const source =
    '[local](b.md) [owner](../../ai/framework/README.md)\n```md\n[code](missing.md)\n```\n'
  const rendered = renderReference('docs/public/a.md', source, [
    'docs/public/a.md',
    'docs/public/b.md'
  ])
  assert.ok(rendered.includes('[local](b.md)'))
  assert.ok(rendered.includes('[code](missing.md)'))
  assert.ok(rendered.includes('target="_blank" rel="noopener noreferrer"'))
  assert.ok(
    rendered.includes(
      'https://github.com/karote00/asyra/blob/main/ai/framework/README.md'
    )
  )
})

test('CLI rejects unsupported arguments without touching its bundle', () => {
  const before = read(ROOT, RECORD)
  const result = spawnSync(
    process.execPath,
    ['scripts/developer-agent-bundle.mjs', '--write', '--unknown'],
    { cwd: ROOT, encoding: 'utf8' }
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Usage:/)
  assert.equal(read(ROOT, RECORD), before)
})

test('release listing includes bounded text, starter prompts and the packaged square icon', () => {
  const manifest = JSON.parse(read(ROOT, `${PLUGIN}/.codex-plugin/plugin.json`))
  const listing = manifest.interface
  assert.ok(listing, 'Missing release listing')
  for (const key of ['displayName', 'shortDescription'])
    assert.ok(listing[key]?.length > 0 && listing[key].length <= 30)
  assert.ok(
    listing.longDescription?.length > 0 &&
      listing.longDescription.length <= 4000
  )
  assert.ok(
    listing.developerName?.length > 0 && listing.developerName.length <= 80
  )
  assert.equal(listing.category, 'Developer Tools')
  assert.deepEqual(listing.capabilities, [])
  assert.ok(
    listing.defaultPrompt.length > 0 && listing.defaultPrompt.length <= 3
  )
  for (const prompt of listing.defaultPrompt) assert.ok(prompt.length <= 128)
  for (const key of ['logo', 'composerIcon']) {
    assert.equal(listing[key], './assets/icon.svg')
    const svg = read(ROOT, `${PLUGIN}/assets/icon.svg`)
    assert.match(svg, /viewBox="0 0 64 64"/)
    const record = JSON.parse(read(ROOT, RECORD))
    assert.ok(record.files['assets/icon.svg'])
  }
})

test('public plugin and Skill share the Asyra Agent installation identity', () => {
  const manifest = JSON.parse(read(ROOT, `${PLUGIN}/.codex-plugin/plugin.json`))
  const market = JSON.parse(read(ROOT, '.agents/plugins/marketplace.json'))
  const entry = market.plugins.find((item) => item.name === manifest.name)
  assert.equal(manifest.name, 'asyra-agent')
  assert.equal(manifest.interface.displayName, 'Asyra Agent')
  assert.equal(entry.source.path, `./${PLUGIN}`)
  assert.deepEqual(fs.readdirSync(path.join(ROOT, PLUGIN, 'skills')), [
    manifest.name
  ])
  assert.ok(
    read(ROOT, `${PLUGIN}/${SKILL}/SKILL.md`).startsWith(
      `---\nname: ${manifest.name}\n`
    )
  )
  const record = inspectPlugin(path.join(ROOT, PLUGIN))
  assert.ok(record.files[`${SKILL}/SKILL.md`])
})

test('both host manifests are generated from one neutral release identity', () => {
  const root = fixture()
  changeVersion(root, '1.2.3')
  writeBundle(root)
  const identity = JSON.parse(
    read(root, `${PLUGIN}/bundle.config.json`)
  ).identity
  for (const host of ['codex', 'claude']) {
    const file = `${PLUGIN}/.${host}-plugin/plugin.json`
    const manifest = JSON.parse(read(root, file))
    for (const [key, value] of Object.entries(identity))
      assert.deepEqual(manifest[key], value)
    manifest.version = '1.2.2'
    saveJson(root, file, manifest)
    assert.throws(() => checkBundle(root), /identity|stale/)
    writeBundle(root)
  }
  assert.equal(checkBundle(root).pluginVersion, '1.2.3')
})

test('standalone Skill is byte-identical across documented host locations', () => {
  const root = fixture()
  const record = checkBundle(root)
  for (const location of ['.agents/skills', '.claude/skills', '.grok/skills']) {
    const relative = path.posix.join('consumer', location, 'asyra-agent')
    exportSkill(root, relative)
    const destination = path.join(root, relative)
    assert.deepEqual(inspectSkill(destination), record)
    for (const file of Object.keys(record.files).filter((file) =>
      file.startsWith(`${SKILL}/`)
    ))
      assert.equal(
        read(root, `${relative}/${file.slice(SKILL.length + 1)}`),
        read(root, `${PLUGIN}/${file}`)
      )
    assert.equal(read(root, `${relative}/bundle.json`), read(root, RECORD))
    assert.ok(!fs.existsSync(path.join(destination, '.codex-plugin')))
  }
  // No source checkout or plugin manifest is needed to verify the relocated Skill.
  fs.rmSync(path.join(root, PLUGIN), { recursive: true })
  assert.deepEqual(
    inspectSkill(path.join(root, 'consumer/.grok/skills/asyra-agent')),
    record
  )
})

test('standalone inspection rejects changed, missing, extra and symlinked resources', () => {
  for (const mutation of ['changed', 'missing', 'extra', 'symlink']) {
    const root = fixture()
    exportSkill(root, 'consumer/asyra-agent')
    const destination = path.join(root, 'consumer/asyra-agent')
    const resource = 'references/apps/starter-app/docs/ARCHITECTURE.md'
    if (mutation === 'changed') write(destination, resource, 'changed')
    if (mutation === 'missing') fs.unlinkSync(path.join(destination, resource))
    if (mutation === 'extra')
      write(destination, 'private.txt', 'not distributable')
    if (mutation === 'symlink') {
      fs.renameSync(
        path.join(destination, resource),
        path.join(root, 'original.md')
      )
      fs.symlinkSync(
        path.join(root, 'original.md'),
        path.join(destination, resource)
      )
    }
    assert.throws(
      () => inspectSkill(destination),
      /stale|ENOENT|Unexpected|Symlink/
    )
  }
})

test('Skill export refuses overwrites, traversal, symlinks and stale sources', () => {
  const root = fixture()
  write(root, 'existing/keep.txt', 'user data')
  for (const destination of [
    'existing',
    '../outside',
    '/outside',
    'consumer/../outside'
  ])
    assert.throws(() => exportSkill(root, destination), /must not exist|Unsafe/)
  assert.equal(read(root, 'existing/keep.txt'), 'user data')
  fs.symlinkSync(path.join(root, 'existing'), path.join(root, 'linked'), 'dir')
  assert.throws(() => exportSkill(root, 'linked/skill'), /Symlink/)
  assert.throws(
    () => exportSkill(root, `${PLUGIN}/${SKILL}/nested`),
    /inside its source/
  )
  assert.throws(
    () => exportSkill(root, `${PLUGIN}/exported-skill`),
    /inside its source/
  )
  write(root, `${PLUGIN}/${SKILL}/SKILL.md`, 'stale')
  assert.throws(() => exportSkill(root, 'new-skill'), /stale/)
  assert.ok(!fs.existsSync(path.join(root, 'new-skill')))
})
