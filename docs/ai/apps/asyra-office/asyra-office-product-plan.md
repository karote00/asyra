# Asyra Office - Product and Experience Plan

Status: concept for user review. Implementation is not authorized until the user approves the visual direction and explicitly asks to proceed.

Project slug: `asyra-office`. Product display name: `Asyra Office`.

## Product direction

Build a 3D, configurable virtual workplace in Asyra where a person can quickly understand what a team of agents is doing, navigate around a growing multi-room, multi-floor office and its small neighborhood, and inspect work through an agent's current workspace. The office is a useful live map and an optional, transparent progression space, not a chat transcript rendered as a 3D scene.

The visual identity should feel like a friendly miniature neighborhood: rounded chibi agents, a few familiar office pets, compact customizable rooms opening onto simple streets, trees, sidewalks and outdoor gathering areas, tactile materials, and a restrained warm palette. Use an isometric diorama composition that includes both interiors and the exterior environment. Avoid reproducing the reference's glass multi-storey corporate building, large floating white cards, and its exact panel composition.

## Product cases

1. A user scans the office and immediately distinguishes active, idle, blocked, and completed agents without reading a stream of messages.
2. The user selects a zone in the left **Places** tab and the camera moves to that zone (tea point, rooftop, meeting room, washroom, or another configured room).
3. After finishing assigned work, an agent with no next task can enter a visible free-time state. It may use the washroom, nap in a rest nook, walk outside for coffee, or sit in a park. These are simulated office-world activities, not real-world purchases or tool actions.
4. Agents are free to move between their personal workstations, shared rooms, outdoor paths and gathering spots. Their destinations and idle behaviors can reflect current activity and a small set of authored mood/personality preferences; they do not need to sit in a neat row.
5. The user selects an agent in the left **Agents** tab and the camera frames that agent from behind at their current location, showing what they are doing. When an agent is working at a desk, its laptop is visible; when it is on a break, the camera shows the current activity.
6. A workstation remains a familiar personal work anchor, not a mandatory or permanent seat. Its stylized Apple laptop screen shows a concise, privacy-aware summary of the agent's current user-facing activity, not a token stream.
7. The right **Logs** tab shows timestamped, human-readable activity, including clear distinctions between completed work, movement and simulated breaks. The right **Tasks** tab filters tasks by not started, in progress, completed, and blocked. Selecting a task frames its assigned agent from behind; it does not open a task detail view.
8. The user expands a room, adds partitions, chooses a floor finish or rug, decorates one wall with horizontal or vertical wallpaper, and places furniture or fixtures such as clocks, water dispensers, sinks, desks, and chairs.
9. An agent may propose or apply a room layout through the same placement rules as a human. Changes are previewable, undoable, and attributable; agents cannot silently overwrite a user's active layout.
10. The user can explore the exterior, including simple streets, sidewalks, trees, roads, coffee stops, parks and other small outdoor areas connected to office rooms.
11. A busy team emits many internal events and several agents move at once while camera navigation, editing, and selection remain responsive.
12. As validated work accumulates over time, the office can grow from one room into multiple rooms and floors. The user or designated main agent can review expansion/repair proposals and their point cost before applying them.
13. Agents can receive a modest virtual reward for completed work and spend it on in-world treats such as coffee, cookies, and small toys, subject to user-defined autonomy and spending limits.
14. The human who adds their first agent immediately earns **開始 Agents Life**. This celebrates the human's choice to begin building an agent team, even though the agent will do the work.
15. Every agent has its own achievement history and progress record, including personal firsts such as buying its first coffee or toy, commuting to/from work for the first time, and taking its first break during a workday. The office also keeps aggregate/team achievements such as hiring its first agent, its first agent departure/dismissal, and reaching its first milestone; the human operator has their own onboarding achievements. Individual and shared records cover meaningful milestones or mishaps, such as completing work, collaboration, repeated task failures, direction corrections, or task misassignment. These can be warm, humorous learning moments rather than negative ratings.

