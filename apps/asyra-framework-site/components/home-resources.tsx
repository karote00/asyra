export function HomeResources() {
  return (
    <>
      <section
        id="built-with-asyra"
        aria-labelledby="product-evidence-title"
        className="relative z-20 border-t border-[#183f35]/15 bg-[#f4f1e7] px-6 py-20 lg:px-[8vw] lg:py-28"
      >
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[12px] uppercase tracking-[.2em] opacity-80">
              Built with Asyra
            </p>
            <h2
              id="product-evidence-title"
              className="pt-5 font-serif text-[40px] leading-[1.08] lg:text-[54px]"
            >
              See the foundation
              <br />
              at work.
            </h2>
            <p className="max-w-md pt-6 text-base leading-relaxed opacity-75">
              Asyra Design brings editable layers, app-owned tools, history and
              persistence together in a working design product.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-base">
              <a
                data-site-cta=""
                href="https://asyra-design.vercel.app/?fileId=demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center border-b border-current pb-2"
              >
                Try the live product ↗
              </a>
              <a
                data-site-cta=""
                href="/asyra-design"
                className="inline-flex min-h-11 items-center border-b border-current pb-2"
              >
                Read the product case →
              </a>
            </div>
          </div>
          <figure className="m-0 overflow-hidden rounded-xl border border-[#183f35]/20 bg-[#183f35] shadow-xl">
            <img
              src="/product-evidence/asyra-design-7076-product-evidence.webp"
              alt="Asyra Design with a 7,076-element editable vector drawing and its layer tree"
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
            <figcaption className="px-5 py-4 text-xs text-[#f4f1e7]">
              7,076 elements. Every one remains editable.
            </figcaption>
          </figure>
        </div>
      </section>
      <section
        id="start-building"
        aria-labelledby="start-building-title"
        className="relative z-20 bg-[#e7ebdd] px-6 py-20 lg:px-[8vw] lg:py-28"
      >
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[12px] uppercase tracking-[.2em] opacity-80">
            From here, into code
          </p>
          <h2
            id="start-building-title"
            className="pt-5 font-serif text-[40px] leading-tight lg:text-[54px]"
          >
            Choose your starting point.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                title: 'Generic Starter',
                body: 'Begin with a small editable Item App. The published CLI creates projects from its source and coding-agent guidance.',
                href: '/docs#generic-starter-source',
                link: 'Explore Starter source'
              },
              {
                title: 'Complete Design product',
                body: 'Start from the maintained, editable design tool and adapt its App-owned features and domain to your product.',
                href: '/docs/start/create-design-app',
                link: 'Create a design app'
              },
              {
                title: 'Advanced composition',
                body: 'Assemble the Core and browser capabilities your product needs, then inspect their owner flows in Runtime Atlas.',
                href: '/docs/start/custom-composition',
                link: 'Composition guide'
              }
            ].map((item) => (
              <article
                key={item.href}
                className="flex flex-col items-start border-t border-[#183f35]/30 pt-6"
              >
                <h3 className="m-0 font-serif text-[26px] leading-tight">
                  {item.title}
                </h3>
                <p className="flex-1 pt-4 text-base leading-relaxed opacity-75">
                  {item.body}
                </p>
                <a
                  data-site-cta=""
                  href={item.href}
                  className="mt-7 inline-flex min-h-11 items-center border-b border-current pb-2 text-base"
                >
                  {item.link} →
                </a>
              </article>
            ))}
          </div>
          <a
            href="/atlas"
            className="mt-10 inline-flex min-h-11 items-center border-b border-current pb-2 text-base"
          >
            Inspect Runtime Atlas →
          </a>
        </div>
      </section>
    </>
  )
}
