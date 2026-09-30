import { expect, it } from 'vitest'
import { createTestProgress } from './heavy-test-progress'

it('aggregates actual paid work without charging or emitting every checkpoint', () => {
  const records: { work: number; stage: number; completed: number }[] = []
  const observer = createTestProgress((receipt) => records.push(receipt))
  let work = 0
  const checkpoint = observer.query('control', () => work)
  for (let index = 0; index < 10000; index++) {
    checkpoint()
    work++
  }
  observer.endQuery()
  expect(work).toBe(10000)
  expect(records.length).toBeLessThan(10)
  expect(records.at(-1)?.work).toBe(10000)
  work = 0
  const next = observer.query('candidate', () => work)
  work = 300
  next()
  observer.endQuery()
  expect(records.at(-1)?.work).toBe(10300)
  observer.complete()
  observer.finish(1)
  expect(records.at(-1)?.completed).toBe(1)
})

it('unchanged checkpoints cannot manufacture progress and interruption keeps only paid work', () => {
  const records: { work: number }[] = []
  const observer = createTestProgress((receipt) => records.push(receipt))
  let work = 0
  const checkpoint = observer.query('interrupted', () => work)
  const count = records.length
  for (let index = 0; index < 10000; index++) checkpoint()
  expect(records).toHaveLength(count)
  work = 11
  observer.endQuery()
  expect(records.at(-1)?.work).toBe(11)
  expect(() => observer.finish(1)).toThrow('Missing completed assertions')
})