## Experience map

- **Center - 3D neighborhood:** simple, low-detail modular rooms connected to a small exterior environment with roads, sidewalks, trees and outdoor spots; selectable workstations, agents, pets, and decor. Keep task state legible with a small number of visual signals, not constant animation.
- **Left - navigation:** two tabs, **Places** and **Agents**. Places includes rooms and outdoor spots such as the park and coffee stop; place selection moves the camera there. Agent selection follows and frames that agent at its current location from behind.
- **Right - work context:** two tabs, **Logs** and **Tasks**. Logs are chronological and virtualized. Tasks have status filters and compact rows; selecting one only redirects the camera to its assigned agent.
- **Agent workspace:** each agent has a recognizable personal desk and stylized Apple laptop, alongside the freedom to work, pause, or socialize in suitable shared and outdoor locations. Camera selection follows the agent's current location; the laptop screen uses a small, controlled set of activity labels or a short current-work summary, with no high-frequency text animation.
- **Room editor:** a build/decorate mode separates structural edits (room size, partitions, wall/floor surfaces) from placement edits (rug, furniture, fixtures, plants, pets). Wall finishes are chosen per wall. Provide grid snapping, valid-placement feedback, undo/redo, and a layout preview before applying an agent-authored arrangement.
- **Progression:** a compact office overview shows unlocked rooms/floors, available points, and optional expansion/repair proposals. Progression should feel rewarding but stay secondary to useful work visibility.
- **Achievements:** separate views show each agent's personal record and progress, plus the office-wide/team aggregate record. Each agent can earn its own personal firsts (first coffee, first toy, first commute, first workday break); another agent's earlier first does not consume or block that achievement. The office record includes shared firsts and milestones (first agent hired, first agent departure/dismissal, first team milestone). Human operator achievements remain attributed to the human. Show earned rewards and optional progress toward longer goals, and optionally represent milestones with a small trophy/display area in the office. Achievement discovery must not interrupt active work. **開始 Agents Life** belongs to the human who brought the first agent into the office.
- **Agent rewards:** agents may have a small virtual balance for in-world coffee, cookies, or toys. These purchases are simulated scene changes; they do not charge money or trigger external commerce. Make balances, reward reasons, costs, and limits visible to the user.

## Visual design proposal

