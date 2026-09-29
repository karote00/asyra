import fs from 'node:fs'
import path from 'node:path'

const DISCUSSIONS_URL = 'https://github.com/karote00/asyra/discussions'
const PRIVATE_ADVISORY_URL =
  'https://github.com/karote00/asyra/security/advisories/new'
const DISCUSSIONS_LINK_PATTERN = /https?:\/\/[^\s)"']*\/discussions\b/iu

export const validateCommunityPolicy = ({
  discussionsEnabled,
  source,
  sourcePath
}) => {
  for (const [label, pattern] of [
    [
      'intended community channel',
      /GitHub Discussions is the intended public channel/u
    ],
    [
      'general Issue boundary',
      /GitHub Issues are not a\s+general public support channel/u
    ],
    [
      'external PR boundary',
      /External pull requests\s+are not accepted by\s+default/u
    ],
    ['no SLA', /\bno SLA\b/u],
    ['private security route', /security policy|SECURITY\.md/u]
  ]) {
    if (!pattern.test(source)) {
      throw new Error(`${sourcePath} is missing ${label}`)
    }
  }
  if (
    /pull requests? (?:are )?welcome|open (?:an |a new )?issue|submit (?:an |a new )?issue/iu.test(
      source
    )
  ) {
    throw new Error(`${sourcePath} invites unsupported Issues or pull requests`)
  }
  if (discussionsEnabled) {
    if (
      /Discussions is not enabled for this repository yet/u.test(source) ||
      !source.includes(
        `<a href="${DISCUSSIONS_URL}" target="_blank" rel="noopener noreferrer">`
      )
    ) {
      throw new Error(`${sourcePath} lacks a verified new-tab Discussions link`)
    }
  } else if (
    !/Discussions is not enabled for this repository yet/u.test(source) ||
    DISCUSSIONS_LINK_PATTERN.test(source)
  ) {
    throw new Error(
      `${sourcePath} must describe disabled Discussions without a link`
    )
  }
}

export const validateSupportPolicyCorpus = ({ repositoryRoot }) => {
  const root = path.resolve(repositoryRoot)
  const sources = [
    'SUPPORT.md',
    'README.md',
    'docs/public/reference/support-release.md'
  ]
  const packageNames = fs
    .readdirSync(path.join(root, 'packages'))
    .filter((name) =>
      fs.existsSync(path.join(root, 'packages', name, 'README.md'))
    )
  for (const name of packageNames) {
    sources.push(`packages/${name}/README.md`)
  }
  for (const sourcePath of sources) {
    validateCommunityPolicy({
      discussionsEnabled: false,
      source: fs.readFileSync(path.join(root, sourcePath), 'utf8'),
      sourcePath
    })
  }
  const security = fs.readFileSync(path.join(root, 'SECURITY.md'), 'utf8')
  if (!security.includes(PRIVATE_ADVISORY_URL)) {
    throw new Error('SECURITY.md is missing the private advisory route')
  }
  return sources.length
}
