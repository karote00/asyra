# FieldScope

FieldScope is a field modeling, offline simulation, and robot monitoring
workstation for harvest robotics. The first version is an Asyra + Three.js
four-bay greenhouse with steel framing, plastic film, soil beds, drains, and
outer passages.

From the repository root, run `yarn workspace @asyra/fieldscope dev`.
For first-time local use, copy this directory's `.env.example` to `.env`; the
development server and E2E suite share `APP_URL`.

[Full dimensions, modeling assumptions, architecture, and follow-up plan](../../docs/ai/apps/fieldscope/README.md)

Each bay is confirmed as 6.3m of strips plus 0.35m side margins on both sides,
for a total of 7m. Internal adjacent margins merge into 0.7m passages; post
positions affect usable clearance. This stage does not include plants, robots,
collision or damage simulation, or live hardware connection.

## Vercel Deployment

The package remains `0.1.0`, keeps `private: true`, and is not published to npm.
Import this repository in Vercel, set Root Directory to `apps/fieldscope`, enable
Include source files outside of the Root Directory in the Build Step, and select
Node.js 24.x.

Install, build, and output directories are defined in this directory's
`vercel.json`; the build uses Turbo to build Asyra dependencies first. Static
deployment does not require `APP_URL`; that variable is only for local
development and E2E. The output is `dist/frontend`, with no backend service.
Only the root page exists, so there is no catch-all rewrite that could return
HTML for missing JavaScript assets. Scene edits are not persisted yet; reloads
return to defaults.

Vercel configuration reference:
<a href="https://vercel.com/docs/monorepos/monorepo-faq" target="_blank" rel="noopener noreferrer">Monorepos FAQ</a>.

Deployment follows the `asyra-design` pattern: install from the repository root,
build through Yarn workspace and Turbo, output `dist/frontend`, enable Git
auto-deploy only for `main`, and keep other branches disabled by default.
FieldScope's Turbo filter builds only this app and its dependencies, without
changing other app deployment settings.