- Q-style proportions: compact body, large readable head/face, simple limbs, a few color/accessory variations; no detailed facial rigs or realistic anatomy.
- A small initial pet set (for example cat, dog, and rabbit) acts as office companions, not as additional agents or chat endpoints.
- Buildings are compact, readable room clusters with open walls/cutaway views, connected to a simple neighborhood with streets, roads, sidewalks, trees, and a few outdoor gathering spots. Avoid a giant glass office block. Use a distinctive palette such as ink navy, warm cream, muted jade, and a restrained persimmon accent; keep status colors semantically separate.
- Use low-poly geometry, baked/simple lighting, and limited material variety. Keep environmental motion subtle and optional.
- Camera presets: overview, selected place, selected agent from behind at their live location. Use eased transitions with cancellation/re-targeting so rapid selections do not queue long camera animations.
- Agent placement should feel lived-in rather than grid-aligned: varied workstation layouts, shared tables, lounges, and outdoor rest spots. Mood influences small behaviors and preferred destinations, while active task needs and walkable-space constraints still guide movement.
- When the task queue is empty for an agent, its default activity is available/free time. Choose from a bounded set of ambient activities: restroom visit, short nap, coffee break, park rest, or social time. Activity choice may reflect personality/mood preferences and user-configured rules; make the resulting status visible in the Agents list and logs.
- Ambient activities exist only inside the simulated office world. A coffee break does not place a real order or invoke an external purchase tool. External actions remain explicit agent tasks with their normal permissions and approvals.
- Office growth is modular and persistent: unlock/place additional room modules and floors over time, then furnish them with the same decoration system. Structural changes use preview, validation, attribution, and undo. Floors are navigable as named Places, with clear camera transitions and a way to show, hide, or isolate a floor.
- Progression rewards use transparent rules tied to meaningful completed work, ideally after a configured task success/acceptance signal. Agents cannot award themselves points by emitting more messages, repeatedly splitting tasks, or generating unverified completion events. Define caps and an audit trail before implementation.
- Achievements use explicit, versioned criteria over authoritative task/team outcomes. **開始 Agents Life** is granted to the human/workspace owner exactly once when the first agent is successfully added; agent task completion is not required for this onboarding achievement.
- Include positive milestones and playful learning achievements. Candidate learning achievements include reaching a configured number of failed attempts, consecutive failures, a human-confirmed task-direction correction, or a verified task misassignment/claim. Present these as notable stories and reflection prompts, never as quality scores, blame, shame, public ranking, or a punitive streak loss.
- Failure-related achievements must use clear evidence and context: count distinct task attempts, define what “consecutive” means, and distinguish user-cancelled, tool/environment failure, agent error, and assignment error. Only award a task-direction achievement after explicit correction/feedback or another agreed authoritative signal; do not infer that an agent was “wrong” from message volume alone.
- Attribute a learning achievement to the relevant human, agent, or team based on the event. Where the event reflects shared setup and execution (for example a misassignment), allow joint attribution so both sides can reflect on task descriptions, routing, permissions, or handoff design.
- Maintain a distinct, attributable record per agent and an aggregate office/team record. Individual achievements and progress belong to the agent identity; team achievements belong to the office/team identity. Derive aggregate counts from canonical events and define deduplication so one event can contribute to a team milestone without being copied into every agent's personal award history. Collaboration achievements may explicitly list participating agents.
- Personal firsts are evaluated independently for each stable agent identity. Candidate firsts include the first coffee purchase, first toy purchase, first commute (arrival or departure, with the exact milestone defined), and first break during a workday. The office aggregate may show how many agents have reached a milestone, but it does not replace or award the personal achievement on an agent's behalf.
- Office/team achievements belong to the office identity and describe events across the team's lifecycle. Initial candidates include hiring the first agent, the first agent leaving or being dismissed, and reaching the first configured team milestone. Define neutral, clear dismissal/departure language and permit an achievement to acknowledge the event without framing a personnel change as a success or failure.
- Show a short optional “what could we adjust?” reflection hint with these achievements, such as clarifying acceptance criteria, improving the task brief, or adjusting assignment rules. Keep it exploratory and non-prescriptive; the human and agents can each use the history to improve how they work together.
- Favor quality, variety, sustained collaboration, and user-defined milestones over raw message count, token volume, or repetitive easy tasks. Show why an achievement was earned and what it unlocks; do not attach punitive effects by default.
- Achievement grants are idempotent and attributable so replayed events cannot award duplicate points or items. Keep achievement definitions separate from the event/log presentation and preserve earned history if criteria later change.
- Keep a shared office fund for expansion/repair and separate optional per-agent balances for small treats. A designated main agent may recommend or, under an explicit user policy and budget, initiate an in-world expansion/repair proposal. The user can review, cap, disable, or require approval for these changes.
- Repair and upkeep are optional progression flavor. They must not degrade core app function, hide agents/tasks, or create punitive failure states when ignored.

## Runtime and performance plan

### Complexity controls for the first playable slice

