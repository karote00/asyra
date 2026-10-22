# Editable text foundation

## Product contract

Text remains a canonical editable string with typography and a layout box. It
must not become vector outlines or an image element. Selection, movement,
persistence, collaboration and Undo use ordinary component/property owners.
Plain text is never interpreted as HTML. Existing non-text documents are unchanged.

## Neutral text projection

The render facade accepts a plain string, position, nonnegative layout width and
height, font family, positive font size, normal/bold weight, normal/italic style,
left/center/right alignment, positive line height, and letter spacing. Its second
argument is a standard solid or resource-backed fill paint.
It snapshots this value into an engine-neutral text draw operation and uses the
explicit layout box for local bounds. Clearing replaces all previous operations.
The renderer does not decide content, layout, component semantics or font choice.
The operation is an additive runtime protocol, not a persisted document format.

## Engine text materialization

The Pixi adapter consumes the completed neutral operation, creates plain native
Text with wrapping at the requested width, and positions it in the graphics
container. It owns and destroys its text, paint, and alpha-mask children on clear
and object destruction. Unrelated scene children are retained. No HTML, DOM overlay, remote
font fetch, application decision, or canonical-data mutation occurs here.

Screen text resolution follows renderer pixel ratio and the largest scale of its
world linear transform. It is capped at 4 and bounded to 4096px per edge and 4M
pixels per text texture. Large text may be resolution-limited rather than allocating
unbounded textures. Resolution work is coalesced at flush after creation, reparent
or linear-transform changes; unchanged flushes and panning do no text-resolution
work. Only adapter-owned live text is tracked, and clear/destruction removes it.

Snapshot text density follows the bounded capture scale and text-to-target local
transform, independently of viewport zoom. Capture must restore screen density
afterwards, including on failure, and leave unrelated owned text untouched.

## Canonical text component

An explicitly installed preset text component (persisted type `text`) owns content and typography through validated properties,
position and dimensions. Valid writes persist unchanged; invalid writes reject and
invalid loaded values use documented defaults. The additive `typography` property
uses text (empty by default, at most 100,000 characters), fontFamily (`sans-serif`,
1–128 characters), fontSize (16, greater than 0 and at most 4096), fontWeight
(normal or bold), fontStyle (normal or italic), textAlign (left/center/right),
lineHeight (20, greater than 0 and at most 8192), letterSpacing (0, -100 to 100). Text paint belongs to the standard `fills`
property, initially one opaque visible black solid fill. Canonical element input and computed output expose these fields flat, just as
position and dimension fields; the `typography` name identifies the property
owner, not a nested element payload. Position and dimensions reuse existing schemas. All numeric values must be finite. Existing preset default
profiles are unchanged: the App explicitly installs these exported definitions. The App exposes editing of content
and typography through normal property APIs. AI creation and editing use the same
properties and cannot infer unsupported font availability. Exact overflow is
reviewed against the actual rendered text; heuristic text measurement cannot
prove a layout fits.

## Product cases and gates

- A Unicode multiline string survives facade projection unchanged and is editable.
- Mutating a caller-owned typography object does not alter queued operations.
- Clear and redraw replace old text; repeated updates do not leak text resources.
- A text object can be selected, edited, saved/reloaded and undone/redone.
- Literal HTML-looking content is rendered as text.
- Native rendered text and bounds are visually checked in the App before delivery.

The foundation is incomplete until neutral, engine, property, component and App
editing gates pass. A facade-only test is not proof of visible text or full AI UI.


## Native content measurement

Content measurement reads actual local rendered bounds, independently of canonical
layout/hit bounds and viewport zoom. The optional local-content-bounds capability
and get-local-content-bounds engine query return native content bounds without
raster capture or layout mutation. Unsupported engines fail explicitly. Pixi
uses its owned object's native getLocalBounds; no text-size heuristic is allowed.
The Render/Core facade observes at most 200 unique current IDs, flushing pending
projection once per call then querying each target once. App review compares text
content bounds with declared layout dimensions, recording unavailable fonts or
measurements explicitly; it must not equate missing evidence with a fit.

## Text interface

The toolbar exposes a Text button with a shared T SVG and an active state through
ordinary primary-tool switching. Text rows in Layers use that same SVG. Canvas
creation, direct text editing, and a T keyboard shortcut are deferred; selecting
this toolbar entry does not create or edit a document object.

A single selected Text object shows geometry followed by Typography, Fill, and
Content sections. Typography follows the Figma reference layout while retaining
Asyra shared controls: a full-width font-family menu; one combined font style selector
beside font size; line height beside letter spacing with visible labels; and a
labeled horizontal alignment group. The combined styles are Regular, Italic,
Bold, and Bold Italic, backed by the existing weight/style properties. A style
selection submits both values in one common-API mutation and one Undo step.
Single-line fields reuse Input inside PropertyControl. Numeric typography fields
use themed chevron step buttons with native spinners hidden; steps validate through
the existing text schema and commit once, including when stepping an uncommitted
draft. Line height and letter spacing use the shared typography SVG icons.
The font menu offers browser generic families plus detected common installed fonts;
it preserves the document's current family. Font discovery is owned by the
per-document catalog, reused across field updates and selection changes, and
invalidated when the browser reports a completed font load. Permanent tests prove
both the available choices and measurement counts across reuse/invalidation.
Text uses the complete existing `Fills`, `FillList`, and `FillItem` components,
including color formats, opacity, visibility, add/remove, and solid/gradient modes.
The existing Fill API and transaction owner handle all edits, Undo/Redo, and persistence.
The preset uses the same renderable-fill projection as other paintable elements;
each visible fill becomes one native text paint layer. Empty or hidden fills do
not draw glyphs, while the text layout box remains selectable. Text operations
carry engine-neutral paint, including owned gradient resources. Pixi resource
paints use native glyph masks over the ordinary graphics paint path, preserving
stop alpha and the same gradient coordinates. Clearing or destroying text
releases its glyph and paint children and the shared resource ownership.
The shared App document migration runs before browser load and backend checkpoint
reduction, so both sides use the same property identities. It upgrades original
version-1 Text records without a
Fill slot: it preserves text color in a canonical Fill, allocates collision-free
property IDs, and removes the old typography color from the migrated snapshot.
It does not mutate the input or rewrite already-upgraded Fill records.
The former typography `textColor` field is removed from the current schema; semantic design input uses
`fill`, targeted edits use `fillColor`, and computed context reads `fills`.
Content remains a multiline field because Canvas editing is deferred.
Unsupported vertical alignment, resizing, advanced type controls, and Text
Stroke lists are omitted. Multiple-selection typography is not exposed.

Text and number drafts commit on blur (Enter also commits single-line fields),
while weight, style, and alignment choices commit immediately. Escape discards
the current draft; IME confirmation stays inside the field. Invalid drafts show
an error without changing canonical properties. Each effective commit uses the
existing controller/common API and owns one Undo step. UI state follows selection
and canonical changes, including Undo/Redo. Font names use fonts available to the
browser; this interface does not install or fetch fonts.

`e2e/text-properties.spec.ts` verifies all nine typography properties against
canonical values and actual rendered text pixels, plus Undo/Redo and validation.
`e2e/native-text.spec.ts` covers content persistence and reload. Canvas editing
semantics remain outside these interface tests.
