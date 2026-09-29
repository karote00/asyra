// Versioned, repository-owned cases. Candidate workspaces never own the rubric.
export const formatVersion = 1
export const reviewCriteria = {
  intent: {
    layer: 'skills',
    question:
      'Does the change satisfy the request and use the referenced owner contract?'
  },
  reasoning: {
    layer: 'verification',
    question:
      'Do the tests and explanations support the claimed behavior without weakening requirements?'
  },
  handoff: {
    layer: 'skills',
    question:
      'Does HANDOFF.md explain changes, evidence, and remaining limits accurately?'
  }
}

const testHeader =
  "import assert from 'node:assert/strict'\nimport test from 'node:test'\n"

export const cases = [
  {
    id: 'docs-routing',
    title: 'Document pull request authority',
    workflow: 'docs',
    owner: 'docs/delivery.md',
    references: [
      'docs/ai/workflows/docs.md',
      'docs/ai/workflows/git-commit-push-policy.md'
    ],
    allowedFiles: ['docs/delivery.md'],
    testFiles: [],
    runtimeFiles: [],
    prompt:
      'Update docs/delivery.md to explain that a user request to create a pull request authorizes the minimum source-branch push needed for that PR. Preserve the separate authorization required for merge and publication. Keep the existing local validation requirement. Use the repository Git policy as the authority.',
    files: {
      'docs/delivery.md':
        '# Delivery\n\nRun applicable local checks before committing and pushing.\nA local commit does not authorize a remote push.\nMerge and publication each require explicit user authorization.\n',
      'policy.json':
        '{"merge":"explicit-authorization","publication":"explicit-authorization"}\n'
    }
  },
  {
    id: 'bugfix-range',
    title: 'Repair inclusive range boundaries',
    workflow: 'bugfix',
    owner: 'src/range.mjs',
    references: [
      'docs/ai/workflows/bugfix.md',
      'docs/ai/framework/rules/bugfix-test-first.md'
    ],
    allowedFiles: ['src/range.mjs', '__tests__/range.test.mjs'],
    testFiles: ['__tests__/range.test.mjs'],
    runtimeFiles: ['src/range.mjs'],
    prompt:
      'contains({min, max}, value) must include both endpoints for finite numbers with min <= max, including a zero-width range. A user reports that endpoints are rejected. Check the existing formal test, add a regression and record a failing regression checkpoint before editing runtime code, then fix the canonical range owner. Keep the regression unchanged for final verification.',
    files: {
      'src/range.mjs':
        'export function contains(range, value) {\n  return value > range.min && value < range.max\n}\n',
      '__tests__/range.test.mjs':
        testHeader +
        "import { contains } from '../src/range.mjs'\ntest('interior is included and exterior excluded', () => {\n  assert.equal(contains({min: 1, max: 3}, 2), true)\n  assert.equal(contains({min: 1, max: 3}, 4), false)\n})\n"
    }
  },
  {
    id: 'feature-ownership',
    title: 'Add display metadata without changing saved names',
    workflow: 'feature',
    owner: 'src/view.mjs',
    references: [
      'docs/ai/workflows/feature.md',
      'docs/ai/framework/rules/naming-and-persisted-identities.md'
    ],
    allowedFiles: ['src/view.mjs', '__tests__/view.test.mjs'],
    testFiles: ['__tests__/view.test.mjs'],
    runtimeFiles: ['src/view.mjs'],
    prompt:
      'Extend displayName(item, metadata) to append nonempty metadata using " - ". Omitted or empty metadata leaves the name unchanged. Preserve user-authored names exactly, including slashes and middle dots. The model owns saved names; the view owns display composition. Add formal tests. Explain whether this fixture changes an existing project Inspector contract.',
    files: {
      'src/model.mjs':
        'export function createItem(name) {\n  return { name }\n}\n',
      'src/view.mjs':
        'export function displayName(item) {\n  return item.name\n}\n',
      '__tests__/view.test.mjs':
        testHeader +
        "import { displayName } from '../src/view.mjs'\ntest('name without metadata is preserved', () => {\n  assert.equal(displayName({name: 'Example'}), 'Example')\n})\n"
    }
  }
]

export function getCase(id) {
  const entry = cases.find((candidate) => candidate.id === id)
  if (!entry) throw new Error(`Unknown case: ${id}`)
  return entry
}
