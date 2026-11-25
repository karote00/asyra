# Alignment tools

This independently installable example adds six alignment commands and a
movable UI group to a Design workspace. Select two or more elements to align.

Run `npm pack` in this directory after building the SDK in the repository.
Install the resulting tarball alongside the SDK in a consumer project:

```sh
npm install ./example-alignment-tools-0.1.0.tgz
```

```js
import { createDesign } from '@asyra/design'
import { alignmentTools } from '@example/alignment-tools'

const editor = await createDesign(container, { extensions: [alignmentTools()] })
await editor.runAction('alignLeft')
```

The toolbar defaults to `properties.top`. With `placement: 'manual'`,
call `editor.toolGroups.mount('alignment', element)` to place it in your UI.
TypeScript generates both the runtime module and declarations during packing.
