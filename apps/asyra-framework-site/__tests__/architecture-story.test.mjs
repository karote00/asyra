import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'

const root = new URL('../', import.meta.url)
const read = (file) => readFile(new URL(file, root), 'utf8')

test('architecture emphasis adds no client execution or alternate runtime', async () => {
  const [component, css, page] = await Promise.all([
    read('components/architecture-story.tsx'),
    read('app/styles/architecture-story.css'),
    read('app/page.tsx')
  ])
  assert.doesNotMatch(
    component,
    /use client|useEffect|useState|setInterval|requestAnimationFrame|addEventListener|Observer|@asyra\//
  )
  assert.doesNotMatch(
    css,
    /scroll-snap|scroll-behavior|animation-duration:\s*\d/
  )
  assert.match(
    css,
    /@supports \(animation-timeline: view\(\)\) and \(timeline-scope:/
  )
  assert.match(css, /min-width: 1100px/)
  assert.match(css, /min-height: 760px/)
  assert.match(css, /prefers-reduced-motion: no-preference/)
  assert.match(css, /animation-duration: auto/)
  assert.equal((component.match(/timeline: '--/g) ?? []).length, 4)
  assert.equal(
    (component.match(/Governed Feature runtime path/g) ?? []).length,
    1
  )
  assert.doesNotMatch(page, /Governed Feature runtime path/)
  assert.ok(
    page.indexOf('id="action-film-title"') <
      page.indexOf('<ArchitectureStory />')
  )
  assert.ok(
    page.indexOf('<ArchitectureStory />') < page.indexOf('id="feature-code"')
  )
  assert.match(component, /own acknowledgement/)
  assert.match(component, /App Feature and public API/)
  assert.match(component, /Transaction and canonical owner/)
})
