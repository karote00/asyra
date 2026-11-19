# Taipei 101 - previous run versus retest - 2026-11-02

> Withdrawn as a completed-run comparison following user review. The retest did not finish the requested building and is not eligible for comparison with the completed baseline. The original measurements below are retained only as historical failure evidence, not as a performance or quality benchmark.

The retest regressed in observed task fulfillment: the previous run produced a complete building silhouette; the retest stopped after two tiers because inspection image delivery repeatedly failed. Its shorter settlement is **not faster completion**. This is a descriptive comparison of two single runs on different source versions, not a controlled causal experiment.

## Matched and changed conditions

| Condition | Previous | Retest |
| --- | --- | --- |
| Run | `taipei-101-fixed-1793560952884` | `taipei-101-fixed-1793605813138` |
| Source | `ca83647639baa03906a467942cd9c0f20f8225d2` | `50e153ff713da9f0748348e6bbd52464a6652b72` |
| Submit, Taiwan time | 2026-11-02 03:22:38.147 | 2026-11-02 15:50:19.099 |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` | Identical |
| Model / effort | gpt-6-astra / medium | Identical |
| Inputs | No attachments, history or extra hints | Identical |
| Deadline / viewport | 600 s / 1920 × 1080 DPR 1 | Identical |
| App result | success / executed | partial / executed |
| Full building | Base through spire present, with quality limitations | Only two adjacent tiers |
| Final visual acceptance | Recorded 6/6 accepted; offline current=false, not a visual certificate | No accepted final review; nine required coverage units pending |
| Persistence | 697/697; verified corrected reopen equals source | 160/160; checkpoint and reload equal source |
| Drawing delivery errors | None observed | Three invalid snapshot dimensions failures |

Current source includes integration with newer main tool and Knowledge contracts. Model decisions, retrieved references, service conditions and source versions are uncontrolled. One run per version cannot isolate the cause of the change or estimate reliability.

## Numeric comparison

| Metric | Previous | Retest | Retest minus previous |
| --- | ---: | ---: | ---: |
| App settlement seconds | 352.501 | 279.253 | -73.248 |
| First paint seconds | 50.205 | 199.362 | +149.157 |
| Vectors | 20,906.000 | 5,058.000 | -15,848.000 |
| Total scene nodes | 20,920.000 | 5,060.000 | -15,860.000 |
| App calls | 48.000 | 18.000 | -30.000 |
| Partial App calls | 0.000 | 4.000 | +4.000 |
| Native research calls | 1.000 | 2.000 | +1.000 |
| Knowledge discovery/read calls | 0.000 | 2.000 | +2.000 |
| Successful imported references | 8.000 | 5.000 | -3.000 |
| Input tokens | 1,828,763.000 | 1,327,560.000 | -501,203.000 |
| Cached input tokens | 1,710,592.000 | 1,247,360.000 | -463,232.000 |
| Noncached input tokens | 118,171.000 | 80,200.000 | -37,971.000 |
| Output tokens | 13,882.000 | 5,226.000 | -8,656.000 |
| Total tokens | 1,842,645.000 | 1,332,786.000 | -509,859.000 |
| Root request bytes | 351,286.000 | 457,711.000 | +106,425.000 |
| Transport sent bytes | 9,418,794.000 | 2,633,210.000 | -6,785,584.000 |
| Transport received bytes | 12,749,633.000 | 2,245,938.000 | -10,503,695.000 |


First paint was 149.157 seconds later (3.971 times the previous latency). Settlement was 73.248 seconds earlier because work stopped incomplete. Lower tool count, token use, transport size and node count therefore cannot be claimed as efficiency gains. Root request size rose by 106,425 bytes despite unchanged user prompt; it includes application context and contracts.

## Behavioral differences

| Area | Previous | Retest | Interpretation |
| --- | --- | --- | --- |
| Construction strategy | Six prepare/apply calls plus three edit batches | One prepare/apply for two representative tiers | Different agent execution strategy |
| Contract lookup | Nine calls, 313,463 output bytes | Nine calls, 131,180 output bytes | Same count, different selected content |
| Knowledge | No explicit discovery/read | One discovery and one selected method read, 31,447 output bytes | Advice used; causal effect unproven |
| Reference acquisition | Four calls, eight successful imports | Three calls, five successes and one failed page | Acquisition partially recovered |
| Review | Eight drawing reviews, ten design reviews | Two drawing reviews, both delivery failures | Agent could not receive requested images |
| End behavior | Declared completion with saved full tower | Disclosed incomplete base, remaining tiers and spire | Honest partial settlement preserved |
| Visual quality | Dense windows but stylized materials, simplified base/crown/spire | Dense frames on two tiers, flat shading, incomplete ornament and building | Neither run independently proves architectural accuracy |

## Measurement corrections

The previous raw recorder contains 397 submissions and 396 false prompt-mismatch errors because it classified receipt POSTs as root prompts. Normalize to **one actual root request**; preserve the raw evidence. The retest correctly separates one root request and eight receipts, with no recorder errors.

The original previous reload image was captured too early and appeared blank. Its separate corrected reopen loaded 20,920 nodes in 12.527 seconds, made zero AI requests and matched the final document. The retest waits for expected node count and directly verifies equality. Do not interpret the earlier blank image as persisted data loss or as an improvement in rendering correctness.

Provider `completed` and recorder exit 0 are transport/process states in both tests. App settlement and visual completeness own user-task outcome. Different review coverage schemas/counts are not comparable completion percentages.

## Evidence and next decision

The observed priority for a future authorized fix is the inspection image delivery path: trace the first invalid snapshot dimension contract, add a reproducing regression, and verify overview and local-region delivery without replaying writes. This report does not implement that fix or authorize a new test run. Additional controlled runs would be needed to evaluate performance or repeatability.

- [Detailed retest report](taipei-101-retest-2026-11-02.md)
- [Previous detailed report](../plans/completed/ai-conversation-improvements-2026-11-02-report.md)
- [Previous raw run](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793560952884/run.json)
- [Retest raw run](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/run.json)

Local raw evidence remains in ignored project `tmp`; report links require those retained artifacts.
