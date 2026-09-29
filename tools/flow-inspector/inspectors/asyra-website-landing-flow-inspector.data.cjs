module.exports = Object.freeze({
  authority: {
    specPath: 'apps/asyra-framework-site/docs/spatial-story.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/asyra-website-landing-flow-inspector.data.cjs',
    workspacePath: 'apps/asyra-framework-site'
  },
  caseIds: [
    'continuous-six-chapter-homepage',
    'stable-infrastructure-relations',
    'house-to-tower-replacement',
    'same-footprint-reverse-scroll',
    'single-scroll-owner-idle',
    'static-mobile-and-reduced-motion',
    'native-site-navigation',
    'real-product-evidence',
    'three-building-entry-points',
    'removed-preview-route',
    'canonical-discovery',
    'responsive-artwork-delivery'
  ],
  steps: [
    {
      cacheDimensions: [],
      bypasses: [],
      specRefs: ['#current-homepage-contract'],
      forbiddenContributors: [
        'retired homepage composition as current authority',
        'unverified product claims',
        'new dependencies',
        'changes to Framework or Design runtime'
      ],
      id: 'freeze-result-first-contract',
      order: 1,
      ownerPackage: 'Website Landing contract',
      purpose:
        'Freeze the approved six-chapter homepage and retirement of the separate preview route.',
      inputs: [
        'product-owner approved green continuous story',
        'product-owner homepage integration and /story removal decisions',
        'current Framework product truth'
      ],
      outputs: ['artifact:result-first-contract'],
      conditions: [
        'One coherent six-chapter story is the homepage at /.',
        'The /story route is removed, not redirected.',
        'Keep real product proof, three build/evaluate entry points and supporting navigation.'
      ],
      allowedContributors: [
        'approved website story',
        'current homepage contract'
      ],
      implementationBoundary: [
        'apps/asyra-framework-site/docs/spatial-story.md',
        'docs/ai/framework/plans/website-product-and-technical-evidence-plan.md',
        'tools/flow-inspector/inspectors/asyra-website-landing-flow-inspector.data.cjs',
        'tools/flow-inspector/inspectors/__tests__/asyra-website-landing-flow-inspector.contract.test.cjs'
      ],
      failureOwnerStepId: 'freeze-result-first-contract'
    },
    {
      cacheDimensions: [],
      bypasses: [],
      specRefs: ['#current-homepage-contract'],
      forbiddenContributors: [
        'retired homepage composition as current authority',
        'unverified product claims',
        'new dependencies',
        'changes to Framework or Design runtime'
      ],
      id: 'render-result-first-page',
      order: 2,
      ownerPackage: 'Website Landing page',
      purpose:
        'Compose the accepted story with server-rendered product evidence, resource links and the shared footer.',
      inputs: ['artifact:result-first-contract'],
      outputs: ['artifact:result-first-page'],
      conditions: [
        'One semantic main and h1, six native chapters and one shared desktop scene.',
        'One scheduled scroll owner updates the latest progress and stays idle without input; reverse scroll retraces identical geometry.',
        'Plan to two-storey house to eight-storey tower preserves the footprint and infrastructure planes.',
        'Mobile, reduced motion and no JavaScript retain complete snapshots and native navigation.',
        'Resource content is server-owned and does not subscribe to scroll updates.',
        'FieldScope product evidence uses one fixed responsive slider area with three App screenshots; center and side image frames bottom-align, and side images use the shared stack position and 0.9 scale used by the full-screen preview.',
        'The slider shows at most one side image on each side. Clicking either image changes the active slide through horizontal movement and scale only; the bottom button and dot row is absent.',
        'FieldScope and Asyra Sim use equal responsive stage and image-frame dimensions. Screenshots preserve source aspect ratio with object containment and may leave blank space; image shadows follow the rendered image bounds instead of the shared frame. The top and bottom inset is 12px on desktop and 8px at tablet and smaller widths.',
        'Inline slides and full-screen preview share one horizontal stack-position and scale model. Inline mode shows at most three images and has no thumbnail strip; at 1025px and wider, clicking the center image opens a full-screen preview with blurred backdrop, locked page scrolling, close button, and thumbnails that select a slide. Preview mode shows at most five distinct images: center, up to two on either side; adjacent images are 90% height, outer images 81%, with each front image covering 75% of the image behind it.',
        'Selecting an inline side image or preview thumbnail animates the existing image layers to their new horizontal positions and scales; reduced motion disables the animation.',
        'At 1024px and narrower, the full-screen preview is unavailable and the inline slider remains usable; resizing into that range while the preview is open closes it and restores page scrolling.',
        'Arrow keys and touch swipes remain available, reduced motion disables transitions, and the server-rendered initial image remains available without JavaScript; autoplay is off.',
        'Asyra Sim uses the same slider with its single image and no side previews or slide controls; a single-image case is valid without duplicating the image.',
        'Side-by-side FieldScope and Asyra Sim cards align their summary areas and slider frames, share equal row height, and let summary copy use the full card width.',
        'External links open in a new tab with noopener noreferrer.',
        'The old film and duplicate homepage stories are not mounted.'
      ],
      allowedContributors: [
        'SpatialStory presentation owner',
        'server-owned HomeResources',
        'client-owned product evidence slider presentation',
        'focused product evidence E2E regression',
        'shared SiteFooter',
        'existing site metadata policy'
      ],
      implementationBoundary: [
        'apps/asyra-framework-site/app/page.tsx',
        'apps/asyra-framework-site/app/styles/spatial-story.css',
        'apps/asyra-framework-site/components/spatial-story.tsx',
        'apps/asyra-framework-site/components/home-resources.tsx',
        'apps/asyra-framework-site/components/product-evidence-slider.tsx',
        'apps/asyra-framework-site/__tests__/e2e/product-evidence.spec.ts',
        'apps/asyra-framework-site/lib/spatial-story.mjs',
        'apps/asyra-framework-site/lib/spatial-story.d.mts',
        'apps/asyra-framework-site/lib/story-building.mjs',
        'apps/asyra-framework-site/lib/story-building.d.mts',
        'apps/asyra-framework-site/public/product-evidence',
        'apps/asyra-framework-site/public/illustrations/spatial-story'
      ],
      failureOwnerStepId: 'render-result-first-page'
    },
    {
      cacheDimensions: [],
      bypasses: [],
      specRefs: ['#current-homepage-contract'],
      forbiddenContributors: [
        'retired homepage composition as current authority',
        'unverified product claims',
        'new dependencies',
        'changes to Framework or Design runtime'
      ],
      id: 'verify-result-first-page',
      order: 3,
      ownerPackage: 'Website Landing verification',
      purpose:
        'Verify the integrated homepage, its preserved supporting routes and the reviewed PR revision.',
      inputs: ['artifact:result-first-page'],
      outputs: ['artifact:verified-result-first-page'],
      conditions: [
        'Unit and Inspector contracts, naming, scoped lint, production build and public route smoke pass.',
        'Browser tests cover desktop/mobile, no JavaScript, reduced motion, reverse scroll, idle work and removed /story returning 404.',
        'Inspect opening, intermediate building, product evidence, resource handoff and footer screenshots.',
        'Committed artwork retains true alpha and its bounded transfer size.',
        'Remote PR checks must pass on the exact submitted head before asking the product owner to review; no merge.'
      ],
      allowedContributors: [
        'permanent formal tests',
        'production build',
        'rendered browser screenshots',
        'exact-head remote CI'
      ],
      implementationBoundary: [
        'apps/asyra-framework-site/__tests__',
        'apps/asyra-framework-site/scripts/route-smoke.mjs',
        'apps/asyra-framework-site/scripts/production-smoke.mjs',
        'apps/asyra-framework-site/docs/spatial-story.md'
      ],
      failureOwnerStepId: 'verify-result-first-page'
    }
  ],
  artifacts: [
    {
      id: 'artifact:result-first-contract',
      ownerStepId: 'freeze-result-first-contract'
    },
    {
      id: 'artifact:result-first-page',
      ownerStepId: 'render-result-first-page'
    },
    {
      id: 'artifact:verified-result-first-page',
      ownerStepId: 'verify-result-first-page'
    }
  ],
  routes: [
    {
      id: 'contract-to-page',
      from: 'freeze-result-first-contract',
      to: 'render-result-first-page',
      producedArtifacts: ['artifact:result-first-contract']
    },
    {
      id: 'page-to-verification',
      from: 'render-result-first-page',
      to: 'verify-result-first-page',
      producedArtifacts: ['artifact:result-first-page']
    }
  ],
  invariants: [
    'Any field may define the product while Asyra never decides its domain.',
    'Human and AI intent follow the same governed action path.',
    'A PoC keeps the same implementation on the product path through engineering review and hardening.',
    'New product intent and existing-state application remain distinct routes that settle through the same canonical owners before projections update.',
    'Every constrained Landing section shares one horizontal page geometry contract while the Domain Rail remains full bleed below 1720px and adopts the shared inline padding at and above 1720px.',
    'Complex diagrams use the six immutable supplied Photoroom true-alpha masters with one shared CSS grid-and-shadow stage, while prior and rejected experiments remain preserved but unselected.',
    'The footer contains project navigation only and makes no year, license, open-source, or company identity claim.',
    'All links remain keyboard-focusable and resolve to in-page or Website Platform destinations.',
    'Visible Change and Impact Preview remain absent from the public narrative.',
    'Production deployment occurs only after every Landing gate passes.'
  ]
})
