# Caller-owned canvas SDK

Canvas owns the lifetime and exclusive claim on the supplied HTMLCanvasElement.
Creating a binding preserves all pixels, children and attributes. The base does
not acquire a drawing context, install tools, process input or start a clock.
A product attaches one tool session through the public mount contract.
Closing a binding settles pending startup, retires the product once and then
releases the claim. A failed mount can be retried on the same open binding.

Design owns its isolated Core composition, 2D Preset, drawing, selection,
document history and storage format. Simulation independently owns transient
playback with the existing simulation playback clock. Its host supplies frame
presentation. Neither product depends on the other. This slice does not migrate
the complete Design or Sim applications or change workcell analysis.

Verify independently packed consumer installations and dependency boundaries,
canvas identity and untouched pixels, pending mount teardown, simultaneous
targets, design edits and replay, simulation time and cancellation, reattachment
and existing Framework container and canvas lifecycle behavior.

## Design editor entry

The Design SDK owns the one-call editor on a supplied HTML container or canvas.
For a container, Design adds its own resizable editor area, canvas and optional
controls, retaining existing host children. A container admits one editor until
disposal completes. Failure or disposal releases the claim and owned nodes.
For an existing canvas, Design borrows the exact target and preserves it. Its
default controls select Rectangle, Select, Undo and Redo. Callers can replace
the ordered controls with built-in commands and named actions receiving the
same public Design tools, or supply their entire UI. Registered actions can also
run by ID with the toolbar hidden. All document writes and
history go through the existing Design session. The canvas binding owns the
session lifetime. Failed initialization and disposal release the binding and
SDK-owned controls. The packed browser cases exercise each mode, history and
reuse of the target. This step changes only the Design entry and its consumer
proof, documentation and flow.
