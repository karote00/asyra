import { expect, it } from 'vitest'
import { evaluatePolynomialTrig } from '../kinematic-trigonometry'

it('profiles four fixed scalar batches with bounded temporary growth and no result cache', () => {
  const profileStart = performance.now()
  const report = []
  for (const inputClass of ['normal', 'subnormal'] as const)
    for (const pass of ['first', 'repeated'] as const) {
      const start = performance.now()
      let evaluations = 0,
        terms = 0,
        maxBigIntBits = 0
      for (let pose = 0; pose < 100; pose++) {
        if (
          performance.now() - start > 1000 ||
          performance.now() - profileStart > 10000
        )
          throw new Error('Polynomial profile budget exceeded')
        const values =
          inputClass === 'normal'
            ? [-0.7, -0.31, 0.19, 0.4].map((x) => x + pose / 2000)
            : [1, 3, -1, -5].map(
                (x) => x * (1 + 2 * (pose % 17)) * Number.MIN_VALUE
              )
        for (const value of values)
          for (const kind of ['sin', 'cos'] as const) {
            const result = evaluatePolynomialTrig(kind, value)
            evaluations += result.work.evaluations
            terms += result.work.terms
            maxBigIntBits = Math.max(maxBigIntBits, result.work.maxBigIntBits)
          }
      }
      const milliseconds = performance.now() - start
      expect(evaluations).toBe(800)
      expect(terms).toBe(8400)
      expect(maxBigIntBits).toBeLessThanOrEqual(24000)
      expect(milliseconds).toBeLessThanOrEqual(1000)
      report.push({
        inputClass,
        pass,
        milliseconds,
        evaluations,
        terms,
        maxBigIntBits
      })
    }
  expect(performance.now() - profileStart).toBeLessThanOrEqual(10000)
  console.log('fixed polynomial scalar profile', JSON.stringify(report))
})
