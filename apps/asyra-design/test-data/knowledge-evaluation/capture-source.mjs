import { URL } from 'node:url'
import {
  ACTION_BATCH_ENDPOINT,
  AI_BATCH_RECEIPT_HEADER
} from '../../src/ai/action-batch-endpoint.ts'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

const relevant = (file) =>
  !/(^|\/)(node_modules|tmp|evidence|\.git)(\/|$)/.test(file) &&
  !/(^|\/)\.env($|\.)/.test(file) &&
  /\.(?:[cm]?js|jsx|ts|tsx|json|css|md|lock|yml)$/.test(file)

export function captureSources(root, destination) {
  const listed = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      'apps/asyra-design',
      'packages',
      'domain-knowledge',
      'package.json',
      'yarn.lock',
      '.yarnrc.yml'
    ],
    { cwd: root, maxBuffer: 16 * 1024 * 1024 }
  )
    .toString()
    .split('\0')
    .filter(Boolean)
  // App consumes package build output; capture ignored current builds as well.
  const walk = (directory) => {
    if (!fs.existsSync(directory)) return
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile()) listed.push(path.relative(root, file))
    }
  }
  const packages = path.join(root, 'packages')
  if (fs.existsSync(packages))
    for (const entry of fs.readdirSync(packages))
      walk(path.join(packages, entry, 'dist'))
  const sources = {},
    contents = {}
  for (const file of [...new Set(listed)].filter(relevant).sort()) {
    const filename = path.join(root, file)
    if (!fs.existsSync(filename)) {
      sources[file] = { deleted: true }
      continue
    }
    if (!fs.lstatSync(filename).isFile())
      throw new Error(`Source is not a regular file: ${file}`)
    const bytes = fs.readFileSync(filename)
    sources[file] = {
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex')
    }
    if (destination) contents[file] = bytes.toString('base64')
  }
  const digest = createHash('sha256')
    .update(JSON.stringify(sources))
    .digest('hex')
  if (destination)
    fs.writeFileSync(destination, gzipSync(JSON.stringify(contents)), {
      flag: 'wx'
    })
  return { digest, files: sources, archive: destination }
}

export function verifyEvaluationService(service, app) {
  if (
    !service ||
    service.cwd !== app ||
    !Number.isInteger(service.pid) ||
    service.pid < 2
  )
    throw new Error('Evaluation service ownership unavailable')
  const cwd = execFileSync(
    'lsof',
    ['-a', '-p', String(service.pid), '-d', 'cwd', '-Fn'],
    { encoding: 'utf8', timeout: 2000 }
  )
  const command = execFileSync(
    'ps',
    ['-o', 'command=', '-p', String(service.pid)],
    { encoding: 'utf8', timeout: 2000 }
  )
  if (!cwd.split('\n').includes('n' + app) || !/\bvite\b/.test(command))
    throw new Error('Evaluation service cwd or command mismatch')
  return { pid: service.pid, cwd: app, command: command.trim() }
}

/** Observe only this page's existing provider transport; never send or modify it. */
export function captureRequestIdentity(request, origin) {
  const url = new URL(request.url())
  if (
    request.method() !== 'POST' ||
    url.origin !== origin ||
    url.pathname !== ACTION_BATCH_ENDPOINT
  )
    return undefined
  // The same endpoint accepts execution receipts without starting a model request.
  // Match the server's header-presence branch before interpreting the body.
  if (request.headers()[AI_BATCH_RECEIPT_HEADER] !== undefined) return undefined
  const id = request.postDataJSON()?.metadata?.sourceRequestId
  if (typeof id !== 'string' || !id.trim())
    throw new Error('Provider request has no source identity')
  return id
}
