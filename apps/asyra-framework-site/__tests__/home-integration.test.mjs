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
test('homepage product evidence covers Design, FieldScope and Sim with verified scope and limits', async () => {
  const content = await read('components/home-resources.tsx')
  for (const product of ['Asyra Design', 'FieldScope', 'Asyra Sim'])
    assert.ok(content.includes(product), `Missing ${product} product case`)
  for (const claim of [
    /cucumber and tomato crops/u,
    /lane and energy assessments/u,
    /does not simulate robot patrol or harvesting/u,
    /physical\s+dynamics/u,
    /Development checkpoint - not R0/u,
    /not for\s+production or safety-critical approval/u
  ])
    assert.match(content, claim)
  for (const destination of [
    'https://github.com/karote00/asyra/blob/main/apps/fieldscope/src/domain/__tests__/crop-layout.test.ts',
    'https://asyra-sim.pages.dev',
    'https://github.com/karote00/asyra/blob/main/apps/asyra-sim/src/features/__tests__/analysis.test.ts'
  ]) {
    assert.ok(
      content.includes(destination),
      `Missing evidence destination: ${destination}`
    )
    const linkStart = content.indexOf(`href="${destination}"`)
    assert.ok(linkStart >= 0, `Missing link href: ${destination}`)
    const link = content.slice(linkStart, linkStart + 400)
    assert.match(link, /target="_blank"/u)
    assert.match(link, /rel="noopener noreferrer"/u)
  }
  await Promise.all([
    access(
      new URL(
        '../../fieldscope/src/domain/__tests__/crop-layout.test.ts',
        import.meta.url
      )
    ),
    access(
      new URL(
        '../../asyra-sim/src/features/__tests__/analysis.test.ts',
        import.meta.url
      )
    )
  ])
})
test('homepage FieldScope and Sim cases include real product screenshots', async () => {
  const content = await read('components/home-resources.tsx')
  const slider = await read('components/product-evidence-slider.tsx')
  for (const [name, file, alt] of [
    [
      'FieldScope overview',
      'public/product-evidence/fieldscope-greenhouse-overview.webp',
      'FieldScope oblique overview of the four-bay greenhouse, crop rows, and steel frame'
    ],
    [
      'FieldScope end elevation',
      'public/product-evidence/fieldscope-greenhouse-end-elevation.webp',
      'FieldScope end elevation of the four connected greenhouse bays and planted rows'
    ],
    [
      'FieldScope aisle detail',
      'public/product-evidence/fieldscope-greenhouse-internal-detail.webp',
      'FieldScope aisle view with tomato fruit, leaves, and greenhouse support structure'
    ],
    [
      'Asyra Sim',
      'public/product-evidence/asyra-sim-workcell.webp',
      'Asyra Sim synthetic six-axis robot workcell with fixture post and table'
    ]
  ]) {
    const imageOwner = content
    assert.ok(
      imageOwner.includes(file.replace('public', '')),
      `${name} image is missing`
    )
    assert.ok(imageOwner.includes(alt), `${name} image needs a descriptive alt`)
    await access(new URL(`../${file}`, import.meta.url))
  }
  assert.match(content, /same greenhouse model, shown in overview/u)
  assert.ok(content.includes('label="FieldScope"'))
  assert.ok(content.includes('slides={fieldScopeSlides}'))
  assert.ok(content.includes('label="Asyra Sim"'))
  assert.ok(content.includes('slides={simSlides}'))
  assert.match(slider, /depth === 1 \? 0\.9 : 0\.81/u)
  assert.match(slider, /translateX\(/u)
  assert.ok(slider.includes('setActiveIndex(slideIndex)'))
  assert.match(slider, /createStackSlots\(slides, activeIndex, 3\)/u)
  assert.match(slider, /createStackSlots\(slides, activeIndex, 5\)/u)
  assert.match(slider, /object-contain shadow-lg/u)
  assert.doesNotMatch(
    slider,
    /translateY|translate3d|Previous FieldScope image|Next FieldScope image/u
  )
})
test('homepage routes the published Starter before Design and advanced composition', async () => {
  const content = await read('components/home-resources.tsx')
  const starter = content.indexOf("title: 'Generic Starter'")
  const design = content.indexOf("title: 'Complete Design product'")
  const advanced = content.indexOf("title: 'Advanced composition'")
  assert.ok(starter > 0 && starter < design)
  assert.ok(design < advanced)
  assert.match(content, /href: '\/docs#generic-starter-source'/u)
  assert.match(content, /published CLI/u)
  assert.doesNotMatch(content, /not yet published/u)
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
