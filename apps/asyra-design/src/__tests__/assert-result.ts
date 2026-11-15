import assert from 'node:assert/strict'
import { isRecord } from '@asyra/utils'

export const requiredRecord = (value: unknown): Record<string, unknown> => {
  assert.ok(isRecord(value), 'Expected an object result')

  return value
}

export const requiredArray = (value: unknown): readonly unknown[] => {
  assert.ok(Array.isArray(value), 'Expected an array result')

  return value
}

export const requiredString = (value: unknown): string => {
  assert.ok(
    typeof value === 'string' && value.length > 0,
    'Expected a non-empty result identifier'
  )

  return value
}

export const requiredNumber = (value: unknown): number => {
  assert.ok(
    typeof value === 'number' && Number.isFinite(value),
    'Expected a finite result number'
  )

  return value
}
