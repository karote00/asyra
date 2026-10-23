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
    linearFields: {
      reflection: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 20 },
        gradientStops: [
          { position: 0, color: '#123456', opacity: 1 },
          { position: 1, color: '#abcdef', opacity: 1 }
        ]
      }
    },
    children: [
      {
        type: 'pattern',
        key: 'panes',
        name: 'Panels',
        origin: { x: 0, y: 0, z: 0 },
        axes: [
          { count: 3, step: { x: 12, y: 0, z: 0 } },
          { count: 2, step: { x: 0, y: 0, z: 12 } }
        ],
        faces: [
          {
            key: 'glass',
            name: 'Glass',
            materialField: 'reflection',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 8, y: 0, z: 0 },
              { x: 8, y: 0, z: 8 },
              { x: 0, y: 0, z: 8 }
            ]
          },
          {
            key: 'rim',
            name: 'Metal rim',
            fill: '#719193',
            vertices: [
              { x: 8, y: 0, z: 0 },
              { x: 9, y: 0, z: 0 },
              { x: 9, y: 0, z: 8 },
              { x: 8, y: 0, z: 8 }
            ]
          }
        ]
      },
      {
        type: 'projected-face',
        key: 'exception',
        name: 'Independent accent',
        fill: '#c0d0c9',
        vertices: [
          { x: 40, y: 0, z: 0 },
          { x: 46, y: 0, z: 0 },
          { x: 43, y: 0, z: 5 }
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

const surfaceGridExample = {
  draft: {
    type: 'group',
    name: 'Regular planar detail',
    projection: { azimuth: 0, elevation: 0, scale: 1, originX: 0, originY: 20 },
    children: [
      {
        type: 'surface-grid',
        key: 'grid',
        name: 'Grid',
        boundary: [
          { x: 0, y: 0, z: 0 },
          { x: 12, y: 0, z: 0 },
          { x: 10, y: 0, z: 20 },
          { x: 2, y: 0, z: 20 }
        ],
        rows: 2,
        columns: 3,
        order: 'cell-major',
        motifs: [
          {
            key: 'inset',
            name: 'Inset',
            fill: '#123456',
            vertices: [
              { u: 0.1, v: 0.1 },
              { u: 0.9, v: 0.1 },
              { u: 0.9, v: 0.9 },
              { u: 0.1, v: 0.9 }
            ]
          }
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

const continuousWorldMaterialExample = {
  draft: {
    type: 'group',
    name: 'Continuous material on two faces',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 0
    },
    linearFields: {
      glass: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 80 },
        gradientStops: [
          { position: 0, color: '#204050', opacity: 1 },
          { position: 1, color: '#b0d0e0', opacity: 0.8 }
        ]
      }
    },
    children: [
      {
        type: 'pattern',
        key: 'facade',
        name: 'Facade',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 0, y: 0, z: 40 } }],
        faces: [
          {
            key: 'surface',
            name: 'Glass',
            materialField: 'glass',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 60, y: 0, z: 0 },
              { x: 60, y: 0, z: 40 },
              { x: 0, y: 0, z: 40 }
            ]
          }
        ]
      }
    ]
  }
}

const mixedComponentExample = {
  draft: {
    type: 'group',
    name: 'Translated components',
    projection: surfaceGridExample.draft.projection,
    children: [
      {
        type: 'pattern',
        key: 'component',
        name: 'Component',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 20, y: 0, z: 0 } }],
        members: [
          {
            type: 'projected-face',
            key: 'panel',
            name: 'Panel',
            fill: '#abcdef',
            vertices: surfaceGridExample.draft.children[0].boundary
          },
          surfaceGridExample.draft.children[0]
        ]
      }
    ]
  }
}

// Scope filtering selects this composition only when independent faces are legal.
const composedMaterialExample = {
  draft: {
    type: 'group',
    name: 'Assembly',
    projection: surfaceGridExample.draft.projection,
    fillTemplates: { edge: '#123456' },
    motifTemplates: {
      detail: [
        {
          ...surfaceGridExample.draft.children[0].motifs[0],
          fill: { template: 'edge' }
        }
      ]
    },
    linearFields: {
      glass: continuousWorldMaterialExample.draft.linearFields.glass
    },
    children: [
      {
        type: 'pattern',
        key: 'unit',
        name: 'Unit',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 20, y: 0, z: 0 } }],
        members: [
          {
            type: 'projected-face',
            key: 'panel',
            name: 'Panel',
            materialField: 'glass',
            vertices: surfaceGridExample.draft.children[0].boundary
          }
        ]
      },
      {
        type: 'projected-face',
        key: 'cap',
        name: 'Cap',
        fill: { template: 'edge' },
        vertices: [
          { x: 0, y: 0, z: 22 },
          { x: 32, y: 0, z: 22 },
          { x: 16, y: 0, z: 24 }
        ]
      },
      {
        type: 'pattern',
        key: 'windows',
        name: 'Windows',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 20, y: 0, z: 0 } }],
        members: [
          {
            ...surfaceGridExample.draft.children[0],
            motifs: { template: 'detail' }
          }
        ]
      }
    ]
  }
}

export const designPreparationExamples = [
  visibleSurfaceExample,
  composedMaterialExample,
  mixedComponentExample,
  repeatedCurvesExample,
  projectedFaceExample,
  continuousWorldMaterialExample,
  flowLayoutExample,
  surfaceGridExample,
  repeatedWorldFacesExample
] as const

/** Representation decisions belong to the model; the backend only executes the supplied data. */
export const designRepresentationGuidance =
  'Delegate a ready part to prepare_and_apply_design: it owns preparation, optional criteria, writing and inspection; inspect its compact receipt rather than relaying intermediate data. Define intentional shared fills once in draft.sharedFills and use fill:{shared:key}; equal independent inline fills remain independent. For vector rings omit both dimensions to let the owner measure exact bounds. Choose by the data you already have: existing object IDs -> registered batch edits with new values, not reconstruction; arbitrary or already-projected 2D outlines -> vector; repeated identical 2D curves -> vector-pattern template + placements; explicit world-space planar faces in an orthographic view -> projection + projected-face; translated repetitions of those faces -> pattern.faces + origin/axes; UI placement -> row/column/grid or relations. For a translated face/grid component, declare ordered pattern.members once (projected-face and surface-grid), then origin/axes; face-only components may use faces. Members retain their materials; no pattern fills, nested pattern or new container. Output order is instance-major, member-major, then grid painter order; the last axis varies fastest. Keep irregular exceptions as separate explicit nodes in their intended painter position. A chosen continuous field uses materialField; an intentional per-piece fill stays local. Let the backend expand suitable templates and calculate projection instead of emitting each derived vertex. Resolve returned artifact targets for local edits; never regenerate canonical IDs from pattern keys. Reuse instanceRanges only for known missing complete instances, never to replay an uncertain partial write. Preserve supplied 2D geometry; do not invent depth, force orthographic perspective, or build hidden faces merely to use projection. Irregular/nonrepeating geometry may remain explicit vectors. For a chosen continuous world material on projected or pattern faces, define draft.linearFields and select materialField on each intended face instead of repeating normalized gradient handles. Plain nodes and surface grids still use native fills. This converts explicit material intent, never automatic lighting or visual approval. These choices do not set style, detail level or camera angles.'
