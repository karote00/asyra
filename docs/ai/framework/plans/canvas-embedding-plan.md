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
