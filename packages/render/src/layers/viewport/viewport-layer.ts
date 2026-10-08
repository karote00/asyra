import {
  DataTypes,
  DEFAULT_CANVAS_PADDING,
  MouseData,
  rectToBounds,
  calculateZoomFit,
  type Bounds
} from '@asyra/utils'
import {
  RenderContainerData,
  RenderElementData,
  SceneElement
} from '../../types.js'
import { RenderLayer } from '../scene/index.js'
import {
  RenderContainer,
  type RenderGraphics
} from '../../types/render-object.js'

export class ViewportLayer {
  layer: RenderContainer
  private renderLayer: RenderLayer

  constructor() {
    this.layer = new RenderContainer({ transformGroup: true })
    this.renderLayer = new RenderLayer()

    this.layer.addChild(this.renderLayer.view)
  }

  get view() {
    return this.layer
  }

  getElementById(elementId: string): SceneElement | undefined {
    return this.renderLayer.getElementById(elementId)
  }

  getElementIdsInBounds(
    bounds: import('../../types/render-object.js').RenderBounds
  ): string[] {
    return this.renderLayer.getElementIdsInBounds(bounds)
  }

  getProjectedElementCount(): number {
    return this.renderLayer.getAllElements().size
  }

  getAllElementsBounds(): Bounds | null {
    if (this.renderLayer.getAllElements().size === 0) {
      return null
    }

    return this.renderLayer.getAllElementsBounds(this.renderLayer.view)
  }

  clearElements() {
    this.renderLayer.clearElements()
  }

  switchWorkspace(workspaceData: RenderContainerData) {
    this.renderLayer.switchWorkspace(workspaceData)
  }

  addContainer(containerData: RenderContainerData) {
    return this.renderLayer.addContainer(containerData)
  }

  addElement(data: RenderElementData, siblingIndex?: number) {
    return siblingIndex === undefined
      ? this.renderLayer.addElement(data)
      : this.renderLayer.addElement(data, siblingIndex)
  }

  removeElement(elementId: string, parentId?: string) {
    return this.renderLayer.removeElement(elementId, parentId)
  }

  projectHierarchy(parentId: string, childIds: readonly string[]) {
    this.renderLayer.projectHierarchy(parentId, childIds)
  }

  updateElement(
    elementId: string,
    key: string,
    before: DataTypes,
    after: DataTypes,
    data?: RenderElementData
  ) {
    this.renderLayer.updateElement(elementId, key, before, after, data)
  }

  updateElementProperties(
    element: RenderContainer | RenderGraphics,
    key: string,
    after: DataTypes
  ) {
    this.renderLayer.updateElementProperties(element, key, after)
  }

  /**
   * Zoom to fit all elements within the specified UI bounds
   * @param uiBounds - The DOMRect representing the visible canvas area
   * @returns void
   */
  zoomFit(uiBounds: DOMRect) {
    if (this.renderLayer.getAllElements().size > 0) {
      const elementsBounds = this.renderLayer.getAllElementsBounds(
        this.renderLayer.view
      )
      this.fitBounds(elementsBounds, rectToBounds(uiBounds))
    } else {
      this.panTo(
        uiBounds.x + DEFAULT_CANVAS_PADDING,
        uiBounds.y + DEFAULT_CANVAS_PADDING
      )
    }
  }

  /**
   * Set the canvas zoom level centered on a specific point
   * @param scale - The zoom scale factor
   * @param centerX - The x-coordinate of the zoom center
   * @param centerY - The y-coordinate of the zoom center
   * @returns void
   */
  zoomToCenter(scale: number, centerX: number, centerY: number) {
    const currentScale = this.getScale()
    const currentPosition = this.getPosition()

    // Calculate the position of the mouse in world coordinates
    const worldX = (centerX - currentPosition.x) / currentScale
    const worldY = (centerY - currentPosition.y) / currentScale

    // Calculate the new position after zoom
    const newX = centerX - worldX * scale
    const newY = centerY - worldY * scale

    // Apply the new scale and position
    this.zoomTo(scale)
    this.panTo(newX, newY)
  }

  /**
   * Move the canvas to the specified position
   * @param x - The x-coordinate to move the canvas to
   * @param y - The y-coordinate to move the canvas to
   * @returns void
   */
  panTo(x: number, y: number) {
    this.layer.position.set(x, y)
  }

  /**
   * Set the canvas zoom level
   * @param scale - The zoom scale factor. A value of 1.0 represents 100% zoom.
   *               Values greater than 1.0 zoom in, values less than 1.0 zoom out.
   * @returns void
   */
  zoomTo(scale: number) {
    this.layer.scale.set(scale)
  }

  /**
   * Automatically fits all elements into the visible canvas area,
   * scaling and positioning them proportionally while maintaining aspect ratio.
   *
   * @param elementsBounds - The global bounding box of all elements
   * @param uiBounds - The visible UI canvas bounds
   * @param padding - The desired padding between elements and the canvas edges
   */
  fitBounds(
    elementsBounds: Bounds,
    uiBounds: Bounds,
    padding = DEFAULT_CANVAS_PADDING
  ) {
    const { scale, position } = calculateZoomFit({
      elementsBounds,
      viewportBounds: uiBounds,
      padding
    })
    this.panTo(position.x, position.y)
    this.zoomTo(scale)
  }

  /**
   * Get the current zoom level
   */
  getScale() {
    return this.layer.scale.x
  }

  /**
   * Get the current canvas position
   */
  getPosition() {
    return this.layer.position
  }

  getMousePosInWorkspace(mousePos: MouseData) {
    return this.layer.toLocal({
      x: mousePos.clientX,
      y: mousePos.clientY
    })
  }
}
