# Brief capacity follow-up - 101 observation - 2026-10-24

## Scope and outcome

One authorized live run, no video, 120 seconds of drawing work and at most 60
seconds of report-only work. Production and effective expanded-object limits both
remained 10,000. Model: gpt-6-astra / medium. No product edits, CI queries, push or
additional model run were performed during this observation.

Run: `knowledge-quality-knowledge-taipei-101-1792834534052`.
Source HEAD: `ca73c170896faf1be7a39a6b6cd86be965dd9da0`, including the existing
uncommitted brief-capacity correction. HEAD alone does not identify the tested
source; the run preserves its source snapshot and verification digest
`5694d06bbc451201920936e7c39b6f6a9ad65309080aefc12f383fcf00c4eb86`.

First observed content appeared at **37.468 seconds**. This is the browser probe's
first drawing-bounds observation, not a GPU presentation timestamp. The first
screenshot shows the base and podium, satisfying the requested first-visible-content
milestone without requiring a particular drawing order. Final and reload screenshots
show the expanded building. These overview images do not certify fine visual quality.

The result is **partial**. Four successful drawing submissions applied 7, 1,931,
5,802 and 2,841 editable elements, respectively (10,581 total). None individually
exceeded 10,000. Consequently, the new brief-to-safe-capacity path was **not
exercised**, and automatic continuation, single-root preservation and interrupted
remaining-only recovery have no new live evidence from this run. Existing local
regression evidence remains separate.

## Tool results and observed behavior

| Area | Original evidence | Conclusion and limit |
| --- | --- | --- |
| Brief delivery | First main input has a descriptive brief and empty checks; output preserves its review metadata and applies seven elements. | Ordinary brief preparation/application succeeds; this is not an oversized brief test. |
| Actual writes | Four distinct artifact and composition identities; all browser apply results are complete and main receipts success/completed. | No observed rejected submission or mutation retry. The four independently submitted drafts create four roots; no automatic continuation was attempted. |
| Deadline | 27 action starts and 27 completions; all end by 115.405 s. No tool/action events at or after 120 s. Work interruption requested at 120.002 s. | No recorded App operation continued into reporting. Cancellation during an active write was not exercised. |
| Report capture | Report text and screenshot saved; reporting finished about 132.029 s and UI settlement at 132.643 s. | Within the independent 60-second report budget. Report remains model self-attribution, not verification authority. |
| Knowledge | One discovery, parent module read, selected material-method read. | Targeted reading observed. Useful effects cannot be separated causally from the prompt and tool guidance in this single run. |
| Repetition | Second source uses a two-instance pattern; third uses a six-instance pattern. | Actual compact repetition is observed. Fourth source contains 168 explicit children and no pattern; suitability of further compression has not been audited. |
| Visual verdict | Material capture followed by a fail verdict at 86.302 s: reflection too uniform/flat. Review storage succeeds while accepted remains false. | Execution success is distinct from material acceptance. No final whole-building inspection or subsequent material pass exists. |
| Image delivery | Same 298,604-byte PNG digest delivered by the main tool and later review capture. | Duplicate delivery is confirmed. The model reports a forwarding argument error, but its exact cause/location is not independently observable in these App records. |
| Persistence | Durable sequence 337/337; fresh context has matching root order and receipt. | Save/reload succeeds for the existing oracle; not a property-by-property equivalence proof. |

The model explicitly reports unfinished final inspection, exact dimensions,
ornament fidelity and realistic reflection. It does not claim complete visual
acceptance. Its statement that it lacked persistence evidence is compatible with
the harness obtaining persistence evidence after reporting.

## Timeline

Times use the user submission (`2026-10-24T09:35:39.346Z`) as zero. Gaps are
observable intervals between App calls, not measured model thinking. Native local
composition, transport and service waiting cannot be decomposed from these records.

