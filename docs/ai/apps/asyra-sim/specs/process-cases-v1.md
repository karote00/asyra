# Self-authored process experiments

## Status and authority

Proposed product contract, 2026-11-07. This is planning, not implemented behavior
or numerical acceptance. The user selected self-authored implementations under
MIT, with no external solver code, experimental datasets, literature fixtures or
new research dependency for these two cases. Existing Asyra dependencies remain.
General mathematical knowledge may be independently derived and implemented;
previously inspected third-party implementations must not be translated or copied.
No third-party numerical code or data is imported by this plan.

The first outcome is a verified synthetic etching experiment; the second is a
complete synthetic lithography experiment. Neither predicts a named commercial
material or certified manufacturing process. They extend the App without adding
requirements to R0 or changing its release decision. The existing mechanical
experiment remains supported. See [the plan](../plans/process-cases/plan.md).

## Shared user journey

Choose an etching or lithography example, edit its valid inputs, inspect the
explicit model assumptions, run, inspect computed time slices and measurements,
duplicate and change one condition, compare, export, and reopen. Completed edits
use the existing Feature/API/transaction and automatic persistence route. There
is no second Apply/Save requirement for ordinary edits. Export is explicit.
Invalid input stays an editable draft and prevents execution; it never becomes a
substitute valid result. Run freezes committed input. Later edits affect only a
future run. One drag gesture creates one undoable edit; playback creates none.

Every example displays "Synthetic material - model verification". A successful
run means complete execution under the stated model, not verified real-world
accuracy. No KOH concentration/temperature controls, commercial resist names,
yield claims, ASML-equivalence claims or calibrated-material badges are present.

Progress, cancellation, deadline, numerical failure and storage failure have
separate outcomes. Partial slices remain labelled partial; cancellation never
creates a completed result. A failed save remains unacknowledged and retryable.
Reopening retained evidence does not require rerunning a solver. Editing a source
never rewrites an earlier run. Unknown method versions may remain readable where
already supported, but cannot execute with silently substituted behavior.

## Units and evidence

Use SI quantities at computation boundaries and explicit display units (um/nm,
seconds, irradiance and dose). Crystal orientation, local material frame and
scene placement are separate values. A placement transform does not rotate the
crystal relative to its own material unless explicitly edited. Do not reuse the
mechanical minimum body size as the material-grid admission limit.

A detached process snapshot includes domain dimensions, materials, boundaries,
initial masks, parameter provenance (self-authored synthetic), method/version,
resolution, integration settings, output times and resource bounds. Lithography
adds source coherence groups, poses, phase, irradiance and a timed shutter/track.
Immutable evidence includes that snapshot, actual simulated times, field and
contour artifacts with units/frames, metrics, completion/failure and measured
resource use. Derived images do not replace numerical artifacts. Content identity
must cover all numerical dependencies. Results with different units, domains or
models require an explicit comparison alignment or are rejected as incomparable.

Proposed initial ceilings: one active process job, at most 256 x 128 cells,
32 retained slices, 30 s default / 120 s maximum wall deadline and 32 MiB of
process result bytes. Combined portable projects retain their existing 64 MiB
ceiling. Count allocated working arrays and output bytes before execution; Task 1
must fix a working-memory ceiling and actual workload before production entry.
These are limits, not a promise that every admitted workload finishes. Invalid
outputs, budgets and elapsed deadlines stop computation without fabricated data.

## Etching case

### User operation and scope

Show a 2D section through a synthetic cubic material, a fixed ideal hard mask and
one long opening; the out-of-plane direction is invariant. Users edit opening
width, layer thickness, duration and fast/slow speed parameters. The initial
case fixes a (100) surface and a documented section orientation. Arbitrary 3D
geometry, arbitrary crystal rotation, liquid transport, heating, defects, mask
consumption and measured chemistry are outside this case.

The mask is immutable, but exposed material may recede sideways beneath it.
Material removal starts only at the bath-accessible interface. Restrict the
initial geometry to the supported connected bath and reject unsupported enclosed
cavities; do not pretend an inaccessible internal void is an etchant reservoir.
Reject runs that reach an unspecified lateral/bottom domain boundary rather than
silently wrapping or clipping the physical shape.

### Independently authored numerical model

