/** Explicit common-API input rejection. Transaction settlement belongs to the caller. */
export class CommonApiInputError extends Error {
  constructor(
    message: string,
    readonly details: Readonly<Record<string, string | number>>
  ) {
    super(message)
    this.name = 'CommonApiInputError'
  }
}
