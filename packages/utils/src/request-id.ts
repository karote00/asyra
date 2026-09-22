let requestIdCounter = 0

/**
 * Generates a unique request ID based on the current timestamp and a counter.
 * The counter is reset when it reaches a limit (10000) to avoid excessively large numbers.
 *
 * @returns {string} A unique request ID in the format of "{timestamp}-{counter}".
 *
 * @example
 * // Example usage:
 * const requestId = generateRequestId();
 * console.log(requestId); // e.g. "1683054932143-1"
 */
export function generateRequestId(): string {
  // Reset simply before the counter exceeds the safe integer limit.
  if (requestIdCounter >= 10000) {
    requestIdCounter = 0
  }

  requestIdCounter++
  return `${Date.now()}-${requestIdCounter}`
}
