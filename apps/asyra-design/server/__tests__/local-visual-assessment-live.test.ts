import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { requestLocalVisualAssessment } from '../local-ai-provider'

it.skipIf(process.env.VISUAL_ASSESSMENT_LIVE !== 'true')(
  'calibrates whole-form review against failed drawings and accepted requested styles',
  async () => {
    const bytes = await readFile(
      new URL(
        '../../test-data/ai-drawing/visual-assessment/unfolded-structure.png',
        import.meta.url
      )
    )
    const directory = fileURLToPath(
      new URL(
        `../../../../tmp/visual-review-evaluation-${Date.now()}`,
        import.meta.url
      )
    )
    await mkdir(directory, { recursive: true })
    const cases = [
      {
        id: 'realistic-tower',
        request:
          'Draw only Taipei 101’s two uppermost large bamboo-shaped sections, plus the full crown and spire above them, as a highly detailed, realistic 2D illustration from one fixed oblique view. Use editable shapes, preserve visible façade details, and scale at 1 cm = 1 px.',
        requirement:
          'The initial massing must read as a solid building with joined façade planes and a coherent crown and spire. Judge structure only, not unfinished surface detail.',
        expected: 'fail',
        file: 'unfolded-structure.png'
      },
      {
        id: 'intentional-folded-panels',
        request:
          'Draw an intentionally abstract sculpture resembling an open book: two stacked pairs of teal folded wall panels, with a small folded-panel crown and a solid oval disk joined to a slender cone. Use flat empty faces, exaggerated slopes and an unusual view. It should not look like a realistic solid building.',
        requirement:
          'Abstract open-book wall panels with exaggerated slopes, a small folded crown, an oval and cone, and no surface detail.',
        expected: 'pass',
        file: 'unfolded-structure.png'
      }
    ]
    cases.push({
      id: 'disconnected-facades-with-weak-criterion',
      request: cases[0].request,
      requirement: 'One fixed oblique view.',
      expected: 'fail',
      file: 'disconnected-facades.png'
    })
    cases.push({
      id: 'accepted-detailed-illustration',
      request:
        'Draw Taipei 101 as a highly detailed, realistic 2D illustration from one fixed oblique view. Use editable shapes, preserve visible façade details, and scale at 1 cm = 1 px.',
      requirement:
        'A detailed, realistic 2D architectural illustration of Taipei 101. Assess the artwork on the canvas, not the surrounding application interface.',
      expected: 'pass',
      file: 'accepted-detailed-illustration.png'
    })
    cases.push({
      id: 'accepted-upper-tiers',
      request:
        'Draw only Taipei 101’s two uppermost large bamboo-shaped sections, plus the full crown and spire above them, as a highly detailed, realistic 2D illustration from a fixed elevated three-quarter view looking down at the building, with clearly visible top surfaces and consistent perspective. Use editable shapes, preserve visible façade details, and scale at 1 cm = 1 px.',
      requirement:
        'Detailed realistic 2D architectural illustration with visible facade detail and consistent elevated perspective. Assess the canvas artwork, not the application interface.',
      expected: 'pass',
      file: 'accepted-upper-tiers.png'
    })
    const results = []
    for (const item of cases.filter(
      (item) =>
        !process.env.VISUAL_ASSESSMENT_CASE ||
        item.id === process.env.VISUAL_ASSESSMENT_CASE
    )) {
      const imageBytes =
        item.file === 'unfolded-structure.png'
          ? bytes
          : await readFile(
              new URL(
                '../../test-data/ai-drawing/visual-assessment/' + item.file,
                import.meta.url
              )
            )
      const result = await requestLocalVisualAssessment(
        {
          request: item.request,
          phase: item.id.startsWith('accepted-') ? 'visual' : 'structure',
          criteria: { structure: { requirement: item.requirement } },
          images: [
            {
              role: 'overview',
              dataUrl: `data:image/png;base64,${imageBytes.toString('base64')}`
            }
          ]
        },
        {
          model: process.env.AI_PROVIDER_MODEL || 'gpt-6-astra',
          executable: process.env.AI_PROVIDER_EXECUTABLE || 'codex',
          recordDirectory: resolve(directory, 'records'),
          sourceRequestId: `fixture-${item.id}`
        }
      )
      results.push({ ...item, result })
      await writeFile(
        resolve(directory, `results-${item.id}.json`),
        JSON.stringify(results, null, 2)
      )
    }
    expect(results.length).toBeGreaterThan(0)
    for (const item of results) {
      expect(item.result.overall.status, item.id).toBe(item.expected)
      if (item.id !== 'disconnected-facades-with-weak-criterion')
        expect(item.result.checks[0].status, item.id).toBe(item.expected)
    }
  },
  180_000
)
