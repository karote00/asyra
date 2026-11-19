/** An unsupported authored property key, rejected before property application.
 * Transaction settlement and consumer recovery remain separate responsibilities. */
export class ElementPropertyInputError extends Error {
  constructor(
    readonly elementId: string,
    readonly propertyKey: string
  ) {
    super(
      `Element "${elementId}" has no registered property target for "${propertyKey}".`
    )
    this.name = 'ElementPropertyInputError'
  }
}
