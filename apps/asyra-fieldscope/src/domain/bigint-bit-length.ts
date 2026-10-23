/** Exact signed BigInt width without materializing one character per bit. */
export function bigIntBitLength(value: bigint) {
  const magnitude = value < 0n ? -value : value
  if (magnitude === 0n) return 1
  const hexadecimal = magnitude.toString(16)
  const leading = Number.parseInt(hexadecimal[0], 16)
  return (hexadecimal.length - 1) * 4 + 32 - Math.clz32(leading)
}
