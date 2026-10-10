export function DeveloperEntry() {
  return (
    <section
      id="build-with-ai"
      aria-labelledby="developer-entry-title"
      className="relative z-20 bg-[#183f35] px-6 py-20 text-[#f4f1e7] lg:px-[8vw] lg:py-28"
    >
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.2fr_.8fr] lg:gap-20">
        <div>
          <p className="text-[12px] uppercase tracking-[.2em] opacity-80">
            Build on a shared foundation
          </p>
          <h2
            id="developer-entry-title"
            className="max-w-2xl pt-5 font-serif text-[40px] leading-[1.08] lg:text-[54px]"
          >
            Focus on your features.
          </h2>
          <p className="max-w-xl pt-6 text-base leading-relaxed opacity-80">
            Asyra provides shared infrastructure for state, actions, and
            history. From your first proof of concept, you are writing your
            product’s code. Focus on implementing features, then keep improving
            that same product without a separate architectural rewrite.
          </p>
          <p className="max-w-xl pt-4 text-base leading-relaxed opacity-80">
            Asyra Skill gives your existing AI coding agent the architecture
            guidance, development workflows, and reference docs to work with
            that foundation and help you implement, test, and iterate on your
            features.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 text-base">
            <a
              href="https://github.com/karote00/asyra/blob/main/plugins/asyra-agent/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-[#f4f1e7] px-6 py-3 text-[#183f35]! focus-visible:outline-[#f4f1e7]!"
            >
              Get Asyra Skill ↗
            </a>
            <a
              href="/docs/start/extend-with-ai"
              className="inline-flex min-h-11 items-center border-b border-current pb-2"
            >
              Build with AI guide →
            </a>
          </div>
          <p className="pt-7 text-sm leading-relaxed opacity-80">
            Prefer to code yourself?{' '}
            <a
              href="#start-building"
              className="inline-flex min-h-11 items-center border-b border-current"
            >
              Explore the starters ↓
            </a>
          </p>
        </div>
        <div className="rounded-xl border border-[#f4f1e7]/25 p-6 lg:p-9">
          <h3 className="m-0 text-[12px] font-normal uppercase tracking-[.2em] opacity-80">
            A foundation to keep building on
          </h3>
          <ol className="m-0 list-none space-y-7 p-0 pt-7">
            {[
              {
                title: 'One foundation, many apps',
                body: 'Develop distinct products on shared infrastructure instead of rebuilding the basics for each app.'
              },
              {
                title: 'Production code from your first prototype',
                body: 'Your PoC is already your product’s implementation. Add and refine features in the same codebase, with the foundation already in place.'
              },
              {
                title: 'Keep evolving your features',
                body: 'Build on explicit boundaries and reusable capabilities to keep changes focused as your product grows.'
              }
            ].map((step, index) => (
              <li key={step.title} className="flex items-start gap-5">
                <span className="pt-1 text-xs tabular-nums opacity-70">
                  0{index + 1}
                </span>
                <div>
                  <p className="font-serif text-[24px] leading-tight">
                    {step.title}
                  </p>
                  <p className="pt-2 text-sm leading-relaxed opacity-80">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
