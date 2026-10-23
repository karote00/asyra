import { beforeEach } from 'vitest'

beforeEach(async (context) => {
  await context.annotate('Worker task updates acknowledged', 'info')
})
