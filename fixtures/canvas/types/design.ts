import { surface } from './consumer'
import {
  createDesign,
  attachDesignTools,
  type WorkspaceExtension,
  type WorkspaceFeature
} from '@asyra/design'
const editor = await createDesign(
  document.body.appendChild(document.createElement('div')),
  {
    toolbar: false,
    actions: {
      revert: {
        label: 'Undo',

        run: (tools) => tools.undo()
      }
    }
  }
)

await editor.runAction('revert')
await editor.destroy()
const extended = await createDesign(document.createElement('div'), {
  extensions: [
    {
      actions: {
        badge: {
          label: 'Badge',

          run(tools) {
            tools.drawOval({ x: 0, y: 0, width: 10, height: 10 })
          }
        }
      }
    }
  ],
  toolbar: ['badge'],
  disabledFeatures: ['text', 'pen', 'badge'],
  hideUI: true
})

await extended.runAction('badge')
const configured: readonly (WorkspaceFeature | 'badge')[] = extended.features

await extended.setDisabledFeatures(configured)
// @ts-expect-error An extension action is not a built-in feature.
export const invalidBuiltIn: WorkspaceFeature = 'badge'

const group: WorkspaceExtension<'arrange'> = {
  actions: {
    arrange: {
      label: 'Arrange',

      run: (tools) => tools.zoomFit()
    }
  },
  ui: [
    {
      id: 'layout',
      placement: 'properties.top',

      mount({ container, editor }) {
        const b = container.ownerDocument.createElement('button')

        b.onclick = () => editor.runAction('arrange')
        container.append(b)

        return () => b.remove()
      }
    }
  ]
}
const grouped = await createDesign(document.createElement('div'), {
  extensions: [group]
})

await grouped.setDisabledFeatures(['arrange'])
grouped.toolGroups.setTargets({ layout: 'my-toolbar' })
// @ts-expect-error The host owns floating positions.
grouped.toolGroups.float('layout', { x: 0, y: 0 })
const workspace = await createDesign(document.createElement('div'), {
  toolbar: ['group', 'ungroup', 'deleteSelectedElement', 'zoomFit', 'reset']
})
const builtIns: readonly WorkspaceFeature[] = workspace.features

await extended.setDisabledFeatures(builtIns)
type PublicAPI = typeof import('@asyra/design')
// @ts-expect-error Feature discovery belongs to each editor.
export type RemovedExport = PublicAPI['workspaceFeatures']
// @ts-expect-error The feature catalog is read-only.
workspace.features = []
await workspace.runAction('zoomFit')
workspace.deleteSelectedElement()
const label = workspace.createText('Label', {
  x: 0,
  y: 0,
  width: 50,
  height: 20
})

workspace.setLayerLocked(label, false)
workspace.common.viewport.getCanvasPositionFromWorkspace({ x: 1, y: 2 })
workspace.common.transaction.runTransaction(() =>
  workspace.common.element.setElementLock(label, true)
)
workspace.observe('collaboration', (state) => state?.sync)
workspace.updateStroke(label, 'stroke', { width: 3, joinType: 'round' })
workspace
  .getPath(label)
  ?.anchors.forEach((anchor) => workspace.moveAnchor(label, anchor.id, anchor))
await workspace.reset()
const tools = await attachDesignTools(surface)

tools.setTool('select')
await tools.undo()
