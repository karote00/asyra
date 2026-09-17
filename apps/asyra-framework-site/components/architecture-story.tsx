import '../app/styles/architecture-story.css'

const stages = [
  {
    timeline: '--intent-stage',
    boundary: 'Intent',
    title: 'Person or AI intent',
    detail:
      'A person clicks. An AI agent requests an action. Both enter the same product behavior.',
    owner: 'Your product',
    label: '01'
  },
  {
    timeline: '--feature-stage',
    boundary: 'Feature + public API',
    title: 'App Feature and public API',
    detail:
      'Define what the action means once. Your Feature applies domain rules through the public App API.',
    owner: 'App-owned behavior',
    label: '02'
  },
  {
    timeline: '--transaction-stage',
    boundary: 'Transaction + state owners',
    title: 'Transaction and canonical owner',
    detail:
      'State owners accept the changes inside one transaction boundary. Rollback and Undo follow the same governed path.',
    owner: 'Asyra infrastructure',
    label: '03'
  },
  {
    timeline: '--projection-stage',
    boundary: 'Projections',
    title: 'Projections update',
    detail:
      'UI and composed persistence, collaboration, or AI adapters consume accepted changes. Saving and delivery have their own acknowledgement.',
    owner: 'Your connected surfaces',
    label: '04'
  }
] as const

export function ArchitectureStory() {
  return (
    <section
      aria-labelledby="architecture-story-title"
      className="architecture-story mx-auto my-[64px] max-w-[var(--page-max-width)]"
      id="architecture-story"
    >
      <header className="mb-[32px] flex flex-wrap items-end justify-between gap-[24px]">
        <div className="max-w-[620px]">
          <p className="eyebrow">Inside the architecture</p>
          <h3
            className="m-[0px] text-[clamp(28px,3vw,44px)] leading-[1.12] font-[500]"
            id="architecture-story-title"
          >
            Who owns each part?
          </h3>
        </div>
        <a className="text-action" href="#feature-code">
          Go to the code example <span aria-hidden="true">↓</span>
        </a>
      </header>

      <div className="architecture-story__body grid gap-[32px]">
        <div
          aria-hidden="true"
          className="architecture-story__diagram self-start rounded-[16px] border border-solid border-[rgb(255_255_255/20%)] bg-[var(--code-surface)] text-[var(--code-text)] p-[clamp(20px,3vw,40px)]"
        >
          <p className="m-[0px] mb-[20px] text-[12px] font-[600] tracking-[0.12em] uppercase">
            A shared path
          </p>
          <div className="grid">
            {stages.map((stage, index) => (
              <div key={stage.timeline}>
                {index > 0 && (
                  <div
                    data-architecture-connector=""
                    className="ml-[25px] h-[18px] w-[1px] bg-[rgb(255_255_255/20%)]"
                  />
                )}
                <div
                  className="architecture-story__node flex items-center gap-[16px] rounded-[8px] border border-solid border-[rgb(255_255_255/20%)] px-[16px] py-[14px]"
                  style={{ animationTimeline: stage.timeline }}
                >
                  <span className="[font-family:monospace] text-[12px]">
                    {stage.label}
                  </span>
                  <div>
                    <p className="m-[0px] text-[16px] font-[500] leading-[1.3]">
                      {stage.boundary}
                    </p>
                    <p className="m-[0px] mt-[4px] text-[12px] leading-[1.4]">
                      {stage.owner}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ol
          aria-label="Governed Feature runtime path"
          className="m-[0px] list-none p-[0px]"
        >
          {stages.map((stage) => (
            <li
              className="architecture-story__stage grid content-center border-t border-solid border-x-0 border-b-0 border-[rgb(255_255_255/20%)] py-[32px]"
              key={stage.timeline}
              style={{ viewTimelineName: stage.timeline }}
            >
              <span className="mb-[16px] [font-family:monospace] text-[13px] text-[var(--signal-blue-soft)]">
                {stage.label} - {stage.owner}
              </span>
              <h4 className="m-[0px] mb-[16px] max-w-[540px] text-[clamp(24px,2.6vw,36px)] leading-[1.15] font-[500]">
                {stage.title}
              </h4>
              <p className="m-[0px] max-w-[500px] text-[16px] leading-[1.65] text-[rgb(255_255_255/70%)]">
                {stage.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
