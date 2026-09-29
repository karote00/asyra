import { basicCoreApiContracts } from './basic-core-api-contracts'
import { basicDesignApiContracts } from './basic-design-api-contracts'
import { basicVectorApiContracts } from './basic-vector-api-contracts'

export const basicApiContracts = Object.freeze([
  ...basicCoreApiContracts,
  ...basicDesignApiContracts,
  ...basicVectorApiContracts
])
const contractsByName = new Map(
  basicApiContracts.map((contract) => [contract.name, contract])
)
if (contractsByName.size !== basicApiContracts.length)
  throw new Error('Duplicate public API action contract')
export const getBasicApiContract = (name: string) => contractsByName.get(name)
export const basicApiPermissionRules = Object.freeze(
  Object.fromEntries(
    basicApiContracts.map(({ name, effect }) => [
      name,
      effect === 'delete' ? ('confirm' as const) : ('allow' as const)
    ])
  )
)
