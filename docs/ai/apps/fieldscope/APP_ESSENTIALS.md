# App essentials

- Package: `@asyra/fieldscope`, private version `0.1.0`, under `apps/fieldscope`.
- Purpose: inspect and configure a greenhouse before adding robot telemetry and simulation.
- Runtime: Asyra Core and Preset, React controls, an app-owned Three.js CUSTOM render engine.
- Coordinate system: X across the four bays, Y up, Z along the greenhouse. Origin is the front-left soil surface; one unit is one metre.
- Canonical configuration lives in Core Props. The editor draft, layer visibility, panel state, and camera are transient presentation state.
- Apply is one transaction. Undo and Redo use Core history. Reload starts from defaults; there is no saved-project persistence yet.
- Keep project-authored source, documentation, and PR metadata in English.

See the specifications for numeric defaults and supported edits. These are visualization dimensions, not structural certification or validated crop/robot physics.
