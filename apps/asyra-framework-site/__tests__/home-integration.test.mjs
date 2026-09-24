import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'
import { storyChapters } from '../lib/spatial-story.mjs'
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')

test('the homepage composes one six-chapter story with server-owned resources and footer', async () => {
  const page = await read('app/page.tsx')
  assert.equal((page.match(/<SpatialStory\b/g) ?? []).length, 1)
  assert.match(page, /<HomeResources \/>/)
  assert.match(page, /footer=\{<SiteFooter \/>\}/)
  assert.doesNotMatch(
    page,
    /use client|ArchitectureStory|FrameworkValueStory|StoryNavigation|action-film/
  )
  assert.equal(storyChapters.length, 6)
  assert.equal(new Set(storyChapters.map((chapter) => chapter.id)).size, 6)
})
test('the old preview route is removed', async () => {
  await assert.rejects(
    access(new URL('../app/story/page.tsx', import.meta.url)),
    { code: 'ENOENT' }
  )
  assert.match(await read('app/page.tsx'), /styles\/spatial-story.css/)
})

test('practical resources preserve real evidence and three distinct building entry points', async () => {
  const content = await read('components/home-resources.tsx')
  for (const href of [
    '/asyra-design',
    '/docs/start/custom-composition',
    '/docs/start/create-design-app',
    '/atlas'
  ])
    assert.ok(content.includes(href))
  assert.match(content, /asyra-design-7076-product-evidence.webp/)
  assert.match(content, /loading="lazy"/)
  assert.doesNotMatch(content, /<h1|poc-story|action-film|drawTower|drawHouse/)
})
test('homepage routes source-available Starter before Design and advanced composition', async () => {
  const content = await read('components/home-resources.tsx')
  const starter = content.indexOf("title: 'Generic Starter'")
  const design = content.indexOf("title: 'Complete Design product'")
  const advanced = content.indexOf("title: 'Advanced composition'")
  assert.ok(starter > 0 && starter < design)
  assert.ok(design < advanced)
  assert.match(content, /href: '\/docs#generic-starter-source'/u)
  assert.match(content, /public npm registry/u)
  assert.doesNotMatch(
    content,
    /(?:npx|npm create|yarn create) create-asyra-app/u
  )
  assert.doesNotMatch(
    content,
    /href: ['"]https:\/\/www\.npmjs\.com\/package\/create-asyra-app/u
  )
})
test('primary navigation and page semantics survive without JavaScript', async () => {
  const story = await read('components/spatial-story.tsx')
  assert.match(story, /<details/)
  assert.match(story, /<summary/)
  assert.match(story, /aria-label="Primary navigation"/)
  for (const href of [
    '/docs',
    '/atlas',
    '/asyra-design',
    '/releases',
    '/roadmap'
  ])
    assert.ok(story.includes(`href="${href}"`))
  assert.match(story, /\{children\}/)
  assert.match(story, /\{footer\}/)
})
