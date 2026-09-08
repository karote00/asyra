# Phase 5 Sol Local Integration - Bounded Closeout

Date: 2026-09-08. Base: merged PR #167, `5c7af4d0b`.
Delivery: PR #168, branch `codex/flow-inspector-phase-5-real-agent`.

## Completed boundary

The user selected Sol (`gpt-5.6-sol`) and authorized the existing ChatGPT
subscription through installed Codex app-server 0.153.4. The actual model list
confirmed Sol before execution. No API key, added dependency or tool upgrade was
used. The authorization limited the trial to twelve adapter turns, and each task
to 300,000 ms, thirty broker operations and three attempts. The service binds the
explicit authorization, owner step, allowed source, retained obligations and
immutable baseline before dispatch. The model has only broker JSON operations.

This closes the selected macOS local integration trial. It does not close the
original full Phase 5/6 plan or turn candidate verification into accepted source,
protected evidence issuance, delivery or mandatory GitHub enforcement.

## Actual provider evidence

Task `4ef0b75b-ac23-43a0-8de7-4d4900daa007` was delegated from the original
Board's `finalize-transaction-state` step. Only
`packages/factory/src/data-transact.ts` was writable in its isolated candidate.
The explicit task requested a deliberate negative checkpoint followed by repair;
this was a guided regression exercise, not an independently discovered bug.
Sol first changed inverse restoration from the previous value to the forward
value. The unchanged formal verifier failed `cancel.outcome` and
`cancel.delivery`, while the other four obligations passed. On the same task's
second attempt, Sol received the failure evidence, restored the previous value
and extracted it into a local `previousValue` before assignment. All six
obligations passed. The final reviewable diff changes source expressions, not
comments. Original checkout source and accepted mapping revision remain unchanged.

Task `34586650-4fc6-4fb9-9368-f2a3e41b74ca` was also delegated from the Board.
After one real read turn, CLI cancellation interrupted the next provider turn.
The owned local PID ended; the remote outcome and usage remained unknown.
The Board projected the same cancellation and performed human handoff. A CLI
resume was refused as unresolved. Restart retained both tasks, their evidence,
reservations and cumulative budgets. Read-only browser replay after restart
proved Board/API/CLI agreement without another model request.

| Task | Attempts | Broker calls | Elapsed ms | Reserved turns | Provider-reported known tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| Regression and correction | 2 | 7 | 71,705 | 7 | 278,880 |
| Cancellation and handoff | 1 | 1 | 16,683 | 2 | 6,909 |

Nine of twelve authorized turns were reserved. Eight settled; one remains
unresolved. Known provider-reported tokens total 285,789, excluding the unknown
cancelled turn. Actual independently measured token usage, internal HTTP/SSE
retry counts and monetary cost are unknown. No hard token/cost claim is made.

Local evidence is retained under `tmp/flow-inspector/live-sol/` and the original
control-plane task store. The candidate diff is `candidate.diff`; task records
include `task-first.json`, `task-corrected.json`, `task-cancelled.json` and
`resume-refusal.json`. Browser replay artifacts are under
`tmp/flow-inspector/visual-review/provider-live-*`. These contain genuine live
records; they are not committed fixtures or credentials. Fresh clones run the
reproducible offline suite; the live replay requires these retained records.

## Formal validation and interface correction

Offline adapter contracts cover authorization, scope denial, malformed/oversized
output, provider failure, missing usage, limits, cancellation, restart, handoff,
secret exclusion and original-baseline preservation. Actual macOS tests deny
undeclared source reads, child creation, credential writes and replacement or
deletion of the read-only credential reference. Candidate sandbox policy is
unchanged. The real trial exposed a Board projection bug: a reserved active turn
was prematurely labeled as needing reconciliation. A formal failing browser
case preceded the correction; active reservations now show pending, while
unresolved or terminal missing-usage records require reconciliation.

The permanent live-record browser test asserts the retained real behavior,
source diff, six obligations, cancellation uncertainty and API/CLI agreement,
and captures review screenshots without spending model quota. The full original
Board suite preserves seven cards, ten routes, links, zoom and detail panels.
The milestone passed 48 related formal tests, the six-case full Board suite,
and a separate live-record replay before and after restart. Naming passed all
eleven cases; repository lint has no errors and 79 existing warnings. Earlier
branch validation includes 144 control-plane tests, twelve React tests, one
hundred static/pack/consumer contracts, typecheck/build and the seven-run proof.
PR checks must pass on the exact delivery HEAD before review notification.

## Explicit remaining boundaries

### Local cancellation follow-up - 2026-09-09

The subscription transport now gives the matching app-server interruption
notification a bounded one-second grace period. Task completion waits for the
pending observation after transport cleanup, retaining optional interruption
confirmation across restart without reconciling cloud execution or usage.
The Board shows persistent investigation guidance, source/audit review links
and human handoff while the unresolved dispatch block remains intact.
Formal offline cases distinguish acknowledgement, matching and wrong-turn
notifications, missing receipts, disconnects and late results. Existing live
records are replayed read-only; no new model request or retroactive interruption
confirmation is claimed. The earlier actual cancellation remains unresolved.

### Deferred capabilities

The ephemeral app-server interface supplies no independently queryable receipt
for the cancelled remote request. Further provider dispatch in this store stays
blocked; handoff, restart, a new task or human acknowledgement cannot claim it
settled. Additional reconciliation capability is future work. API-key auth,
keyring-only credentials, unsupported hosts, hard token/cost limits and credential
refresh requiring writes remain unsupported. Internal HTTP retries are not a
hard-limited network request count. The verified local test does not establish
arbitrary project or general autonomous implementation competence.

The verifier is not independently protected against hostile JavaScript in its
own process. GitHub required-check protection, independent verifier/issuer,
protected remote execution/transport, real GitHub merge refusal, Phase 6
integrations and standalone dynamic execution outside Asyra remain deferred.
The package remains independently versioned and outside Framework bulk release;
the existing patch Changeset records this work. No version application, tag,
merge, publication, protection or deployment setting change is performed.
