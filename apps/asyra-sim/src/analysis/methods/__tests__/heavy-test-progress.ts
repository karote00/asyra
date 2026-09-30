import { fstatSync, writeSync } from 'node:fs'

interface Receipt {
  sequence: number
  kind: 'ready' | 'progress' | 'final'
  stage: number
  work: number
  completed: number
  label: string
  outcome?: 'complete'
}

/** Test-only observer: no added logical charges, pose retention or source wrapping. */
export function createTestProgress(send: (receipt: Receipt) => void) {
  let sequence = 0
  let stage = 0
  let work = 0
  let completed = 0
  let label = 'loaded'
  let queryWork: (() => number) | undefined
  let nextReceipt = 2048
  const emit = (kind: Receipt['kind']) =>
    send({
      sequence: sequence++,
      kind,
      stage,
      work: work + (queryWork?.() ?? 0),
      completed,
      label,
      ...(kind === 'final' ? { outcome: 'complete' as const } : {})
    })
  emit('ready')
  return {
    stage(name: string) {
      if (queryWork) throw new Error('Cannot advance an unfinished query')
      label = name
      stage++
      emit('progress')
    },
    query(name: string, readWork: () => number) {
      if (queryWork) throw new Error('Cannot overlap supervised queries')
      label = name
      stage++
      // Do not read the new context before its constructor has returned.
      emit('progress')
      queryWork = readWork
      nextReceipt = 2048
      return () => {
        const current = readWork()
        if (current < nextReceipt) return
        nextReceipt = current + 2048
        emit('progress')
      }
    },
    endQuery() {
      if (!queryWork) return
      work += queryWork()
      queryWork = undefined
      emit('progress')
    },
    complete() {
      if (queryWork) throw new Error('Cannot complete an unfinished query')
      completed++
      emit('progress')
    },
    finish(expected: number) {
      if (queryWork || completed !== expected)
        throw new Error('Missing completed assertions')
      emit('final')
    }
  }
}

export function supervisedTestProgress() {
  if (process.env.TEST_SUPERVISED !== '1') return
  const fd = Number(process.env.TEST_RECEIPT_FD)
  if (!Number.isInteger(fd) || fd <= 2 || !fstatSync(fd).isFIFO())
    throw new Error('Supervised test requires its owned receipt pipe')
  return createTestProgress((receipt) => {
    const bytes = Buffer.from(JSON.stringify(receipt) + '\n')
    let offset = 0
    while (offset < bytes.length)
      offset += writeSync(fd, bytes, offset, bytes.length - offset)
  })
}
