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
            Build with AI
          </p>
          <h2
            id="developer-entry-title"
            className="max-w-2xl pt-5 font-serif text-[40px] leading-[1.08] lg:text-[54px]"
          >
            Your next app starts with an idea.
          </h2>
          <p className="max-w-xl pt-6 text-base leading-relaxed opacity-80">
            Asyra Skill gives your existing AI coding agent architecture
            guidance, development workflows, and reference docs for building
            with Asyra. Describe what you want to create or improve, then work
            with your agent to build, test, and review the result.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 text-base">
            <a
              href="https://github.com/karote00/asyra/blob/main/plugins/asyra-agent/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-[#f4f1e7] px-6 py-3 text-[#183f35]!"
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
          <p className="text-[12px] uppercase tracking-[.2em] opacity-80">
            Start with a request
          </p>
          <blockquote className="m-0 pt-6 font-serif text-[26px] leading-snug lg:text-[32px]">
            “Help me build a planning board where I can move tasks, undo
            changes, and save my work.”
          </blockquote>
          <p className="pt-6 text-sm leading-relaxed opacity-80">
            Bring your idea and your coding agent. The Skill supplies Asyra
            knowledge; your agent works in your project with the tools and
            permissions you provide.
          </p>
        </div>
      </div>
    </section>
  )
}
