#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const PLUGIN = 'plugins/asyra-agent'
const SKILL = 'skills/asyra-agent'
const RECORD = `${SKILL}/bundle.json`
const MANIFEST = '.codex-plugin/plugin.json'
const CLAUDE_MANIFEST = '.claude-plugin/plugin.json'
const INVENTORY = 'docs/public/generated/package-reference.json'
const STATIC_FILES = [
  MANIFEST,
  CLAUDE_MANIFEST,
  'bundle.config.json',
  'README.md',
  'CHANGELOG.md',
  'assets/icon.svg',
  `${SKILL}/SKILL.md`
]
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const json = (value) => JSON.stringify(value, null, 2) + '\n'
const fail = (message) => {
  throw new Error(message)
}

// Reject traversal and symlinks before reading or writing any bundle path.
function contained(root, relative) {
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.includes('\\') ||
    relative.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    fail(`Unsafe bundle path: ${relative}`)
  }
  let current = path.resolve(root)
  if (fs.lstatSync(current).isSymbolicLink()) fail(`Symlink root: ${current}`)
  for (const part of relative.split('/')) {
    current = path.join(current, part)
    if (
      fs.existsSync(current) ||
      fs.lstatSync(current, { throwIfNoEntry: false })
    ) {
      if (fs.lstatSync(current).isSymbolicLink())
        fail(`Symlink bundle path: ${relative}`)
    }
  }
  return current
}
function read(root, relative) {
  return fs.readFileSync(contained(root, relative), 'utf8')
}
function filesUnder(root, relative = '') {
  const directory = relative ? contained(root, relative) : root
  if (!fs.existsSync(directory)) return []
  return fs
    .readdirSync(directory)
    .sort()
    .flatMap((name) => {
      const child = relative ? `${relative}/${name}` : name
      const stat = fs.lstatSync(contained(root, child))
      if (stat.isDirectory()) return filesUnder(root, child)
      if (!stat.isFile()) fail(`Not a regular file: ${child}`)
      return [child]
    })
}
function version(value) {
  if (
    typeof value !== 'string' ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
  )
    fail('Expected a three-part plugin version')
  const parts = value.split('.').map(Number)
  if (!parts.every(Number.isSafeInteger))
    fail('Plugin version exceeds safe integer range')
  return parts
}
function manifestAt(directory) {
  const manifest = JSON.parse(read(directory, MANIFEST))
  version(manifest.version)
  if (
    manifest.name !== 'asyra-agent' ||
    manifest.skills !== './skills/' ||
    !manifest.author?.name ||
    !manifest.description
  )
    fail('Invalid developer plugin manifest')
  return manifest
}
const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

