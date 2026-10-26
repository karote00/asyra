# Prework delivery, native call interval and material preservation follow-up

Read-only investigation of run `knowledge-quality-knowledge-taipei-101-1793002315768`.
No implementation changes or model calls. Existing dirty work is preserved.
Times below are seconds after Send; the provider starts 0.298 seconds later.

## Evidence boundaries

Inputs and outputs were checked against the preserved provider payloads, not just
the earlier report. The saved source snapshot matches current local-ai-provider,
local-provider-activity, local-operation-tools, design-construction and Runtime
recorder sources byte-for-byte. Original run evidence and reports were not edited.

An additional read-only query of the local Codex diagnostic database was scoped
to thread `01a17744-32ee-70c0-8127-bd8e022f0dda`, native process
`pid:70921:46c895bb-6ab9-4003-a63f-84a9c54597b8` and the exact run window.
Selected tool-item metadata, original row IDs and body hashes are preserved in
`tmp/public-activity-native-boundary-followup.json`. Raw reasoning, prompts and
generated code were not copied. This database is supplemental diagnostic evidence,
not a product execution owner or a stable public API.

## Prework: repeated pagination versus redundant content

| Delivery | Actual selection | Logical content bytes | Calls | Finding |
| --- | --- | ---: | ---: | --- |
| Knowledge catalog | Architectural illustration topic only | 5,752 reply bytes | 1 | Scoped catalog, not the complete global catalog |
| Knowledge read | Entry, materials.method, repetition | 31,030 | 2 | Three selections expand to nine unique dependency documents; byte ranges 0–21,963 and 21,963–31,030 do not overlap |
| Drawing usage | draft; projected-face, surface-grid, pattern, vector; optional plan | 27,423 | 2 | Byte ranges do not overlap; vector was never used in a submitted draft; the other selected construction types were used |
| Review/reference full contracts | review_drawing, select_design_references; explicit view=full | 56,577 | 3 | Three distinct pages, not a failed refresh or repeated page |

Including actual requests and page envelopes, these groups transferred 38,948,
30,012 and 65,175 bytes respectively: 134,135 bytes before the first drawing.
There was no refresh request and no repeated byte range in this interval.

The full review contract carries 27,172 bytes of input schema, 9,102 bytes of
output schema and 9,760 bytes of partial-output schema. Its partial-output anyOf
contains the exact full output schema again. The reference tool repeats its
236-byte output schema in the same way. Thus 9,338 bytes of schema values are
duplicated inside the requested full representations. This is independent of
whether the model needed the other full-contract information.

The owner honored view=full. It did not expand a usage request into full schemas.
The selected review capture/bind/record usage route already exists, as does its
formal capture-to-binding-to-record integration test. The general discovery
description documents inputScope, but the initial provider-specific scope guidance
is generated for the main drawing tool. Knowledge's general contract advice also
says composed recipes require full input/output and lifecycle contracts. That is
valid for recipe composition; this invocation was ordinary direct review. These
are candidate handoff ambiguities, not proof of why the model chose full.

Knowledge did not deliver unrelated subject domains or all optional descendants.
The two material method documents contain 11,686 bytes together. The App document
also covers shared-fill coupling, retained color mapping and continuous domains
that this run did not use. They may inform representation choice; lack of later use
alone does not prove they should all be removed. They are candidates for a smaller
decision entry with optional implementation detail, not a reason to drop recovery
constraints or necessary dependencies.

Minimum next change: use the existing operation-scoped executable delivery for
the current review purpose, preserving intentional full inspection. Remove repeated
serialization of identical full/partial output structure through the existing
contract representation; do not remove failure/recovery semantics or raise limits.
DoD: replay the saved lookup selections through the actual dispatcher; demonstrate
lower total bytes and no added calls through capture, binding, record, partial
capture, scope supersession and refresh. Keep explicit full requests legal.

## The 44.53-second interval

| Time | Layer | Recorded event |
| --- | --- | --- |
| 71.085 | Native Code Mode host | Previous description exec finished; host time 12.674 ms |
| 76.861 | Native stream event diagnostics | custom_tool_call item begins, ID ctc_0b3644354d77e8a7016adf0b9cd6f081919e26f6b62e4ae341 |
| 121.384 | Native stream event diagnostics | output_item_done dispatches exec |
| 121.391 | App | prepare_and_apply_design starts |
| 122.762 | App | Drawing tool completes |
| 122.767 | Native Code Mode host | That exec finishes; host duration 1.380 s, handler duration 1.383 s |

