import type { ReactNode } from 'react'

import '../app/styles/brand-story.css'

const chapters = [
  { id: 'story-imagine', label: 'Imagine', timeline: '--imagine-chapter' },
  { id: 'story-build', label: 'Build', timeline: '--build-chapter' },
  { id: 'story-evolve', label: 'Evolve', timeline: '--evolve-chapter' },
  { id: 'story-inside', label: 'Inside', timeline: '--inside-chapter' },
  { id: 'story-begin', label: 'Begin', timeline: '--begin-chapter' }
] as const

export function StoryNavigation() {
  return (
    <nav
      aria-label="Explore the story"
      className="story-navigation sticky top-[0px] z-[30] border-x-0 border-t-0 border-b border-solid border-[var(--frame-rule)] bg-[var(--paper)] px-[var(--page-padding-x)]"
    >
      <ol className="mx-auto my-[0px] grid max-w-[840px] list-none grid-cols-[repeat(5,minmax(0,1fr))] gap-[8px] p-[0px]">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="min-w-[0px]">
            <a
              href={`#${chapter.id}`}
              style={{ animationTimeline: chapter.timeline }}
              className="story-navigation__link block border-x-0 border-t-0 border-b-[2px] border-solid border-[transparent] py-[14px] text-center text-[clamp(10px,1.1vw,13px)] font-[600] leading-[1.4] focus-visible:outline-[2px] focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--signal-red)]"
            >
              {chapter.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function StoryChapter({
  index,
  children
}: {
  index: 0 | 1 | 2 | 3 | 4
  children: ReactNode
}) {
  const chapter = chapters[index]
  return (
    <div
      id={chapter.id}
      data-story-chapter={chapter.label}
      className="story-chapter scroll-mt-[64px]"
      style={{ viewTimelineName: chapter.timeline }}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}
