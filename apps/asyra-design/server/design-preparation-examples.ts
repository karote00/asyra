/** Model-facing executable examples, validated through the real preparation tools.
 * These are input syntax examples, never fallback artwork or request fixtures.
 */
const visibleSurfaceExample = {
  draft: {
    type: 'group',
    name: 'Visible surface',
    brief: {
      intent: 'One editable visible surface',
      viewpoint: 'Fixed 2D view',
      sources: [],
      assumptions: ['Illustrative dimensions'],
      checks: [
        { key: 'surface', property: 'width', expected: 100, tolerance: 0 }
      ]
    },
    children: [
      {
        type: 'vector',
        key: 'surface',
        name: 'Surface',
        rings: [
          [
            { x: 0, y: 10 },
            { x: 100, y: 0 },
            { x: 90, y: 70 },
            { x: 0, y: 80 }
          ]
        ],
        fill: {
          gradientType: 'linear',
          gradientHandles: [
            { x: 0, y: 0 },
            { x: 1, y: 0 }
          ],
          gradientStops: [
            { position: 0, color: '#123456', opacity: 1 },
            { position: 1, color: '#abcdef', opacity: 1 }
          ]
        }
      }
    ]
  }
}

const repeatedWorldFacesExample = {
  draft: {
    type: 'group',
    name: 'Repeated visible detail',
    projection: {
      azimuth: 30,
      elevation: 10,
      scale: 1,
      originX: 100,
      originY: 100
    },
    children: [
      {
        type: 'pattern',
        key: 'panes',
        name: 'Panes',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 3, step: { x: 12, y: 0, z: 0 } }],
        faces: [
          {
            key: 'glass',
            name: 'Glass',
            fill: '#123456',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 8, y: 0, z: 0 },
              { x: 8, y: 0, z: 8 },
              { x: 0, y: 0, z: 8 }
            ]
          }
        ]
      }
    ]
  }
}

const repeatedCurvesExample = {
  draft: {
    type: 'group',
    name: 'Repeated curved detail',
    sharedFills: { accent: '#123456' },
    children: [
      {
        type: 'vector-pattern',
        key: 'curve',
        name: 'Curve',
        template: {
          fill: { shared: 'accent' },
          rings: [
            [
              { x: 0, y: 0, outControl: { x: 5, y: 0 } },
              { x: 10, y: 10, inControl: { x: 10, y: 5 } },
              { x: 0, y: 10 }
            ]
          ]
        },
        placements: [
          { x: 0, y: 0 },
          { x: 20, y: 0 }
        ]
      }
    ]
  }
}

const projectedFaceExample = {
  draft: {
    type: 'group',
    name: 'Explicit world face',
    projection: { azimuth: 0, elevation: 0, scale: 1, originX: 0, originY: 20 },
    children: [
      {
        type: 'projected-face',
        key: 'face',
        name: 'Face',
        fill: '#123456',
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 10, y: 0, z: 0 },
          { x: 10, y: 0, z: 20 },
          { x: 0, y: 0, z: 20 }
        ]
      }
    ]
  }
}

const flowLayoutExample = {
  draft: {
    type: 'frame',
    name: 'Card row',
    width: 100,
    height: 40,
    layout: 'row',
    gap: 10,
    children: [
      {
        type: 'rect',
        key: 'first',
        name: 'First card',
        width: 40,
        height: 40,
        fill: '#123456'
      },
      {
        type: 'rect',
        key: 'second',
        name: 'Second card',
        width: 40,
        height: 40,
        fill: '#abcdef'
      }
    ]
  }
}

export const designPreparationExamples = [
  visibleSurfaceExample,
  repeatedWorldFacesExample,
  repeatedCurvesExample,
  projectedFaceExample,
  flowLayoutExample
] as const

/** Representation decisions belong to the model; the backend only executes the supplied data. */
export const designRepresentationGuidance =
  'Delegate a ready part to prepare_and_apply_design: it owns preparation, optional criteria, writing and inspection; inspect its compact receipt rather than relaying intermediate data. Define intentional shared fills once in draft.sharedFills and use fill:{shared:key}; equal independent inline fills remain independent. For vector rings omit both dimensions to let the owner measure exact bounds. Choose by the data you already have: existing object IDs -> registered batch edits with new values, not reconstruction; arbitrary or already-projected 2D outlines -> vector; repeated identical 2D curves -> vector-pattern template + placements; explicit world-space planar faces in an orthographic view -> projection + projected-face; translated repetitions of those faces -> pattern template + axes; UI placement -> row/column/grid or relations. Let the backend expand suitable templates and calculate projection instead of emitting each derived vertex. Preserve supplied 2D geometry; do not invent depth, force orthographic perspective, or build hidden faces merely to use projection. Irregular/nonrepeating geometry may remain explicit vectors. These choices do not set style, detail level or camera angles.'
