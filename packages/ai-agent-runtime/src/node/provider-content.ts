/** Provider-neutral content already selected and validated by the tool owner. */
export type ProviderContentItem =
  | { readonly type: 'inputText'; readonly text: string }
  | { readonly type: 'inputImage'; readonly imageUrl: string }
