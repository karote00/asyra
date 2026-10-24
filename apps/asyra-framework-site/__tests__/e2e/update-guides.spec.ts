import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const { releaseHistory } = JSON.parse(
  readFileSync(
    new URL(
      '../../../../docs/public/generated/content-index.json',
      import.meta.url
    ),
    'utf8'
  )
) as { releaseHistory: { id: string; status: string }[] }

test('an agent can follow website discovery to the update index and Text guide', async ({
  page,
  request
}) => {
  const discovery = await request.get('/llms.txt')
  expect(discovery.ok()).toBe(true)
  const markdown = await discovery.text()
  const updateLink = markdown.match(
    /\[Update your App with an AI coding agent\]\(([^)]+)\)/
  )
  if (!updateLink)
    throw new Error('Website discovery is missing the update guide entry')
  const response = await page.goto(new URL(updateLink[1], discovery.url()).href)
  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Update your App with an AI coding agent'
    })
  ).toBeVisible()
  await page
    .getByRole('link', {
      name: 'Adopt official Text and keep extensions',
      exact: true
    })
    .click()
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Adopt Official Text and Keep Your App Extensions'
    })
  ).toBeVisible()
  await expect(page).toHaveURL(
    /\/docs\/updates\/text-official-fields-example-1-r3$/
  )
  await page.getByRole('link', { name: 'revision 2', exact: true }).click()
  await expect(page).toHaveURL(
    /\/docs\/updates\/text-official-fields-example-1-r2$/
  )
  await expect(
    page.getByText(
      /independent local-candidate acceptance passed; published-package support and subsequent updates remain unverified/
    )
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Adopt Official Text and Keep Your App Extensions'
    })
  ).toBeVisible()
})

test('Text source evidence renders as usable external links', async ({
  page
}) => {
  await page.goto('/docs/updates/text-official-fields-example-1-r3')
  const root =
    'https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/'
  const sources = [
    [
      'Typography schema and defaults',
      'packages/preset/src/props/components/text-component.ts'
    ],
    ['Text component and rendering', 'packages/preset/src/components/text.ts'],
    [
      'Text installation example',
      'apps/asyra-design/src/init/capabilities/init-text.ts'
    ],
    ['Text property controls', 'apps/asyra-design/src/properties/text.tsx'],
    ['Core composition and load APIs', 'packages/core/src/core.ts'],
    ['App migration guide', 'docs/public/build/persistence-migration.md'],
    ['Core manifest', 'packages/core/package.json'],
    ['Preset manifest', 'packages/preset/package.json'],
    ['Core entrypoint', 'packages/core/src/index.ts'],
    ['Preset entrypoint', 'packages/preset/src/index.ts'],
    ['Shared fill defaults', 'packages/utils/src/propsManager/fills.ts']
  ] as const
  for (const [label, path] of sources) {
    const link = page.getByRole('link', { name: label, exact: true })
    await expect(link).toHaveAttribute('href', `${root}${path}`)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
})

test('the subsequent guide is discoverable and retains its exact artifact and data boundaries', async ({
  page,
  request
}) => {
  const discovery = await request.get('/llms.txt')
  expect(await discovery.text()).toContain(
    '/docs/updates/text-spacing-example-2-r2'
  )
  await page.goto('/docs/updates/index')
  await page
    .getByRole('link', { name: 'subsequent Text update', exact: true })
    .click()
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Update Text Again and Preserve Intervening Extensions'
    })
  ).toBeVisible()
  await expect(
    page.getByText('test-only derived artifact', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Required verification', exact: true })
  ).toBeVisible()
  await expect(page).toHaveURL(/\/docs\/updates\/text-spacing-example-2-r2$/)
  await expect(
    page.getByText(/revision 2 existing-context rerun: 34 tests/)
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'retained delivery package', exact: true })
  ).toHaveAttribute(
    'href',
    'https://github.com/karote00/asyra/blob/main/fixtures/app-update-text-subsequent/delivery/revision-2/text-spacing-r2-independent.tar.gz'
  )
  await expect(
    page.getByRole('link', { name: 'task prompt', exact: true })
  ).toHaveAttribute(
    'href',
    'https://github.com/karote00/asyra/blob/main/fixtures/app-update-text-subsequent/delivery/revision-2/TASK-PROMPT.md'
  )
  const source = page.getByRole('link', {
    name: 'Original Text schema, validation and defaults',
    exact: true
  })
  await expect(source).toHaveAttribute('target', '_blank')
  await expect(source).toHaveAttribute('rel', 'noopener noreferrer')
  await page
    .getByRole('link', { name: 'App-owned document migration', exact: true })
    .click()
  await expect(page).toHaveURL(/\/docs\/build\/persistence-migration$/)
})

test('release history is reachable from discovery and reports declared coverage honestly', async ({
  page,
  request
}) => {
  const discovery = await request.get('/llms.txt')
  expect(discovery.ok()).toBe(true)
  expect(await discovery.text()).toContain('/docs/updates/history')
  await page.goto('/docs/updates/index')
  await page
    .getByRole('link', {
      name: 'Release history and update coverage',
      exact: true
    })
    .click()
  await expect(page).toHaveURL(/\/docs\/updates\/history$/)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Release History and Update Coverage'
    })
  ).toBeVisible()
  if (!releaseHistory.some((record) => record.status === 'verified')) {
    await expect(
      page.getByText(/No verified release summaries are registered yet/)
    ).toBeVisible()
  }
  for (const record of releaseHistory) {
    await expect(
      page.getByRole('link', { name: record.id, exact: true }).first()
    ).toBeVisible()
  }
  await expect(
    page.getByText(/Without a note, inspect the App and sample data/)
  ).toBeVisible()
  await expect(
    page.getByText(/Revisit earlier summaries for retained or deferred changes/)
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'the update guide', exact: true })
    .click()
  await expect(page).toHaveURL(/\/docs\/updates\/index$/)
})