- Treat the concept image as a mood and interaction reference, not a requirement to build every visible prop or the whole neighborhood at once.
- Start with one open-sided office module, one short street/path segment, one small park patch, and one coffee-stop landmark. Keep the exterior as a compact diorama set; roads are scenery and walking surfaces, with no driving or traffic simulation.
- Build a small reusable kit: a few wall/floor/partition pieces, a handful of furniture and fixture shapes, a few low-poly trees, and a small set of chibi body/face/accessory variants. Arrange repeated objects from data rather than authoring every room as unique geometry.
- Use a small set of authored walkable waypoints between named places for the first slice. Agents choose among valid nearby destinations; do not begin with general-purpose city pathfinding, complex crowd avoidance, or a full behavior simulator.
- Keep movement and activity animations to a few reusable states (walk, work, sit/rest, nap). Mood may influence destination preference and pose variation without requiring complex facial animation or a large emotion system.
- Prove one complete path first: select a place, move the camera, follow an agent to a waypoint, view its current activity, and display a corresponding semantic status. Add free-time choices, layout editing, and more scenery only after this thin path is usable and measured.
- During the technical spike, prototype only one representative room, one chibi agent, one pet, and one outdoor waypoint. Measure load, frame pacing, camera movement, and update isolation before increasing scene size or asset detail.
- Do not build progression, virtual balances, floor construction, or a repair economy into the first playable slice. Keep their data and interaction requirements in this plan until the core room/agent path and save/load boundaries are validated.

### Shared 3D foundation in Asyra Preset

- Treat Preset as Asyra's shared defaults/foundation repository for capabilities and architectural patterns that are frequently reused or intentionally shared across Apps.
- Before Asyra Office implementation, consolidate the common Three.js renderer adapter and applicable 3D foundation from Asyra Sim and FieldScope into the Preset-owned Asyra defaults, then have Asyra Office consume that shared foundation.
- The common foundation may own reusable renderer lifecycle, geometry/object primitives, common camera/navigation and LoD mechanisms, and shared 3D composition patterns when their semantics genuinely match across Apps.
- Apps continue to own product-specific scene contents and behavior: agent/pet assets and animation style, office/greenhouse/workcell layouts, domain capabilities, task/workflow semantics, and App-specific interaction policies.
- Reconcile Preset and Framework documentation with this shared-warehouse ownership rule as part of the foundation stage, so the documented owner boundary matches the intended architecture before code is moved.
- This is a bounded shared-foundation stage, not a request to generalize every 3D-specific implementation. Keep extraction driven by actual reuse in the two current 3D Apps and the Asyra Office requirements.

### Ownership boundaries

- The agent runtime remains authoritative for agent execution, task state, and durable event history; it communicates through a versioned adapter/API boundary.
- Asyra Office is provider-agnostic: a shared, versioned integration contract in Asyra Preset normalizes agent identity, task lifecycle, semantic activity summaries, timestamps, artifacts, and connection health. Provider adapters translate each supported runtime into this contract; provider-specific capabilities remain explicit rather than being flattened into assumptions every integration cannot satisfy.
- Support multiple integration fidelity levels: managed provider APIs with structured progress events; local runtime/CLI adapters with process-scoped events; cooperative MCP participants that report through Asyra Office tools; and A2A connections when an external agent advertises a compatible endpoint. MCP primarily lets an agent use Asyra Office tools and context; A2A is for agent-to-agent task exchange. Neither protocol guarantees access to a provider's private runtime state.
- Treat reported state according to its evidence: distinguish authoritative runtime events from agent-reported activity and inferred/ambient presentation. If an integration only reports cooperatively, show that status as reported and do not imply full telemetry.
- Dots can be considered a cooperative integration through Asyra Office MCP tools and, where supported by the user's ChatGPT setup, app-originated MCP Events. Public documentation reviewed for this plan does not establish a third-party API for reading or subscribing to Dots' complete internal task stream; validate actual event visibility and permissions in a technical spike before promising live Dots telemetry.
- Keep provider credentials and permissions scoped per connection. Persist only the user-approved task state, concise activity summaries, timestamps, and artifact references needed by the office; do not treat model reasoning or raw conversation streams as the default office log.
- A presentation projection owns compact agent summaries, current task assignment, and visible recent activity. It is derived from the runtime stream and is not a second editable task model.
- The 3D scene owns renderable transforms, assets, and camera state. It consumes stable entity projections and does not subscribe to raw agent/token events.
- The panels own only their view state (selected tab, filters, scroll position). They subscribe to the narrow projection they display.
- The room layout is durable user-authored configuration. Agent layout changes enter as attributed proposals/transactions, with preview and undo.
- Agent live position and movement are transient runtime presentation state, separate from the durable room/furniture layout. A mood or destination update must not rewrite the layout document.
- Free-time activity is a low-priority ambient state, separate from task execution and external tool permissions. Starting a new task transitions the agent back to task work through an explicit state change.
- Building structure, unlocked rooms/floors, shared points, and per-agent balances are durable progression state with explicit transaction ownership, history, and validation; they are separate from high-frequency movement state.
- Achievement definitions, progress projections, and earned grants have distinct owners. Evaluate progress from authoritative outcomes and issue each grant once. Keep per-agent and team/office achievement projections separate; the collection UI subscribes only to the selected record.
- Reward grants and virtual purchases use an auditable progression ledger. Reward qualification comes from authoritative task outcomes, not raw message volume or self-reported agent events. Virtual goods have no real-money value or external purchase path in the initial product scope.
- Main-agent authority is a user-configured policy boundary. It may propose expansion/repair by default; automatic application is a separate opt-in with explicit point limits and undo/history.

