# FieldScope

A field modeling, offline simulation and live monitoring workspace for
harvesting robots. The first release models a four-bay Asyra + Three.js
greenhouse with steel framing, film, soil beds, drains and perimeter walkways.

Run `yarn workspace @asyra/fieldscope dev` from the repository root.
Before the first launch, copy this directory's `.env.example` to `.env`;
the development server and E2E tests share `APP_URL`.

[Full dimension contract, modeling assumptions, architecture and follow-up plan](../../docs/ai/apps/fieldscope/README.md)

Each bay is confirmed at 6.3m of beds/drains plus 0.35m on each side,
for a 7m total. Interior adjoining margins combine into 0.7m passages;
post placement affects usable clearance. The workspace models cucumber and
tomato crops and includes a parked robot concept/design workspace with
conservative lane and energy assessments. It does not simulate patrol or
harvesting, physical dynamics, robot/crop collision or damage, or connect to
live equipment.

## Vercel Deployment

The version is `0.1.0`; keep `private: true` and do not publish an npm package.
Import this repository in Vercel, set Root Directory to `apps/fieldscope`,
enable Include source files outside of the Root Directory in the Build Step,
and select Node.js 24.x. Install, build and output settings come from this
directory's `vercel.json`; the build uses Turbo to build Asyra dependencies
first. Static deployment does not need `APP_URL`; that variable is only for
local development and E2E tests. Output goes to `dist/frontend`; there is no
backend service. The app currently has only the root page, with no catch-all
rewrite, so missing JavaScript assets do not return HTML. Scene edits are not
persisted yet, so reloads return to the default settings.

Vercel configuration reference: <a href="https://vercel.com/docs/monorepos/monorepo-faq" target="_blank" rel="noopener noreferrer">Monorepos FAQ</a>.

The deployment flow follows `asyra-design`: install Yarn workspace
dependencies from the repository root, build through Turbo and publish
`dist/frontend`. Git auto-deploys only from main; other branches stay disabled
by default. FieldScope's Turbo filter builds only this app and its dependencies
without changing other app deployment settings.
