# Caller-owned canvas SDK

The installed product accepts a real HTMLCanvasElement. A plain JavaScript
consumer owns layout, framework, toolbar, persistence identity and disposal.
The SDK owns document edits, selection, history and input for that target only.

Core passes a canvas host to the 2D renderer. Pixi borrows the element instead
of creating and appending a new one. Existing container initialization retains
its original behavior. A scoped bundle factory gives each mounted target its own
Framework module state. Duplicate mounts reject before acquiring resources.
Failure and teardown remove subscriptions and release the target claim.

The packed consumer test installs the SDK alone, builds a plain browser app,
and exercises pointer drawing, visible selection, undo/redo, isolation, invalid
targets, save/load and disposal on the original DOM elements.