### High-rate event path

1. Accept and persist durable events outside the render loop, with bounded batches and backpressure at the transport boundary.
2. Convert raw events into semantic state changes and append-only log entries. Coalesce redundant intermediate progress for the live scene while retaining the canonical log according to the runtime's retention policy. Record work completion and simulated break transitions as distinct events.
3. Publish compact, entity-scoped projections at a bounded UI cadence. Do not publish every token, tool chunk, or repeated progress value to the scene tree.
4. Update only the affected agent, task row, log viewport, or status indicator. A change to one agent must not rebuild the whole scene or refresh unrelated panels.
5. Batch visible log updates, virtualize long histories, and keep filtering/indexing outside row rendering. Preserve event order and timestamps in the durable history.
6. Keep camera interpolation and animation state local to the scene renderer. Panel state, task projections, and runtime reads must not update on every camera frame.
7. Treat agent movement as low-rate semantic destination changes. Keep path interpolation and idle animation local to the renderer, share navigation data, and update only agents whose goals or visible state changed. Avoid recomputing every agent's route on every frame.
8. Ambient agents still count toward scene and movement budgets: far-away agents can update destinations and poses at lower rates, while near/selected agents get responsive movement. Break animations must pause or simplify when off-screen.

### 3D levels of detail

- **Near / selected:** full simple chibi model, workstation and laptop silhouette, limited idle/work animation, readable activity indicator.
- **Middle / visible room:** simplified mesh and materials, static or low-rate pose, no detailed screen content.
- **Far / overview:** instanced or merged furniture and compact agent markers; omit small props, screen contents, facial detail, and nonessential animation.
- **Off-screen / hidden floor:** do not render; pause nonessential animation and presentation subscriptions. Re-enable on visibility with current authoritative projections.
- **Neighborhood / far exterior:** merge or instance repeated trees, street furniture, lamps, and other props; reduce distant agent motion to simple markers or slow ambient movement. Cull hidden interiors and occluded street blocks.
- **Multi-floor buildings:** render the active floor at full detail and simplify other floors to compact floor markers or low-detail silhouettes. Load detailed room assets on demand when a floor becomes active; keep progression/layout state independent of camera visibility.
- Use distance plus visibility and selection to choose detail. Avoid per-frame React/state updates; let the renderer own camera frames. Share meshes/materials for repeated furniture and pets where the renderer supports it.

### Performance validation plan

