# Two-turn consultation diagnostic - 2026-10-25

The authorized observation completed both non-drawing requests and both bounded
reports in 115.432 seconds. It did not observe cross-query Knowledge body reuse.
It did expose a more upstream handoff: the second request had the same App
conversation ID but a new native thread and no previous design direction in its
actual work input. The model explicitly acknowledged that missing context.
No product behavior was changed or model retry performed.

## Reproduction and evidence

- Run: `knowledge-consultation-1792943745017`.
- Work started: 2026-10-25 23:55:52.773 Asia/Taipei.
- Shared work budget: 120 seconds; reporting may extend at most 60 seconds beyond
  that deadline. First-request reporting consumes the shared work clock.
- Actual UI outcomes: `no-change`, `no-change`; neither deadline was reached.
- Both native records identify `gpt-6-astra`, effort `medium`.
- No video, attachments, forced Knowledge reads, tool-name hints or lowered budgets.
- Product HEAD: `04d87366167e048e719129b67f10dbb6929fd5f2`; existing local work
  was preserved. The captured source manifest was unchanged throughout the run.
- Formal manual entry: `apps/asyra-design/test-data/knowledge-evaluation/run-consultation.mjs`.
  Its three deterministic sequencing tests are in the existing local test entry.
- Evidence directory: `tmp/knowledge-evaluation/knowledge-consultation-1792943745017/`.
- Original provider directory: `tmp/consultation-provider-1792943688578/`.
- Six execution records passed the existing Runtime record parser; all 23 referenced
  payloads exist and match their recorded byte lengths and SHA-256 digests.
- `analysis.json` derives values using the existing record parser, payload reader
  and tool-call summarizer. Original JSONL and payload files were not rewritten.
- Both work answers, self-reports, report screenshots and overall screenshots are
  saved. `before.json` and `after.json` contain identical document data and IDs:
  only the original workspace exists. Final screenshot was visually inspected.
- Browser cleanup completed. All three task-owned service PIDs and ports were
  confirmed stopped. A conservative collaboration cleanup-name check initially
  refused; exact cwd/command verification then allowed cleanup, preserving both records.

## Actual requests and behavior

The prompts are preserved verbatim in `run.json`. The first asks for composition,
facade and glass/metal material direction without drawing. The follow-up asks to
continue that direction and explain reflection, value structure and material
consistency, still without drawing.

| Boundary | First request | Second request |
| --- | --- | --- |
| Knowledge discovery | `contexts: [architectural-illustration]` | Empty arguments |
| Discovery output | Context-visible catalog, 9,596 bytes | Four general topics, 1,086 bytes |
| Knowledge body read | Materials and projection, together | None |
| Required closure | Architecture parent plus the two selected topics | Not observed |
| Paging | None; one complete reply | Not applicable |
| Explicit reuse / recovery | None | None |
| App tool status | Two successful reads, no mutation | One successful discovery, no mutation |
| Work answer | Concrete cold glass / matte silver proposal, three-quarter view and upper-left soft light | General material advice; explicitly says the prior concrete settings are unavailable |

The three returned bodies contain 1,547, 1,479 and 1,423 UTF-8 bytes. Each matches
its source-frozen domain file exactly, including constraints. Source identities
and the complete ordered closure were retained. There is no repeated body across
these two requests because only one body read occurred. Absence of a second read
cannot demonstrate successful reuse, a fixed duplicate-delivery bug, or failure
of the existing `reuseFrom` mechanism.

The first answer's continuous reflections and stable projection are consistent
with the advice actually read. This supports availability and compatible use,
not proof that Knowledge caused a better answer. The second answer used no newly
read Knowledge body; its consistency with similar principles is not evidence
that it retained the first request's Knowledge.

## Confirmed context handoff

Both requests have App conversation ID
`conversation-004d6298-c15d-4f35-9f76-a3729888315d`.
Their native threads differ:

- First: `01a173c6-897e-75c3-8869-632129e49108`.
- Second: `01a173c7-5693-7c33-924b-f51b1a73b074`.

The second actual work input is preserved at
`041db470-fc3f-41c4-99c7-7468d6e98a52.payloads/4-input.json`.
It contains actions, attempt, current empty-canvas context, the new intent, and
metadata containing target IDs, conversation/turn/request IDs and the evaluation
window. It contains neither the first user request nor its design answer, read
Knowledge bodies or held-result references. The second work answer explicitly
states that the previous concrete settings are not visible.

Current implementation corroborates this observation:

- `src/ai/conversation.ts:701` builds target/identity metadata and sends only the
  current request intent to the feature at line 734.
