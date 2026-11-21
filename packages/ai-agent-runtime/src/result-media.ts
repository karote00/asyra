export interface AiToolImage {
  path: string
  actionName: string
  image: Record<string, unknown>
}

/** Preserve output provenance through aliases, including selected image leaves. */
export function selectAiToolImages(
  images: readonly AiToolImage[],
  path: string,
  name: string
): AiToolImage[] {
  const target = '/fields/' + name.replace(/~/g, '~0').replace(/\//g, '~1')

  return images.flatMap((image) => {
    if (image.path === path || image.path.startsWith(path + '/')) {
      return [{ ...image, path: target + image.path.slice(path.length) }]
    }

    if (path === image.path + '/dataUrl') {
      return [{ ...image, path: target }]
    }

    return []
  })
}