Before setting numeric promises, profile the chosen Asyra 3D/rendering path and agree target devices and representative neighborhood sizes. Then define budgets for input-to-visible-status latency, sustained event rate, frame pacing during navigation, memory, visible agents/props, concurrent agent movement, and recovery from event bursts. Use synthetic workloads with many agents, simultaneous movement, and bursty logs, and record work counts (scene updates, entity projection updates, active routes/animations, rendered/culled objects) alongside frame-time profiles. Do not treat dropped/coalesced presentation updates as permission to lose durable events or task transitions.

## Delivery stages after approval

1. **Preset foundation and integration spike:** align Preset/Framework ownership docs with the shared-warehouse rule, consolidate the verified common 3D foundation from Asyra Sim and FieldScope into Preset-owned Asyra defaults, and define the shared multi-provider agent event contract and adapter boundary in Preset. Prove Asyra Office can use the 3D path for one room, one chibi agent, one pet, and one outdoor waypoint; compare one structured provider API, one local runtime/CLI, and one cooperative MCP integration (including Dots feasibility) for event fidelity, permissions, persistence boundaries, and baseline performance before product feature work. Do not promise uniform telemetry across providers.
2. **Office shell:** one open-sided office module, one short street/path, one small park patch and one coffee-stop landmark; overview camera, Places and Agents navigation, personal work anchors with freely placed agents, simple chibi agents, laptop activity summary, and a few waypoint-based ambient activities; no freeform building editor, progression economy, or traffic simulation yet.
3. **Work visibility:** Logs and Tasks tabs, status filters, agent rear-view camera, durable log adapter, event batching, scoped projections, and representative event-load validation.
4. **Room customization:** room expansion, partitions, wall-by-wall wallpaper, floors/rugs, grid placement, furniture/fixtures, undo/redo, and save/load.
5. **Building growth:** add more room modules, then a second floor with clear floor navigation, isolated active-floor rendering, and persistent structure/layout data.
6. **Agent-assisted decorating:** constrained layout proposal schema, preview, attribution, validation, and undo. Agents use the same placement rules as users.
7. **Progression, rewards, and achievements:** define transparent validated-task reward rules, shared expansion/repair fund, capped per-agent treat balances, versioned achievement criteria, idempotent grants, user policy controls, an achievements collection, and an auditable virtual transaction history. Add this only after task outcome and persistence ownership are confirmed.
8. **Performance and polish:** LoD thresholds selected from profiling, culling/instancing as supported, multi-floor visibility controls, reduced-motion/accessibility options, responsive panels, and workload-specific budgets.

Each stage has its own product cases and performance evidence. Numeric budgets, Agent runtime API/persistence shape, deployment, and any new dependency remain undecided until the technical spike and explicit implementation authorization. The shared 3D foundation is Preset-owned by design.

## Decisions needed before implementation

- Which structured provider API should be the first full-fidelity integration target, alongside an MCP-based cooperative path?
- For Dots and other externally hosted agents, is cooperative status reporting sufficient, or is full runtime telemetry a launch requirement? Publicly documented access may differ by provider.
- Which provider event/history guarantees are needed for task states, logs, achievements, and reward qualification?
- Is the first release local/single-user, or does it need shared multi-user layouts?
- Which desktop/browser/device tier is the initial performance target?
- How should office expansion and floors unlock: explicit user goals, points, time-based milestones, or a mix?
- How much autonomy should the main agent have over expansion/repair proposals, and what budgets/approval controls should apply?
- Should agent treat balances be individual, shared, or both, and what task outcome qualifies for rewards?
- Which achievements should belong to the human, an agent, or the whole team, and which should award cosmetics, points, or recognition only?
- What exact authoritative signals define a failed attempt, a consecutive failure, a direction correction, and an accidental task misassignment?
- Which activity details may appear on laptop screens, and should users be able to hide them?
- Are agent-authored layout changes suggestions only, or can selected agents apply them automatically under user-set permissions?

## Scope and review boundary

This document is design planning only. It does not authorize application code, renderer or dependency selection, API changes, data migrations, deployment, or implementation. The next step is user review of the visual direction and product boundaries above.
