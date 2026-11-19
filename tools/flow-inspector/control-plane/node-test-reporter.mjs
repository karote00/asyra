// Node supplies structured lifecycle events. Keep them verbatim; classification
// belongs to the shared evidence consumer, never to console/TAP parsing.
export default async function* report(source) {
  for await (const event of source) {
    yield JSON.stringify(event, (_key, value) => {
      if (value instanceof Error) {
        return {
          ...value,
          name: value.name,
          message: value.message,
          stack: value.stack,
          ...(value.cause !== undefined ? { cause: value.cause } : {})
        }
      }

      return value
    }) + '\n'
  }
}
