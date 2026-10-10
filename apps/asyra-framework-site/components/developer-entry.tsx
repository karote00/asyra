export function DeveloperEntry() {
  return (
    <section
      id="build-with-ai"
      aria-labelledby="developer-entry-title"
      className="mt-10 grid gap-6 rounded-xl border border-[#183f35]/25 bg-white/35 p-6 md:grid-cols-[1fr_auto] md:items-center lg:p-8"
    >
      <div>
        <h3
          id="developer-entry-title"
          className="m-0 font-serif text-[26px] leading-tight"
        >
          Asyra Skill
        </h3>
        <p className="max-w-2xl pt-3 text-base leading-relaxed opacity-75">
          Give your existing AI coding agent Asyra’s architecture guidance and
          workflows, then start implementing your features.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base md:flex-col md:items-start">
        <a
          href="https://github.com/karote00/asyra/blob/main/plugins/asyra-agent/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-full bg-[#183f35] px-6 py-3 text-[#f4f1e7]! focus-visible:outline-[#183f35]!"
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
    </section>
  )
}
