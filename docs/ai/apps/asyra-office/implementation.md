# Office implementation contract

The unchanged [product plan](asyra-office-product-plan.md) remains the whole-product benchmark. This contract resolves the first executable owner segments following implementation authorization; it does not close or reduce any later stage.

## Foundation

Preset owns the optional shared Three.js adapter, spatial descriptors, geometry, resource disposal and instancing/LoD mechanisms. Sim and FieldScope retain their capability identities, scene composition, lighting and product behavior. The entry is `@asyra/preset/spatial`, explicitly selected under CUSTOM; 2D composition must not load Three.js. No new SDK/version is introduced. Existing Sim and FieldScope engine/descriptor suites are preservation gates.

## Integration and projections

Preset owns a version-1 provider-neutral activity event contract, evidence labels and read-only per-agent projection. Each connection declares structured, local or cooperative fidelity; a cooperative event cannot be promoted to authoritative evidence. Source+sequence identifies ordering and replay. Source/agent/task/attempt identities are explicit. Late old attempts cannot replace a newer attempt. Invalid batches are rejected before any projection or history change. History is append-only at the adapter boundary; persistence acknowledgement is distinct from presentation. A changed agent notifies only that agent. A bounded presentation flush can coalesce intermediate values without dropping accepted log entries. Credentials, raw prompts and private reasoning are not part of the contract.

The local sample is visibly labeled synthetic and starts only on explicit user action. No live provider, Dots telemetry, paid API or external data sharing is implied. Structured/local/cooperative adapters exercise this common contract but are not advertised as live connectors.

## Office interaction

The App owns room, work anchor, park/coffee waypoint, chibi and pet composition. Places focus the camera; Agents and Tasks select/follow the agent. A renderer-local movement clock interpolates authored waypoints and never writes layout or reads tasks per frame. Starting work returns the agent to its anchor; ambient destination/activity remains simulated presentation. Empty, busy, completed, failed, disconnected and reported states remain distinguishable. The scene consumes semantic per-agent changes, not raw event chunks.

## Layout and persistence

Core component/property registrations own the durable room layout. Human and proposed edits use one Feature -> App validation -> canonical transaction path. Finite accepted edits have one Undo boundary. Proposal preview includes the expected layout revision and attribution; stale or invalid proposals reject atomically. Explicit save/load uses Core serialization with an App-versioned envelope. Movement, camera and event projections are excluded. A failed write must not claim saved. This first local snapshot mode is explicit, not an incremental outbox or a multi-user synchronization promise. No server or credentials are configured.

## Cases and verification

Permanent cases cover renderer lifecycle/resource preservation; duplicate/invalid/out-of-order events; attempt replacement; source evidence; per-agent update counts; event burst coalescing with lossless accepted history; movement/task separation; valid and invalid placement; stale proposal rejection; Undo/Redo; save/load and storage failure. Typecheck/build, naming, test placement, workspace/Turbo generation, bounded diff review and affected tests are required. Visual review is a separate required gate; blocked browser access must be reported and cannot be relabeled passed. No hardware frame-rate promise follows from synthetic operation counts.

## Review and remaining obligations

Design review against current public APIs: the existing CUSTOM render provider accepts a shared engine; the two existing adapters share object lifecycle and graphics operations while app lighting/capability identities differ. Core provides property schemas, Features, transactions, Undo/Redo and explicit serialization. Renderer-local transforms can therefore remain outside canonical storage. Provider sequence and attempt checks belong before entity projection, not in React or geometry. Proposal revision checks belong before transaction entry. No step requires a provider credential to prove these boundaries.

Flow Inspector owns the accompanying architecture representation. The static map has owner/handoff structural tests. Dynamic admission remains blocked because the current proof service requires Factory-specific negative scenarios; no Office target or accepted baseline has been admitted. Office tests provide runtime evidence and must not be represented as an accepted whole-target baseline. Live provider permission/fidelity comparisons, durable provider replay, general building/floor construction, full decorating, progression/rewards and target-device profiling remain original-plan obligations until separately implemented and verified.
