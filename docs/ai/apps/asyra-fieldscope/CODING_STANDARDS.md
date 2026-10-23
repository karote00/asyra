# Coding standards

Follow the framework coding, naming, transaction, computation ownership, and app optimization rules. Use English identifiers, comments, documentation, and PR metadata. Use public `@asyra/*` imports across packages.

Domain geometry is expressed in metres and engine-neutral numeric buffers. Three.js belongs in the engine or camera adapter, not the farm configuration owner. Validate untrusted spatial inputs; never substitute fallback geometry for invalid data.

Use composition and fine-grained subscriptions rather than React memo wrappers. New UI styling uses Tailwind utilities. Keep unfinished form values separate from committed configuration. Add regression tests before fixing incorrect behavior.

Documentation links to external websites use anchors with `target="_blank"` and `rel="noopener noreferrer"`.