Represent the moving boundary with a signed distance field, negative in solid.
For outward solid normal n, removal has normal speed -v(n), hence
`phi_t - v(n) * |grad(phi)| = 0`. Use a monotone Hamilton-Jacobi discretization
with a justified dissipation bound and stable time step. Reinitialization, when
needed, must pass interface-displacement checks. Extract contours from the field;
never replace a failed numerical result with a prescribed V shape.

First prove constant isotropic speed. Then use an explicitly synthetic cubic law:
`v(n) = vSlow + (vFast - vSlow) * (3 * sum(n_i^4) - 1) / 2`,
where the crystal-frame normal is unit length and `0 <= vSlow <= vFast`.
This supplies cubic symmetry and slow diagonal directions; it is not a measured
silicon rate law and does not promise exact crystallographic facets. Map section
normals into the crystal frame explicitly. The first section uses outward surface-normal
axis [100] and lateral axis [011]/sqrt(2), with consistent signed coordinates.
Other laws require their own version and evidence, not extra hidden fixtures.

Report maximum depth, remaining thickness, and left/right undercut relative to
the original mask edges. Report sidewall slope only over a defined resolvable
segment; sharp corners or missing segments yield unavailable, not invented angles.

### Etching acceptance

- E01: zero duration/speed preserves the initial interface; flat and tilted
  unmasked planes move by the independently calculated `v(n) * t`.
- E02: a freely etched circular solid shrinks with `r(t) = r0 - v*t` before
  extinction; test translation and grid orientation to expose mesh bias.
- E03: the synthetic law preserves cubic permutations/sign symmetry and its
  independently derived axis/diagonal speeds; changing frame placement preserves
  local results. These checks do not call the production speed helper as oracle.
- E04: the fixed mask survives, exposed edges allow undercut, blocked initial
  geometry is rejected, and the finite-domain boundary cannot invent material.
- E05: independent spatial and temporal refinement and reinitialization tests
  demonstrate convergence of depth, contour distance and undercut.
- E06: the normal App journey supports rerun, comparison, export/reopen,
  invalid input, undo/redo, cancellation and immutable earlier evidence.

## Lithography case

### User operation and scope

After etching acceptance, provide two adjustable optical output heads above a
flat synthetic positive resist and ideal hard mask/substrate. The heads may
share one coherent source; head count is not coherence-group count. Users drag
and rotate heads before exposure within the supported 2D plane, set irradiance,
relative phase, duration and development time, then run the four stages:
propagation, material optical interaction, reaction, development.

Support stationary exposure first and one prescribed constant-speed translation
track with timed shutter second. Dragging edits a pose/track; wall-clock pointer
samples and render frames never define exposure time. Sources may move during
simulated exposure only through the frozen track. Restrict directions to a
paraxial bound (proposed absolute angle <= 0.1 rad relative to the material
normal), resolve fringes on the grid and reject unsupported configurations.
Two incoherent sources add intensities; coherent sources add complex fields.
Translation can have no effect in an invariant ideal field; never force a visual
change just because a head moved.

This is interference lithography, not a mask-projection scanner or full machine.
No EUV, vector Maxwell solve, high numerical aperture, standing-wave reflection,
chemical amplification, stochastic electrons, heating, flow or real resist
calibration is claimed. Material interfaces are index-matched and nonreflecting
in this version. The hard mask exists in the initial optical stack; its ideal
optical properties are declared, not inserted after exposure.

### Independently authored four-stage model

1. Propagation: normalized 2D paraxial beams produce complex boundary fields at
   the resist entrance, with source phase, direction, finite width and position.
   Irradiance normalization is explicit; no conversion from 2D power to 3D watts.
2. Material interaction: advance a scalar complex field in x/z using a bounded
   split-step method for `U_z = i/(2*k) U_xx + i*k0*deltaN*U - alpha*U/2`.
   Begin with a directly implemented small-grid discrete Fourier transform,
   with no external FFT dependency. Pad/guard the computational domain to prevent
   periodic wraparound entering the measurement region. Loss and outgoing energy
   are tracked. This is a forward-wave approximation, not general thin-film optics.
3. Reaction: synthetic unreacted fraction m starts at 1 and evolves as
   `dm/dt = -kappa*I*m`, with `alpha = alphaBase + alphaReactive*m`.
   Specify compatible SI units so the exponent is dimensionless. Irradiance I,
   accumulated dose and absorbed power density `alpha*I` remain distinct.
   For each exposure interval, resolve poses and shutter, propagate through the
   current absorption field, update m, then update absorption for the next interval.
   A frozen-absorption mode is explicit; feedback cannot be silently skipped.