| Interval (s) | Duration (s) | Observed activity |
| --- | ---: | --- |
| 0.000-8.104 | 8.104 | Startup before first tool |
| 8.104-8.118 | 0.014 | Knowledge discovery |
| 8.118-11.172 | 3.054 | Between calls |
| 11.172-11.173 | 0.001 | Parent Knowledge read |
| 11.173-16.801 | 5.628 | Between calls |
| 16.801-16.853 | 0.052 | Main tool contract acquisition |
| 16.853-22.097 | 5.244 | Between calls |
| 22.097-22.098 | 0.001 | Material-method Knowledge read |
| 22.098-36.982 | 14.884 | Last acquisition to first submission |
| 36.982-37.087 | 0.105 | Base and podium application; seven elements |
| 37.087-59.881 | 22.794 | Next-submission interval; first content at 37.468 |
| 59.881-61.150 | 1.269 | Two repeated tiers; 1,931 elements and image |
| 61.150-70.690 | 9.540 | Before criteria and image recapture |
| 70.690-70.737 | 0.047 | Define criteria and capture material evidence |
| 70.737-86.302 | 15.565 | Before visual verdict and next submission |
| 86.302-86.311 | 0.009 | Store material fail verdict |
| 86.311-86.315 | 0.004 | Between calls |
| 86.315-89.833 | 3.518 | Six upper tiers and crown/spire; 5,802 elements |
| 89.833-113.181 | 23.348 | Before final detail submission |
| 113.181-115.405 | 2.224 | Window grids and ornaments; 2,841 elements |
| 115.405-120.002 | 4.597 | No further App tool operation; work deadline |
| 120.002-132.029 | 12.027 | Report transition and report production |
| 132.029-132.643 | 0.614 | UI settlement and report capture |

All eleven top-level App tool intervals total 7.238 s. The native request records
131.613 s overall and 124.375 s outside observed tools/research; that residual
includes reporting and service-side work and is not a hidden-reasoning measurement.
Persistence, checkpoint and fresh-context verification continue after UI settlement;
reload takes 6.503 s and browser cleanup completes about 140.503 s after submission.

| Main submission | Start (s) | Recorded input bytes | Recorded output bytes | Applied elements |
| --- | ---: | ---: | ---: | ---: |
| Base/podium | 36.982 | 1,992 | 1,208 | 7 |
| Two tiers | 59.881 | 3,349 | 1,414 | 1,931 |
| Upper tiers/crown | 86.315 | 5,731 | 819 | 5,802 |
| Window grids/ornaments | 113.181 | 411,882 | 775 | 2,841 |

Byte counts are saved JSON payload bytes, not tokens or full image-inclusive
transport. The final large input is confirmed at the App boundary. These records
do not prove whether the model authored all coordinates or local Code Mode
expanded shorter code into that payload. No such expansion-origin claim is made.

## Historical comparison and fix attribution

The preceding run `1792830831162` first displayed content at 80.545 s. This run is
43.077 s earlier, with a small seven-element first submission at 36.982 s rather
than a first oversized submission at 71.379 s. This is an observed earlier milestone,
not a controlled causal result. Because this run never submitted an oversized brief,
it cannot demonstrate that the brief-capacity fix caused the timing difference.
It also cannot establish equivalent completed artwork quality.

## Evidence preservation and review

Evidence is under `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792834534052/`:

- `run.json`, `source-snapshot.json.gz`, `checkpoint.json`, `first.png`, `final.png`,
  `reload.png`, `self-report.txt` and `self-report.png`.
- `preserved-provider/6726951a-ab09-4263-b2d0-9964bcef1c71.jsonl` is the original
  local-Codex recording; its payload and image files remain archived with the
  other request evidence. 102 original files are listed in `archive-manifest.json`.
- `delivery-verification.json`: all 89 referenced payload/image occurrences,
  representing 88 unique files, match saved lengths and SHA-256 digests. Two image
  deliveries share one preserved original image file.
- `generation-analysis.json` and `handoff-metrics.json` are derived diagnostics,
  checked against original events. Native parser reports complete with no issues,
  eleven completed calls and no incomplete calls; recording failures are zero.
- `services-cleanup.json` records cleanup of this run's services. Browser process
  exit is also independently recorded by the runner. No video was requested.

Self-review checked deadline events, actual browser apply receipts, distinct source
submissions, visual-fail versus tool-success semantics, preservation hashes and
fresh-context reload evidence. No unobserved recovery path is marked successful.
No new production edit or model retry follows this observation.