The long interval is before Code Mode exec dispatch, not 44 seconds spent inside
the drawing owner. The native process already knew an unfinished custom tool call
existed. App-server did not expose that item through the subscribed public stream.
The App records stdout/stderr chunk size before parsing/filtering and has no
received chunks during the gap; its sink reports zero recording failures. Native
logs for this exact process also contain no rows between the opening item metadata
and the completion boundary, and no warning/error in the examined window.

This locates a missing observational boundary: native custom-output-item start is
not included in the saved App activity timeline. It does not demonstrate a broken
network API, nor establish continuous generation throughout the interval. Parameter
deltas, byte progress, retry/network wait and server scheduling are not available
in this run's retained native diagnostics. Existing native characterization tests
also distinguish scripted progressive versus silent inputs upstream while both
remain invisible before completion on the public App stream; their HTTP/SSE fixture
is not a measurement of this live WebSocket timing.

The generated ThreadStartParams schema labels experimentalRawEvents internal-use
only; it is not a validated replacement for public parameter progress. Public
message/summary recording cannot supply events that the native public stream did
not emit. Adding more App tool spans would not fill this interval.

Minimum next step: incorporate exact-process native tool-item metadata into the
existing offline evidence collection and align it with public/App times. Preserve
source/availability and never use diagnostic database polling as product status.
DoD: identify pending native item versus dispatched exec versus App execution;
retain interrupted/missing items, reject cross-process attribution, and label
parameter progress unavailable unless an actual supported source supplies it.
No new model run is needed to improve this run's attribution.

## Material corrections and the later rejection are different work

| Time | Operation | Verified result |
| --- | --- | --- |
| 127.148 | Capture original representative region | Image shows largely uniform glass fields; AI later marks it fail |
| 188.681–188.715 | Two fill operations | Four existing faces changed to gradients; owner receipts report complete |
| 206.631–206.697 | Capture original region plus adjacent join | Both images succeeded; binding partial because changed scope lacked supersedes |
| 216.492–216.503 | Bind retained images with supersedes revision 2 | Existing images reused; no recapture or drawing replay |
| 223.760 | Record representative material pass | A local pass, explicitly not full-building realism acceptance |
| 235.836–239.971 | Create six upper tiers | 6,943 elements; new pattern uses the corrected glass gradients |
| 303.594–303.638 | Prepare a different podium/base/crown/spire draft | Rejects crownFinX-2050 as nonplanar before any application from this draft |
| 309.661 | Read repair usage | Existing repair route queried, 5,227-byte reply |
| 321.244–324.026 | Repair four crown faces in retained draft | 900-byte repair succeeds; does not resend the 16,528-byte submission |

The final canonical checkpoint still contains all four original face identities,
and their gradient values match every field of the earlier fill patches. The upper
six-tier draft's glassX/glassY definitions also match the corrected gradients.
The original and two subsequent exact submitted inspection images were examined:
the paint changed, but this is not proof of the requested final photorealism.

All four crown fins have the same defect: their last vertex is approximately
4.761041 world units away from the plane of the first three points, versus the
owner's extent-scaled tolerance of 0.0000106085. Under the declared centimeters
scale this is about 4.76 cm, not floating-point noise. Two vertices move from
x=2200 to x=2180 (or equivalent y coordinates) at different heights, twisting the
quad. The repair makes the appropriate coordinate 2200 for every vertex. Planarity
is then satisfied. This protection is valid and should not be removed.

The contract already requires planar faces; the missing capability/handoff is not
an absent warning. Arbitrary 3D vertices leave invariant construction to the model.
A future plane-basis plus local-2D contour representation could delegate that
mechanical relationship to the existing construction owner, while retaining raw
vertices for legitimate use. That is a separate capability proposal, not a fix
implemented in this investigation.

There is also a smaller verified recovery gap: the error identifies a face key but
does not provide its repair JSON pointer or deviation measurement. AI then reads
repair usage and reports calculating indices before submitting replacements at
/children/53/vertices through /children/56/vertices. The owner could return source
locations and measured violation facts through its existing retained-draft repair
receipt, without guessing corrected geometry or replaying prior work.

DoD for such recovery work: a fixed twisted-face input identifies the actual source
path and numeric constraint failure; the real repair consumer applies only selected
source replacements; earlier material edits and tier identities survive; no repeat
application occurs after failed preparation or lost reply. Do not certify visual
quality from successful geometry validation.

## Conclusion

The prior compact timeline made the material sequence and a later independent
construction failure look like one failed correction. The earlier material changes
survived and were reused. Confirmed resource waste is duplicated schema content and
a costly broad contract selection; the long gap is now attributed to a pending
native custom tool call, with its internal progress still unobserved. None of these
findings requires assuming that AI non-adoption alone is the product defect.