4. Development: freeze post-exposure m and use
   `R(m) = RDark + (RClear - RDark)*(1-m)^p`, with 0 < RDark <= RClear and p >= 1.
   Independently implement a monotone arrival-time solver for this fixed scalar
   speed field, starting only at developer-accessible resist surfaces. Mask and
   substrate block the front. Points with arrival time <= development time dissolve.
   No developer depletion, swelling or evolving dissolution chemistry is included.

Choose a fixed wavelength and synthetic layer/beam scales during Task 1 so the
paraxial, sampling and finite-domain restrictions hold. A numerical wavelength
is not a claim of a measured material response. Record every synthetic default
and its units; do not reuse earlier literature parameters.

### Lithography acceptance

- L01: single-beam propagation and power normalization match independently
  derived solutions; coherent symmetric-angle plane-wave fringe pitch equals
  `lambda/(2*sin(theta))` in air, with documented paraxial error bounds.
  A phase shift moves fringes; incoherent groups do not produce fixed cross terms.
- L02: uniform absorption obeys exponential intensity decay; zero absorption
  conserves energy within the numerical/domain tolerance. Boundary padding,
  spatial step, direct-transform and propagation-step checks are independent.
- L03: zero exposure preserves m; prescribed constant I yields
  `m = m0*exp(-kappa*I*t)`; m stays in [0,1]. Absorption feedback converges under
  exposure time refinement and differs from explicitly frozen absorption when
  reactive absorption is nonzero. No clipping hides unstable integration.
- L04: constant dissolution speed yields depth `R*t`; layered rates yield summed
  travel times; only accessible regions dissolve and the substrate stops removal.
- L05: zero-speed scan matches stationary exposure; shutter-off motion adds no
  dose; subdivision of the same trajectory converges to the same result. A simple
  moving uniform illumination window has an independently derived dwell-dose
  oracle. Equivalent total dose does not imply arbitrary bleaching histories agree.
- L06: the ordinary App shows all four stage results, developed profile, remaining
  resist, cleared openings and top/middle/bottom widths where defined; changes
  to poses, time, phase and development produce explainable comparisons.

## Connecting the two cases

After both standalone journeys pass, an explicit user action derives a new
etching experiment from a completed development result. Use developer-connected,
fully cleared-through resist openings; residual resist blocks the opening.
Apply a declared ideal vertical transfer to the already-present hard mask and
ideal resist removal, then run the etch kernel. This is a geometric handoff,
not a physical hard-mask transfer/strip simulation. Keep the source run immutable
and retain its identity, transforms, units and transfer assumptions in the child.

Only a single supported long opening is admitted initially. Multiple disconnected
openings or incompatible scales must be rejected, not merged, dropped or resized.
No silent nanometer-to-micrometer rescaling: choose synthetic optical parameters
that give a resolved opening in the existing etch domain and numerical limits.
Transfer and its cancel/undo have one normal transaction boundary. Validate
through-cleared, residual-film, unit/frame, unsupported-opening, source-lifetime,
export/reopen and two-stage replay cases (B01). Physical process validation is
outside acceptance of B01.

## Error and performance criteria

Task 1 derives independent oracle tolerances before executing implementation
experiments. Initial targets: nonzero analytic bulk measurements within 1% and
contour distance within two fine-grid cells on three declared nested grids;
small/zero quantities use a declared absolute scale. Require decreasing error,
not just a passing coarse picture. Refine space and time independently and test
mask corners separately. No fitting a tolerance after seeing a failed output.
If a target cannot be justified or met, revise the declared numerical model in
this plan before production work; never weaken a scientific claim implicitly.

Scalar optics acceptance includes a separate approximation error budget. Numerical
convergence cannot establish accuracy of paraxial physics outside its domain.
Reference workload, working-memory ceiling, cancellation latency and cold/warm
runtime are measured and frozen at Task 1. A limit exceeded is a visible incomplete
run; performance must not be rescued with skipped cells or fabricated slices.

## Existing behavior to preserve

Preserve mechanical source geometry, trajectory semantics, collision evidence,
method versions, live feedback, history, automatic persistence, unavailable-method
reading, comparison, export/reopen and runtime cleanup. Never encode a material
field as colliders or a light track as robot-joint motion just to reuse a schema.
Use existing Core/Feature/Factory and supported spatial APIs; keep physics and
numerical result interpretation App-owned. Existing release gates remain open.