- `server/local-ai-provider.ts:402` creates request-scoped Knowledge.
- The provider starts an ephemeral native thread at line 1814.
- Request cleanup disposes Knowledge at line 2150; both records confirm cleanup.

A conversation ID is attribution, not content delivery or retained-session access.
The confirmed gap is that an ordinary follow-up saying "continue the previous
direction" does not receive that direction in this tested path. Creating fresh
sessions and refusing foreign reuse references remain valid protections; carrying
old context keys alone would not repair the missing semantic context.

Hypothesis, not established cause: missing prior context may contribute to the
second request using unscoped discovery. The saved query does explain the general
catalog returned, but this single observation cannot prove why the model chose it.

## Timeline

Offsets use original `recordedAt` wall-clock timestamps relative to Send; owner
execution durations use their own monotonic spans. Do not mix those clocks to
attribute unobserved internal work.

| Offset | Activity | Interval |
| --- | --- | --- |
| 0.000-0.899 s | First request setup and work-input delivery | 0.899 s |
| 0.899-7.621 s | First model work before discovery | 6.722 s |
| 7.621-7.629 s | Context-scoped discovery | 0.008 s |
| 7.629-13.694 s | Between discovery and selected read | 6.065 s |
| 13.694-13.696 s | Selected Knowledge read | 0.002 s |
| 13.696-37.330 s | Model work until first design answer completes | 23.634 s |
| 37.330-37.333 s | Transition to bounded report | 0.003 s |
| 37.333-51.418 s | First evaluation self-report | 14.085 s |
| 51.418-53.964 s | Capture, follow-up submission and next native setup | 2.546 s |
| 53.964-61.188 s | Second model work before discovery | 7.224 s |
| 61.188-61.193 s | Unscoped discovery | 0.005 s |
| 61.193-97.116 s | Model work until second material answer completes | 35.923 s |
| 97.116-115.208 s | Second evaluation self-report | 18.092 s |
| 115.208-115.432 s | Report and screenshot capture | 0.224 s |

First frame: not applicable; both requests explicitly prohibit drawing, and the
full before/after document comparison confirms no canvas changes. First design
answer completed at 37.330 seconds. Both evaluation reports consumed 32.177 seconds
of wall-clock time; this is harness overhead, not measured Knowledge retrieval.
The three App tool spans total approximately 15.24 ms. The remaining model work
intervals include orchestration, generation and delivery; public records do not
separate internal computation from upstream/network waiting.

## Resource boundaries

| Observable measure | First request | Second request |
| --- | ---: | ---: |
| App Knowledge calls | 2 | 1 |
| App Knowledge argument bytes | 171 | 2 |
| App Knowledge reply bytes | 15,395 | 1,086 |
| Knowledge body bytes | 4,449 | 0 |
| Registered native contract bytes | 530,608 | 530,608 |
| Native RPC sent bytes | 592,030 | 576,939 |
| Native RPC received bytes | 260,643 | 306,145 |
| Reported input tokens, including reports | 94,585 | 69,239 |
| Of those, cached input tokens | 72,192 | 50,688 |
| Reported output tokens, including reports | 1,156 | 1,177 |
| Complete generated Code Mode program bytes | Unavailable | Unavailable |

The App Knowledge exchange totals 16,654 bytes. Both declarations contain 49
native tools with deferred discovery and zero eager definitions; registration size
is not proof that the model read every schema. Native RPC transport, nested App
exchange and token counters are different measurement boundaries and must not be
added into a purported single provider cost. Counters include the evaluation
reports and cannot establish ordinary two-turn latency or monetary savings.
The existing public records preserve App-visible contracts/arguments/replies and
native work/report inputs/outputs, but not the complete outer Code Mode program
or underlying model HTTP requests. Those missing measurements are not zero.

## Limits and next bounded investigation

This test is useful evidence of the context handoff, not an acceptance test for
cross-query reuse. The original comparison assumed a shared consumer/session
across App turns; the measured implementation does not provide that continuity.
Do not force more reads or repeat the model run to manufacture a reuse event.

The evaluation wrapper also replaces the ordinary displayed work answer with a
self-report. Both original work answers were retained separately as
`turn-1-answer.txt` and `turn-2-answer.txt`. This test alone does not establish that
normal, non-evaluation UI discards answers. The missing prior context in the actual
next request is independently visible and corroborated by the shared production
submission path.

The next useful issue is previous design decisions to follow-up request context:
inspect the existing conversation/context owner before choosing a minimal fix.
A future bounded DoD should require needed prior intent/decisions to reach the
actual next native input, preserve independent/new-conversation behavior, respect
session-scoped references and permissions, avoid write replay, and measure total
context/round-trip cost. Do not solve it by forwarding all history or introducing
another session/cache by default. No such product modification was made here.
