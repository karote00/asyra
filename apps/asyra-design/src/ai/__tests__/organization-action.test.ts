import { expect, it, vi } from 'vitest'
vi.mock('../../common-apis/design-organization', () => ({
  organizeDesign: vi.fn()
}))
import { createOrganizationAction } from '../organization-action'
it('forwards hierarchy requests and rejects cancelled calls before mutation', async () => {
  const organize = vi.fn(() => ({
    status: 'complete',
    operation: 'group' as const,
    groupId: 'g',
    elementIds: ['a']
  }))
  const action = createOrganizationAction(organize)
  const controller = new AbortController()
  await action.execute({ operation: 'group', elementIds: ['a'] }, {
    signal: controller.signal
  } as never)
  expect(organize).toHaveBeenCalledExactlyOnceWith({
    operation: 'group',
    elementIds: ['a']
  })
  controller.abort()
  await expect(
    action.execute({ operation: 'ungroup', elementIds: ['g'] }, {
      signal: controller.signal
    } as never)
  ).rejects.toThrow('cancelled')
  expect(organize).toHaveBeenCalledTimes(1)
})
