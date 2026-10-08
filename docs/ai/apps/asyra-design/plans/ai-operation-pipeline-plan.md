# Operation discovery and ordered drawing composition

Status: design reviewed; implementation pending.
Base: `28daa65db7ba4951df2c6a71a40db6addb1f5243` (merged PR #300).
Closeout owner: this conversation.

## Task - operation pipeline

Resolve known semantic operations directly and let the existing workflow execute
an ordered set of ready parts without a model exchange between deterministic
preparation and application. Preserve editable geometry, full schema recovery,
canonical admission, concurrent user edits and one request's grouped Undo.

Scope: Design server discovery, construction workflow composition, shared prompt,
their direct tests and current specification/Inspector/proof mapping. Existing
preparation, patterns, shared fills, batch actions and request diagnostics remain
the owners. No new executor, generated JavaScript callback, dependency, renderer,
reference acquisition policy, model setting or Framework behavior is introduced.
Discovery is limited to the PR #300 full-run trace, these owners and their direct
consumers. Final review covers the diff, those consumers and the gates below.

## Evidence and decisions

- The last run queried semantic operation identities through the action-name
  selector, then queried operations separately. Guidance recommends both forms
  inconsistently. Add plural exact operations to the existing discovery tool;
  exact names also resolve a unique semantic identity from the same admitted
  registry. No approximate matching or second catalog. Preserve native namespaces,
  explicit ambiguity and partial success when an identity is missing.
- The 39,798-byte refresh followed an abbreviated native definition. Restoration
  is necessary when context is missing. Explain usage and schema-pointer retrieval
  for known contracts, keep full recovery, and test actual response work/bytes.
  Do not promise that a smaller reply removes model reasoning time.
- Existing patterns already expanded two source nodes to 7,401 objects. The
  78-second and 72-second inter-call gaps are provider-owned, not evidence that
  geometry compilation itself took that long. Reuse those construction rules;
  do not add a second geometry interpreter or re-slice an already fast apply.
- Extend the existing prepare-and-apply workflow with ordered `parts`. Each part
  contains a local part key and an ordinary draft or retained-draft repair.
  An explicit `parentPart` refers only to an earlier successful part's returned
  composition ID; it is not an element ID. Existing `parentId` remains available.
  No implicit root or subject-specific hierarchy. Parts may use existing pattern,
  projection and shared-fill definitions. Supply ready work only; do not gather
  an entire design just to use this input.
- Validate the sequence envelope and backward references before writing. Then
  prepare and apply one part at a time through the existing owners. Do not
  compile later geometry before the prior part's apply settles. Each apply still
  checks current existence/locks/permissions, including intervening user edits.
  Retain ordered per-part receipts and actual IDs on later rejection. Stop on the
  first unsuccessful part; never automatically repeat completed or uncertain
  writes. Cancellation remains terminal and existing internal observations retain
  acknowledged work. Successful parts remain members of the existing request Undo
  group; the workflow creates no extra history owner.
- Existing nested tool observations record each preparation and apply input,
  output, duration and outcome. Add sequence identity/index to those observations
  only if the existing parent linkage cannot identify part boundaries. Avoid a
  parallel diagnostics store or invented model-time attribution.

## Step card - compose

Authority: execution spec, Capability discovery and composition; Inspector
`compose`, compose-to-prepare and compose-to-apply. Inputs: admitted registry,
exact selectors, ready ordinary drafts/repairs and explicit earlier-part links.
Outputs: exact execution/schema guidance and ordered acknowledged part receipts.
Conditions: unique identities, existing validation before each canonical apply,
no automatic retry. Bypasses: direct edits, single ready parts and advice retain
their current paths. Contributors: registry, native workflow and domain guidance.
Forbidden: model code evaluation, inferred geometry, alternate action/history
owners. Boundary: local-operation-tools, local-design-workflow, domain prompt,
their tests and execution-flow proof; exact contract updates in the existing
spec/Inspector. Failure owner: compose, preserving downstream failure evidence.
Stop for a required owner expansion, unsafe partial mutation or schema mismatch.

## Product cases and gates

1. Batch exact operations, action names and unique semantic names resolve the
   same admitted definitions. Unknown and ambiguous matches remain explicit;
   mixed requests preserve valid results. No canvas exchange or model call.
2. Usage, fragments, repeated lookup and full refresh retain exact schema/revision
   meaning. A sequence definition remains obtainable through native discovery.
3. The first part applies before the next part is compiled. Each ordinary source
   compiles exactly once; existing patterns preserve output and work bounds.
   Parent links consume actual receipt IDs, including non-root existing parents.
4. Invalid envelopes/forward links reject before writes. A later preparation,
   permission or apply failure returns earlier receipts and stops successors.
   Cancellation stops new work. A retry explicitly submits remaining work and
   uses existing IDs; no receipt claims unknown write settlement is safe to retry.
5. Existing single-part, repair, review, shared Fill, editable geometry, live
   grouped Undo, concurrent editing and CRDT tests stay valid. Add whole-route
   proof for discovery and ordered part handoffs using current canonical owners.

Run test-first focused regressions, naming, source-bound Inspector proof and
applicable routed local CI. After bounded review, perform one full Taipei 101
live run with the unchanged approved prompt/model, headless recording, fit once
at first drawable content and once after completion, then hold ten seconds.
Fix the local harness's confirmation-label case assumption before that run;
do not include personal recording scripts in the PR. Report first content,
total time, owner spans, actual failures, calls/bytes and remaining limitations.
Fetch/rebase current main and validate affected work before the authorized push.
Create a new PR and notify review; do not merge it.

## Design review

The workflow composes existing owners; it does not make an aggregate sequence
atomic. This is intentional: the user must see acknowledged parts, and existing
request-group semantics retain them on Stop. Envelope errors are known up front;
geometry errors may appear at a later part and must preserve that distinction.
All inputs are available at invocation, so this improves known ordered work, not
token streaming or unknown future model decisions. A one-part request remains
the fastest route when only one part is ready. No timer or object-count target
is used to make quality or latency decisions.
