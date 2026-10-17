/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path'),
  fs = require('node:fs'),
  { randomUUID } = require('node:crypto')
const { openProject } = require('./store.cjs')
const { digest } = require('./policy.cjs')
const { fingerprintPaths } = require('../control-plane/localization.cjs')
const { runProcess } = require('../control-plane/runner.cjs')
function createFlowService(root, directory, { execute = runProcess } = {}) {
  const projectRoot = fs.realpathSync(root),
    store = openProject(directory)
  let active = null,
    closed = false
  const snapshot = () => store.snapshot()
  const context = (flowId, nodeId) => {
    const flow = snapshot().evaluation.flows.find((f) => f.id === flowId)
    const node =
      nodeId === 'integration'
        ? flow?.integration
        : flow?.nodes.find((n) => n.id === nodeId)
    if (!node) throw new Error('Unknown flow or node')
    return node.context
  }
  const preview = (flowId, nodeId, actionId) => {
    const current = context(flowId, nodeId),
      action = current.actions.find((a) => a.id === actionId)
    if (!action || action.kind !== 'command')
      throw new Error('No executable action selected')
    const cwd = path.resolve(projectRoot, action.cwd)
    if (cwd !== projectRoot && !cwd.startsWith(projectRoot + path.sep))
      throw new Error('Action cwd escapes project')
    if (fs.realpathSync(cwd) !== cwd || !fs.statSync(cwd).isDirectory())
      throw new Error('Invalid action cwd')
    const value = {
      flowId,
      nodeId,
      actionId,
      revision: current.revision,
      binding: current.binding,
      argv: action.argv,
      cwd,
      inputs: action.inputs?.length
        ? fingerprintPaths(projectRoot, action.inputs).digest
        : null,
      criterionIds: action.criterionIds
    }
    return { ...value, digest: digest(value) }
  }
  async function rerun(request) {
    if (closed || active) throw new Error('Execution is unavailable or busy')
    const selected = preview(request.flowId, request.nodeId, request.actionId)
    if (request.confirm !== true || request.digest !== selected.digest)
      throw new Error('Preview is stale or confirmation missing')
    const controller = new AbortController(),
      executionId = randomUUID()
    const task = { controller, pid: null, promise: null }
    active = task
    task.promise = (async () => {
      const result = await execute({
        executable: selected.argv[0],
        args: selected.argv.slice(1),
        cwd: selected.cwd,
        env: {
          ...process.env,
          FLOW_FILE_DIRECTORY: path.resolve(directory),
          FLOW_ID: selected.flowId,
          FLOW_NODE_ID: selected.nodeId,
          FLOW_EXPECTED_REVISION: String(selected.revision),
          FLOW_BINDING: selected.binding,
          FLOW_EXECUTION_ID: executionId,
          FLOW_PARENT_EXECUTION: '1'
        },
        signal: controller.signal,
        timeoutMs: 120000,
        maxOutputBytes: 262144,
        onSpawn: (pid) => {
          task.pid = pid
        }
      })
      let current = snapshot()
      let doc = current.documents.find((d) => d.flowId === selected.flowId)
      const covered = selected.criterionIds.every((id) =>
        doc.current.observations.some(
          (o) =>
            o.nodeId === selected.nodeId &&
            o.criterionId === id &&
            o.executionId === executionId &&
            o.binding === selected.binding &&
            ['passed', 'failed'].includes(o.status)
        )
      )
      const failedExecution =
        (result.code !== 0 || result.reason) &&
        !doc.current.observations.some(
          (o) =>
            o.nodeId === selected.nodeId &&
            selected.criterionIds.includes(o.criterionId) &&
            o.executionId === executionId &&
            o.status === 'failed'
        )
      const warningId =
        'action-' + digest([selected.nodeId, selected.actionId]).slice(0, 24)
      if (
        (!covered || failedExecution) &&
        context(selected.flowId, selected.nodeId).binding === selected.binding
      ) {
        store.update(selected.flowId, {
          expectedRevision: doc.revision,
          kind: 'warning',
          value: {
            id: warningId,
            nodeId: selected.nodeId,
            kind: 'producer',
            summary:
              result.reason ??
              (failedExecution
                ? 'Action exited unsuccessfully; review its result'
                : 'Action did not publish complete current results'),
            criterionIds: selected.criterionIds,
            executionId,
            binding: selected.binding
          }
        })
      } else if (
        covered &&
        !failedExecution &&
        doc.current.warnings.some((w) => w.id === warningId)
      ) {
        store.update(selected.flowId, {
          expectedRevision: doc.revision,
          kind: 'correction',
          id: warningId,
          observations: doc.current.observations.filter(
            (o) =>
              o.nodeId === selected.nodeId &&
              selected.criterionIds.includes(o.criterionId)
          )
        })
      }
      return {
        executionId,
        ...result,
        coverageComplete: covered,
        context: context(selected.flowId, selected.nodeId)
      }
    })()
    try {
      return await task.promise
    } finally {
      active = null
    }
  }
  return {
    snapshot,
    context,
    preview,
    rerun,
    update: (flowId, request) => {
      if (closed) throw new Error('Service is closed')
      return store.update(flowId, request)
    },
    cancel: async () => {
      if (active) {
        active.controller.abort()
        await active.promise
      }
    },
    close: async () => {
      closed = true
      if (active) {
        active.controller.abort()
        await active.promise
      }
    }
  }
}
module.exports = { createFlowService }
