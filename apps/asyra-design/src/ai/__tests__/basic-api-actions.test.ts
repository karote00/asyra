import { expect, it, vi } from 'vitest'
import { createBasicApiActions } from '../basic-api-actions'
import {
  basicApiContracts,
  basicApiPermissionRules
} from '../basic-api-catalog'

it('delegates every contract in parameter order without copying inputs or injecting history flags', async () => {
  for (const contract of basicApiContracts) {
    const method = vi.fn(function (this: object, ...args: unknown[]) {
      return { receiver: this, args }
    })
    const owner = { [contract.method]: method }
    const owners = {
      core: {},
      element: {},
      selection: {},
      hierarchy: {},
      viewport: {},
      fill: {},
      stroke: {},
      [contract.owner]: owner
    }
    const action = createBasicApiActions(() => owners).find(
      (a) => a.name === contract.name
    )
    if (!action) throw new Error('Missing action')
    const args = Object.fromEntries(
      contract.parameters.map((p) => [p, { input: p }])
    )
    await action.execute(args, { signal: new AbortController().signal })
    expect(method).toHaveBeenCalledExactlyOnceWith(
      ...contract.parameters.map((p) => args[p])
    )
    for (let i = 0; i < contract.parameters.length; i++)
      expect(method.mock.calls[0][i]).toBe(args[contract.parameters[i]])
    expect(basicApiPermissionRules[contract.name]).toBe(
      contract.effect === 'delete' ? 'confirm' : 'allow'
    )
  }
})

it('cancels before dispatch and preserves null/false and owner failures', async () => {
  const method = vi
    .fn()
    .mockReturnValueOnce(null)
    .mockReturnValueOnce(false)
    .mockImplementationOnce(() => {
      throw new Error('owner failure')
    })
  const action = createBasicApiActions(() => ({
    core: {},
    element: { setVectorClosed: method },
    selection: {},
    hierarchy: {},
    viewport: {},
    fill: {},
    stroke: {}
  })).find((a) => a.name === 'api_element_setVectorClosed')
  if (!action) throw new Error('Missing action')
  await expect(
    action.execute({}, { signal: AbortSignal.abort() })
  ).rejects.toThrow()
  expect(method).not.toHaveBeenCalled()
  const context = { signal: new AbortController().signal }
  expect(
    await action.execute({ elementId: 'v', closed: true }, context)
  ).toMatchObject({ value: null })
  expect(
    await action.execute({ elementId: 'v', closed: true }, context)
  ).toMatchObject({ value: false })
  await expect(
    action.execute({ elementId: 'v', closed: true }, context)
  ).rejects.toThrow('owner failure')
})

it('reports completed basic writes and no-change reads or rejected writes', async () => {
  const method = vi.fn()
  const actions = createBasicApiActions(() => ({
    core: { getElementData: method },
    element: { setVectorClosed: method },
    selection: {},
    hierarchy: {},
    viewport: {},
    fill: {},
    stroke: {}
  }))
  const context = { signal: new AbortController().signal }
  const write = actions.find((a) => a.name === 'api_element_setVectorClosed')
  const read = actions.find((a) => a.name === 'api_core_getElementData')
  if (!write || !read) throw new Error('Missing API actions')
  expect(await write.execute({}, context)).toMatchObject({ status: 'complete' })
  method.mockReturnValueOnce(false)
  expect(await write.execute({}, context)).toMatchObject({
    status: 'no-change'
  })
  method.mockReturnValueOnce(null)
  expect(await write.execute({}, context)).toMatchObject({
    status: 'no-change'
  })
  method.mockReturnValueOnce({ id: 'v' })
  expect(await read.execute({}, context)).toMatchObject({ status: 'no-change' })
})
