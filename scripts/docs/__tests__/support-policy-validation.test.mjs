import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  validateCommunityPolicy,
  validateSupportPolicyCorpus
} from '../support-policy-validation.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)
const support = fs.readFileSync(path.join(repositoryRoot, 'SUPPORT.md'), 'utf8')

test('current support corpus keeps the disabled community and private security policy aligned', () => {
  assert.equal(validateSupportPolicyCorpus({ repositoryRoot }), 22)
})

test('disabled Discussions cannot publish a guessed destination', () => {
  assert.throws(
    () =>
      validateCommunityPolicy({
        discussionsEnabled: false,
        source: `${support}\nhttps://github.com/karote00/asyra/discussions`,
        sourcePath: 'SUPPORT.md'
      }),
    /disabled Discussions without a link/u
  )
  assert.throws(
    () =>
      validateCommunityPolicy({
        discussionsEnabled: false,
        source: support.replace(
          'Discussions is not enabled',
          'Discussions is enabled'
        ),
        sourcePath: 'SUPPORT.md'
      }),
    /disabled Discussions without a link/u
  )
})

test('enabled Discussions requires its verified destination with safe new-tab attributes', () => {
  assert.throws(
    () =>
      validateCommunityPolicy({
        discussionsEnabled: true,
        source: support,
        sourcePath: 'SUPPORT.md'
      }),
    /verified new-tab Discussions link/u
  )
  assert.doesNotThrow(() =>
    validateCommunityPolicy({
      discussionsEnabled: true,
      source: `${support.replace(/Discussions is not enabled[\s\S]*?repository enables Discussions\./u, 'Discussions is enabled for this repository.')}\n<a href="https://github.com/karote00/asyra/discussions" target="_blank" rel="noopener noreferrer">Discussions</a>`,
      sourcePath: 'SUPPORT.md'
    })
  )
})

test('support policy rejects ordinary Issues, PR invitations, missing security route and SLA ambiguity', () => {
  for (const source of [
    support.replace(
      'GitHub Issues are not a general public support channel.',
      'Open an issue for help.'
    ),
    `${support}\nPull requests are welcome.`,
    support.replace('follow [SECURITY.md](SECURITY.md)', 'post an Issue'),
    support.replace('no SLA', 'an SLA')
  ]) {
    assert.throws(() =>
      validateCommunityPolicy({
        discussionsEnabled: false,
        source,
        sourcePath: 'SUPPORT.md'
      })
    )
  }
})

test('Sim local candidate keeps coordinator and unresolved maintenance and safety duties', () => {
  const read = (relativePath) =>
    fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
  const local = read('docs/ai/apps/asyra-sim/release/LOCAL_CANDIDATE.md')
  const first = read('docs/ai/apps/asyra-sim/release/FIRST_RELEASE.md')
  const proposal = read(
    'docs/ai/apps/asyra-sim/release/MAINTENANCE_PROPOSAL.md'
  )
  assert.match(local, /person coordinating your\s+local review/u)
  assert.match(
    local,
    /maintenance owner and response\s+policy remain unapproved/u
  )
  assert.match(
    first,
    /serious-finding notification and withdrawal\/correction procedures/u
  )
  assert.match(first, /does not complete this gate/u)
  assert.match(
    proposal,
    /For serious missed findings, corrupted evidence or data loss/u
  )
  assert.match(
    proposal,
    /A future Discussions entry alone\s+does not name an owner/u
  )
})
