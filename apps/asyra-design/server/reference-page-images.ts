import { validateReferenceImageUrl } from './reference-image-download'

const decodeAttribute = (value: string) =>
  value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named: Record<string, string> = {
      '&amp;': '&',
      '&quot;': '"',
      '&apos;': "'",
      '&lt;': '<',
      '&gt;': '>'
    }
    const known = named[entity.toLowerCase()]
    if (known) return known
    const numeric = entity.slice(2, -1)
    const code =
      numeric[0]?.toLowerCase() === 'x'
        ? Number.parseInt(numeric.slice(1), 16)
        : Number(numeric)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
  })

const attributes = (tag: string) => {
  const result: Record<string, string> = {}
  for (const attr of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  ))
    result[attr[1].toLowerCase()] = decodeAttribute(
      attr[2] ?? attr[3] ?? attr[4] ?? ''
    )
  return result
}

export interface ReferencePageImage {
  imageUrl: string
  kind: 'linked-image' | 'structured-image' | 'page-metadata'
  previewUrls: string[]
}

/** This relation only ranks page declarations. It NEVER establishes byte/cache identity. */
const relatedImageDeclaration = (declared: string, embedded: string) => {
  const a = new URL(declared)
  const b = new URL(embedded)
  return (
    a.origin === b.origin &&
    a.pathname === b.pathname &&
    [...a.searchParams].every(([key, value]) =>
      b.searchParams.getAll(key).includes(value)
    )
  )
}

/** Read publisher relationships, not site names, CSS conventions or executable scripts. */
export const referencePageImages = (
  html: string,
  pageUrl: string
): ReferencePageImage[] => {
  const url = (value: unknown) => {
    if (typeof value !== 'string' || !value) return
    try {
      return validateReferenceImageUrl(new URL(value, pageUrl).href).href
    } catch {
      /* Invalid declarations are not candidates. */
    }
  }
  const declarations = html.replace(/<!--[\s\S]*?(?:-->|$)/g, '')
  const metadata = new Set<string>()
  const resources: ReferencePageImage[] = []
  // JSON-LD is data only; never evaluate a script or follow remote contexts.
  for (const script of declarations.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
  )) {
    if (attributes(script[1]).type?.toLowerCase() !== 'application/ld+json')
      continue
    try {
      const pending: unknown[] = [JSON.parse(script[2])]
      while (pending.length) {
        const item = pending.pop()
        if (Array.isArray(item)) {
          pending.push(...item)
          continue
        }
        if (!item || typeof item !== 'object') continue
        const data = item as Record<string, unknown>
        const types = Array.isArray(data['@type'])
          ? data['@type']
          : [data['@type']]
        const imageUrl = url(data.contentUrl)
        if (types.includes('ImageObject') && imageUrl) {
          const values = Array.isArray(data.thumbnailUrl)
            ? data.thumbnailUrl
            : [data.thumbnailUrl]
          resources.push({
            imageUrl,
            kind: 'structured-image',
            previewUrls: values.map(url).filter((v): v is string => !!v)
          })
        }
        for (const value of Object.values(data))
          if (value && typeof value === 'object') pending.push(value)
      }
    } catch {
      /* Malformed structured data does not authorize executing it. */
    }
  }
  const markup = declarations.replace(
    /<(script|style|textarea|title)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi,
    ''
  )
  for (const match of markup.matchAll(
    /<(meta|link)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi
  )) {
    const attrs = attributes(match[0])
    const declared = (attrs.property ?? attrs.name ?? '').toLowerCase()
    let value: string | undefined
    if (
      match[1].toLowerCase() === 'meta' &&
      [
        'og:image',
        'og:image:url',
        'og:image:secure_url',
        'twitter:image',
        'twitter:image:src'
      ].includes(declared)
    )
      value = attrs.content
    if (
      match[1].toLowerCase() === 'link' &&
      attrs.rel?.toLowerCase().split(/\s+/).includes('image_src')
    )
      value = attrs.href
    const candidate = url(value)
    if (candidate) metadata.add(candidate)
  }
  for (const anchor of markup.matchAll(
    /<a\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a\s*>/gi
  )) {
    const attrs = attributes(anchor[1])
    const imageUrl = url(attrs.href)
    if (
      !imageUrl ||
      (!/\.(png|jpe?g|webp)$/i.test(new URL(imageUrl).pathname) &&
        !/^image\/(png|jpeg|webp)$/i.test(attrs.type ?? ''))
    )
      continue
    const previewUrls = new Set<string>()
    for (const image of anchor[2].matchAll(
      /<img\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi
    )) {
      const imageAttrs = attributes(image[0])
      const src = url(imageAttrs.src)
      if (src) previewUrls.add(src)
      for (const candidate of (imageAttrs.srcset ?? '')
        .trim()
        .matchAll(/(?:^|,\s*)(\S+?)\s+\d+(?:\.\d+)?[wx](?=\s*,|$)/g)) {
        const srcset = url(candidate[1])
        if (srcset) previewUrls.add(srcset)
      }
    }
    if (previewUrls.size)
      resources.push({
        imageUrl,
        kind: 'linked-image',
        previewUrls: [...previewUrls]
      })
  }
  const selected = new Map<string, ReferencePageImage>()
  for (const imageUrl of metadata) {
    const linked = resources.filter(
      (resource) =>
        resource.imageUrl === imageUrl ||
        resource.previewUrls.some((preview) =>
          relatedImageDeclaration(imageUrl, preview)
        )
    )
    if (linked.length) {
      for (const resource of linked)
        selected.set(resource.imageUrl, {
          ...resource,
          previewUrls: [...new Set([...resource.previewUrls, imageUrl])].filter(
            (preview) => preview !== resource.imageUrl
          )
        })
    } else
      selected.set(imageUrl, {
        imageUrl,
        kind: 'page-metadata',
        previewUrls: []
      })
  }
  // Without a representative declaration only explicit structured image data is
  // admitted. Arbitrary linked body images might be navigation or advertisements.
  if (!metadata.size)
    for (const resource of resources)
      if (resource.kind === 'structured-image')
        selected.set(resource.imageUrl, resource)
  return [...selected.values()]
}
