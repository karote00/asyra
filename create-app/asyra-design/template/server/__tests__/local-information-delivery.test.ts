import { expect, it } from 'vitest'
import {
  deliverInformation,
  informationDeliveryBytes
} from '../local-information-delivery'

it('reassembles escaped multibyte JSON without dropping a byte', () => {
  const raw = JSON.stringify({
    required: 'Complete constraint',
    text: '材質🌲\\"\n'.repeat(10000)
  })
  let args: Record<string, unknown> = { names: ['tool'] },
    text = '',
    offset = 0
  for (let i = 0; i < 50; i++) {
    const output = deliverInformation(
      raw,
      'describe_design_apis',
      args,
      'request'
    )
    expect(Buffer.byteLength(output)).toBeLessThanOrEqual(
      informationDeliveryBytes
    )
    const p = JSON.parse(output).contentDelivery
    expect(p.startByte).toBe(offset)
    text += p.text
    offset = p.endByte
    if (p.lastPage) {
      expect(offset).toBe(Buffer.byteLength(raw))
      break
    }
    args = p.next.arguments
  }
  expect(text).toBe(raw)
})

it('rejects changed source, cross-query, cross-request and invalid continuations', () => {
  const raw = JSON.stringify({ text: 'constraint '.repeat(6000) })
  const next = JSON.parse(
    deliverInformation(raw, 'read_knowledge', { ids: ['one'] }, 'request')
  ).contentDelivery.next.arguments
  expect(() =>
    deliverInformation(raw + ' ', 'read_knowledge', next, 'request')
  ).toThrow(/stale/)
  expect(() =>
    deliverInformation(
      raw,
      'read_knowledge',
      { ...next, ids: ['other'] },
      'request'
    )
  ).toThrow(/stale/)
  expect(() =>
    deliverInformation(raw, 'read_knowledge', next, 'other')
  ).toThrow(/stale/)
  for (const offset of [-1, Buffer.byteLength(raw), 0.5])
    expect(() =>
      deliverInformation(
        raw,
        'read_knowledge',
        { ...next, contentPage: { ...next.contentPage, offset } },
        'request'
      )
    ).toThrow()
  expect(deliverInformation(raw, 'read_knowledge', next, 'request')).toBe(
    deliverInformation(raw, 'read_knowledge', next, 'request')
  )
})
