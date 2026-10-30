/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path')
const { openProject } = require('./store.cjs')
const { compactContext } = require('./context.cjs')
async function main(args) {
  const [command, directory, flowId, nodeId] = args
  if (!directory) {
    throw new Error(
      'Usage: cli.cjs validate|context|update|serve <flow-directory> [flow-id] [node-id or request-file]'
    )
  }
  if (command === 'migrate') {
    const request = JSON.parse(fs.readFileSync(flowId, 'utf8'))
    const { loadContract } = require('../control-plane/contracts.cjs')
    const { migrate } = require('./producers.cjs')
    const contracts = request.manifestPaths.map((file) =>
      loadContract(process.cwd(), undefined, file)
    )
    console.log(
      JSON.stringify(
        migrate(
          process.cwd(),
          path.resolve(directory),
          contracts,
          request.projectId
        ).evaluation,
        null,
        2
      )
    )
    return
  }
  if (command === 'serve') {
    const { startFlowServer } = require('./server.cjs')
    const server = await startFlowServer(process.cwd(), {
      directory: path.resolve(directory),
      url: process.env.FLOW_PROOF_URL
    })
    console.log(server.origin)
    let closing = false
    const close = async () => {
      if (closing) {
        return
      }
      closing = true
      await server.close()
    }
    process.once('SIGINT', close)
    process.once('SIGTERM', close)
    return
  }
  const store = openProject(path.resolve(directory))
  if (command === 'validate') {
    console.log(JSON.stringify(store.snapshot().evaluation, null, 2))
    return
  }
  if (command === 'update') {
    console.log(
      JSON.stringify(
        store.update(flowId, JSON.parse(fs.readFileSync(nodeId, 'utf8'))),
        null,
        2
      )
    )
    return
  }
  if (command === 'context') {
    const flow = store.snapshot().evaluation.flows.find((f) => f.id === flowId)
    const selected =
      nodeId === 'integration'
        ? flow?.integration
        : flow?.nodes.find((n) => n.id === nodeId)
    if (!selected) {
      throw new Error('Unknown flow or node')
    }
    console.log(
      JSON.stringify(
        {
          ...compactContext(selected.context),
          flowFile: store.snapshot().files[flowId]
        },
        null,
        2
      )
    )
    return
  }
  throw new Error('Unknown flow command')
}
if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
module.exports = { main }
