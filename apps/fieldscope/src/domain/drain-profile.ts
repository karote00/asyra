/** Metres; rounded lips are contained within the configured channel width. */
export function createDrainProfile(width: number) {
  if (!Number.isFinite(width) || width <= 0)
    throw new Error('Invalid drain width')
  const lipRadius = Math.min(0.01, width / 10)
  const radius = width / 2 - lipRadius
  const points: [number, number][] = []
  for (let i = 0; i <= 12; i++) {
    const angle = (Math.PI / 2) * (1 - i / 12)
    points.push([
      lipRadius * Math.cos(angle),
      -lipRadius + lipRadius * Math.sin(angle)
    ])
  }
  for (let i = 1; i <= 64; i++) {
    const angle = Math.PI + (Math.PI * i) / 64
    points.push([
      width / 2 + radius * Math.cos(angle),
      -lipRadius + radius * Math.sin(angle)
    ])
  }
  for (let i = 1; i <= 12; i++) {
    const angle = Math.PI - ((Math.PI / 2) * i) / 12
    points.push([
      width + lipRadius * Math.cos(angle),
      -lipRadius + lipRadius * Math.sin(angle)
    ])
  }
  points[0] = [0, 0]
  points[points.length - 1] = [width, 0]
  return { points, radius, lipRadius, depth: width / 2 }
}
