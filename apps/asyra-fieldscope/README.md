# Asyra FieldScope

A field modeling, offline simulation and live monitoring workspace for
harvesting robots. The first release models a four-bay Asyra + Three.js
greenhouse with steel framing, film, soil beds, drains and perimeter walkways.

Run `yarn workspace @asyra/asyra-fieldscope dev` from the repository root.
Before the first launch, copy this directory's `.env.example` to `.env`;
the development server and E2E tests share `APP_URL`.

[Full dimension contract, modeling assumptions, architecture and follow-up plan](../../docs/ai/apps/asyra-fieldscope/README.md)

Each bay is confirmed at 6.3m of beds/drains plus 0.35m on each side,
for a 7m total. Interior adjoining margins combine into 0.7m passages;
post placement affects usable clearance. The workspace models cucumber and
tomato crops and includes a parked robot concept/design workspace with
conservative lane and energy assessments. It does not simulate patrol or
harvesting, physical dynamics, robot/crop collision or damage, or connect to
live equipment.

## Cloudflare Pages deployment

The App is private and is not published to npm. Use the repository's manual
**Apps - Cloudflare Pages** workflow on `main`. It installs locked dependencies,
builds the App and its dependency graph, verifies the static artifact, and
publishes `dist/frontend` to `asyra-fieldscope.pages.dev`.
See [Cloudflare App delivery](../../docs/ai/workflows/app-cloudflare.md).

`public/_headers` owns the native Pages response policy. Static delivery does
not need `APP_URL` or host a backend. Missing scripts and APIs return real 404s.
Pushes and merges do not deploy. Scene edits are not persisted yet, so reloads
return to the default settings.

## Product identity

The official product name is Asyra FieldScope, with workspace
`@asyra/asyra-fieldscope` and source root `apps/asyra-fieldscope`.
The hosted Cloudflare project remains `asyra-fieldscope`.
The locale preference remains `greenhouse-workspace.locale`; this rename
does not migrate user data, runtime identifiers, or frozen source evidence.
