import { expect, it } from 'vitest'
import { INSTALLED_METHOD_CATALOG } from '../../../extensions/installed-methods'
import { ORIGINAL_PART_METHOD } from '../original-part-method'

it('does not execute revised resources under historical immutable method versions', () => {
  expect(ORIGINAL_PART_METHOD.version).toBe('1.0.3')
  expect(() =>
    INSTALLED_METHOD_CATALOG.resolve(ORIGINAL_PART_METHOD.id, '1.0.0')
  ).toThrow('Requested method or version is unavailable')
  expect(() =>
    INSTALLED_METHOD_CATALOG.resolve(ORIGINAL_PART_METHOD.id, '1.0.1')
  ).toThrow('Requested method or version is unavailable')
  expect(
    INSTALLED_METHOD_CATALOG.resolve(
      ORIGINAL_PART_METHOD.id,
      ORIGINAL_PART_METHOD.version
    ).descriptor
  ).toEqual(ORIGINAL_PART_METHOD)
  expect(() =>
    INSTALLED_METHOD_CATALOG.resolve(ORIGINAL_PART_METHOD.id, '1.0.2')
  ).toThrow('Requested method or version is unavailable')
})
