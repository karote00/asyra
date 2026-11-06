/** Serialize once in the browser; never send the expanded document as one RPC. */
export const readBrowserSnapshot = async (page, capture, onTransfer) => {
  const snapshot = await page.evaluateHandle(capture)
  let serialized

  try {
    // Primitive handles include their complete value in the remote initializer.
    // An object handle keeps the serialized text behind its browser object ID.
    serialized = await snapshot.evaluateHandle((value) => ({
      text: JSON.stringify(value)
    }))
    const characters = await serialized.evaluate(({ text }) => text.length)
    const chunks = []
    const chunkCharacters = 1024 * 1024

    for (let offset = 0; offset < characters; offset += chunkCharacters) {
      chunks.push(
        await serialized.evaluate(
          ({ text }, range) =>
            text.slice(range.offset, range.offset + range.length),
          { offset, length: chunkCharacters }
        )
      )
    }

    const result = JSON.parse(chunks.join(''))

    onTransfer?.({ characters, chunks: chunks.length, chunkCharacters })

    return result
  } finally {
    await Promise.allSettled([snapshot.dispose(), serialized?.dispose()])
  }
}