export function renderReference(sourcePath, source, documents) {
  let fence = null
  const body = source
    .split('\n')
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)
      if (marker) {
        if (!fence) fence = marker[1]
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
          fence = null
        return line
      }
      if (fence) return line
      return line.replace(
        /(?<!!)\[([^\]\n]+)\]\(([^\s)]+)\)/g,
        (original, label, href) => {
          if (href.startsWith('#')) return original
          let target = href
          if (!/^[a-z][a-z\d+.-]*:/i.test(href)) {
            const [file, fragment] = href.split('#')
            const resolved = path.posix.normalize(
              path.posix.join(path.posix.dirname(sourcePath), file)
            )
            if (documents.includes(resolved)) return original
            if (resolved.startsWith('../') || resolved.startsWith('/'))
              fail(`Reference leaves repository: ${href}`)
            target =
              'https://github.com/karote00/asyra/blob/main/' +
              resolved +
              (fragment ? '#' + fragment : '')
          }
          if (!/^https:\/\//.test(target))
            fail(`Unsupported link in ${sourcePath}: ${href}`)
          return `<a href="${escapeHtml(target)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
        }
      )
    })
    .join('\n')
  return `<!-- Generated from ${sourcePath}; edit the source and regenerate. External links may describe a newer revision. -->\n\n${body}`
}

export function bundleInputPaths(root) {
  const config = JSON.parse(read(contained(root, PLUGIN), 'bundle.config.json'))
  return [...config.documents, INVENTORY]
}

export function createBundle(root) {
  const directory = contained(root, PLUGIN)
  const config = JSON.parse(read(directory, 'bundle.config.json'))
  const identity = config.identity
  version(identity?.version)
  if (
    identity.name !== 'asyra-agent' ||
    !identity.author?.name ||
    !identity.description ||
    !identity.license ||
    !config.codexInterface
  )
    fail('Invalid shared Agent identity')
  const manifest = {
    ...identity,
    skills: './skills/',
    interface: config.codexInterface
  }
  const documents = config.documents
  if (
    !Array.isArray(documents) ||
    !documents.length ||
    new Set(documents).size !== documents.length
  )
    fail('Invalid document allowlist')
  for (const source of documents) {
    if (
      typeof source !== 'string' ||
      !/^(docs\/public\/.*\.md|apps\/starter-app\/docs\/(?:ONBOARDING|ARCHITECTURE)\.md)$/.test(
        source
      )
    )
      fail(`Unapproved guide source: ${source}`)
    contained(root, source)
  }
  const outputs = new Map()
  outputs.set(MANIFEST, json(manifest))
  outputs.set(CLAUDE_MANIFEST, json(identity))
  const inputs = {}
  const files = {}
  for (const relative of STATIC_FILES)
    files[relative] = hash(outputs.get(relative) ?? read(directory, relative))
  for (const source of [...documents].sort()) {
    const bytes = read(root, source)
    inputs[source] = hash(bytes)
    const relative = `${SKILL}/references/${source}`
    const rendered = renderReference(source, bytes, documents)
    outputs.set(relative, rendered)
    files[relative] = hash(rendered)
  }
  const inventoryBytes = read(root, INVENTORY)
  const inventory = JSON.parse(inventoryBytes)
  const referenceVersions = {}
  for (const item of inventory.packages) {
    if (
      !item.name?.startsWith('@asyra/') ||
      typeof item.version !== 'string' ||
      referenceVersions[item.name]
    )
      fail('Invalid public package inventory')
    referenceVersions[item.name] = item.version
  }
  if (!referenceVersions['@asyra/core'])
    fail('Public package inventory is missing Core')
  const bundleIdentity = {
    schemaVersion: 1,
    pluginVersion: manifest.version,
    inputs,
    referenceVersions: Object.fromEntries(
      Object.entries(referenceVersions).sort(([a], [b]) => a.localeCompare(b))
    ),
    files
  }
  const record = {
    ...bundleIdentity,
    contentDigest: hash(json(bundleIdentity))
  }
  outputs.set(RECORD, json(record))
  return { directory, outputs, record }
}

function checkVersion(record, baseline) {
  if (
    baseline.schemaVersion !== 1 ||
    typeof baseline.contentDigest !== 'string'
  )
    fail('Unsupported baseline record')
  const current = version(record.pluginVersion)
  const previous = version(baseline.pluginVersion)
  const difference =
    current
      .map((value, index) => value - previous[index])
      .find((value) => value !== 0) ?? 0
  if (difference < 0)
    fail('Plugin version is older than the selected release baseline')
  if (difference === 0 && record.contentDigest !== baseline.contentDigest)
    fail('Plugin contents changed: bump the plugin version before release')
}

export function inspectPlugin(directory) {
  const manifest = manifestAt(directory)
  const record = JSON.parse(read(directory, RECORD))
  const { contentDigest, ...identity } = record
  if (
    record.schemaVersion !== 1 ||
    record.pluginVersion !== manifest.version ||
    hash(json(identity)) !== contentDigest
  )
    fail('Invalid bundle identity')
  if (
    !record.files ||
    !STATIC_FILES.every((file) => typeof record.files[file] === 'string')
  )
    fail('Missing required plugin files')
  const expected = new Set([...Object.keys(record.files), RECORD])
  for (const relative of filesUnder(directory))
    if (!expected.has(relative)) fail(`Unexpected plugin file: ${relative}`)
  for (const [relative, digest] of Object.entries(record.files)) {
    if (hash(read(directory, relative)) !== digest)
      fail(`Changed or stale plugin file: ${relative}`)
  }
  const config = JSON.parse(read(directory, 'bundle.config.json'))
  const other = JSON.parse(read(directory, CLAUDE_MANIFEST))
  if (
    json(other) !== json(config.identity) ||
    json(manifest) !==
      json({
        ...config.identity,
        skills: './skills/',
        interface: config.codexInterface
      })
  )
    fail('Plugin adapters differ from shared Agent identity')
  return record
}

// The same record describes the full distribution. A standalone installation
// checks only its Skill subtree and never reaches into a host plugin directory.
export function inspectSkill(directory) {
  const record = JSON.parse(read(directory, 'bundle.json'))
  const { contentDigest, ...identity } = record
  version(record.pluginVersion)
  if (record.schemaVersion !== 1 || hash(json(identity)) !== contentDigest)
    fail('Invalid Skill bundle identity')
  const entries = Object.entries(record.files ?? {}).filter(([file]) =>
    file.startsWith(`${SKILL}/`)
  )
  if (!entries.some(([file]) => file === `${SKILL}/SKILL.md`))
    fail('Missing Skill entry point')
  const expected = new Set(['bundle.json'])
  for (const [file, digest] of entries) {
    const relative = file.slice(SKILL.length + 1)
    expected.add(relative)
    if (hash(read(directory, relative)) !== digest)
      fail(`Changed or stale Skill file: ${relative}`)
  }
  for (const file of filesUnder(directory))
    if (!expected.has(file)) fail(`Unexpected Skill file: ${file}`)
  return record
}

export function exportSkill(root, relative) {
  const { directory, outputs, record } = createBundle(root)
  const destination = contained(root, relative)
  if (fs.existsSync(destination))
    fail('Skill export destination must not exist')
  if (destination.startsWith(contained(root, PLUGIN) + path.sep))
    fail('Skill export cannot be inside its source')
  // Generate from canonical inputs; retained references may belong to an older release.
  // Resolve every byte before creating the destination, without mutating the checkout.
  const files = new Map([['bundle.json', outputs.get(RECORD)]])
  for (const file of Object.keys(record.files)) {
    if (file.startsWith(`${SKILL}/`))
      files.set(
        file.slice(SKILL.length + 1),
        outputs.get(file) ?? read(directory, file)
      )
  }
  fs.mkdirSync(destination, { recursive: true })
  for (const [file, bytes] of files) {
    const target = contained(destination, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, bytes)
  }
  inspectSkill(destination)
  return record
}

export function checkBundle(root, baseline) {
  const { directory, outputs, record } = createBundle(root)
  inspectPlugin(directory)
  for (const [relative, expected] of outputs)
    if (read(directory, relative) !== expected)
      fail(`Stale bundle: ${relative}; run --write`)
  const marketplace = JSON.parse(read(root, '.agents/plugins/marketplace.json'))
  const entry = marketplace.plugins?.find((item) => item.name === 'asyra-agent')
  if (
    marketplace.name !== 'asyra' ||
    entry?.source?.source !== 'local' ||
    entry.source.path !== `./${PLUGIN}` ||
    entry.policy?.installation !== 'AVAILABLE' ||
    entry.policy?.authentication !== 'ON_USE' ||
    !entry.category
  )
    fail('Invalid Asyra marketplace entry')
  if (baseline) checkVersion(record, baseline)
  const otherMarket = JSON.parse(read(root, '.claude-plugin/marketplace.json'))
  const otherEntry = otherMarket.plugins?.find(
    (item) => item.name === 'asyra-agent'
  )
  if (
    otherMarket.name !== marketplace.name ||
    !otherMarket.owner?.name ||
    otherEntry?.source !== `./${PLUGIN}`
  )
    fail('Invalid Claude marketplace entry')
  return record
}

export function writeBundle(root) {
  // Complete all source reads and validation before the first mutation.
  const { directory, outputs, record } = createBundle(root)
  const allowed = new Set([...STATIC_FILES, ...outputs.keys()])
  const previousPath = contained(directory, RECORD)
  let previous = {}
  if (fs.existsSync(previousPath)) {
    previous = JSON.parse(read(directory, RECORD))
    if (previous.schemaVersion !== 1 || !previous.files)
      fail('Invalid prior bundle')
  }
  const obsolete = []
  for (const relative of filesUnder(directory)) {
    if (allowed.has(relative)) continue
    if (
      !relative.startsWith(`${SKILL}/references/`) ||
      hash(read(directory, relative)) !== previous.files?.[relative]
    )
      fail(`Refusing to replace unexpected or modified file: ${relative}`)
    obsolete.push(relative)
  }
  for (const relative of outputs.keys()) contained(directory, relative)
  for (const relative of obsolete) fs.unlinkSync(contained(directory, relative))
  for (const [relative, bytes] of outputs) {
    const destination = contained(directory, relative)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, bytes)
  }
  return record
}

function main(args) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  if (args[0] === '--export-skill' && args.length === 2) {
    const record = exportSkill(root, args[1])
    process.stdout.write(
      `Asyra Agent ${record.pluginVersion} - Skill exported to ${args[1]}\n`
    )
    return
  }
  const [mode, flag, baselinePath, ...extra] = args
  if (
    !['--write', '--check'].includes(mode) ||
    extra.length ||
    (flag && (mode !== '--check' || flag !== '--baseline' || !baselinePath))
  )
    fail(
      'Usage: node scripts/developer-agent-bundle.mjs --write|--check [--baseline project-relative-bundle.json] | --export-skill project-relative-directory'
    )
  let record
  if (mode === '--write') record = writeBundle(root)
  else
    record = checkBundle(
      root,
      baselinePath ? JSON.parse(read(root, baselinePath)) : null
    )
  process.stdout.write(
    `Asyra Agent ${record.pluginVersion} - ${mode.slice(2)} passed - ${record.contentDigest.slice(0, 12)}\n`
  )
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(error.message + '\n')
    process.exitCode = 1
  }
}
