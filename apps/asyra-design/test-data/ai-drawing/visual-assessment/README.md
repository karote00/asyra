# Independent visual assessment cases

`unfolded-structure.png` is the unchanged first structural overview from request
`d7320406-dc64-4ad2-a9db-2e683bcc7578`, 2026-10-04. It is a retained App-generated
failure, not a hand-corrected drawing or reference photograph.

The frozen negative case requests a realistic solid building. The frozen positive
control intentionally requests this folded-panel, abstract appearance. Both use
identical pixels. This checks that review follows user intent rather than a fixed
angle/realism rule. It does not establish a general accuracy rate or compare model
speed. Source reference selection and original-byte transport have separate unit
coverage. Run this pair once before the next full drawing, retaining failures.

Run the formal `local-visual-assessment-live.test.ts` with `.env` loaded and
`VISUAL_ASSESSMENT_LIVE=true` in that local file. Model and executable come from
the same App settings; it starts no App server and cannot mutate a canvas.

`disconnected-facades.png` preserves `inspection-0.png` from request
`371cb16f-e499-4a17-9e6b-bc346e0bc6c6`, 2026-10-04. Its criterion deliberately
only says “One fixed oblique view”; the original realistic-building request must
still reject disconnected planes through the independent whole-request judgment.
Each evaluation writes a new evidence directory and preserves prior outcomes.

`accepted-detailed-illustration.png` is the unmodified user-provided screenshot
`asyra 101.png`, previously accepted as approximately 95% satisfactory. Its positive
case checks the requested detailed realistic illustration style and whole visible
form, without assuming photographic output. It is calibration evidence, not a
native-detail or geometry oracle, and does not replace full App acceptance.

`accepted-upper-tiers.png` preserves the completed App screenshot from request
`6bc5351c-7d54-4699-8750-1ec1363d3820` (2026-10-04). The user explicitly accepted
its realism after that run. The historical automatic partial outcome is retained;
this fixture calibrates the original upper-two-tiers brief against that judgment.
Optional polish is separate from required corrections. Five cases passed the
post-run calibration; this is bounded evidence, not a general accuracy claim.
