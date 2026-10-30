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
        ellipse: {
          center: { x: 5, y: 0, z: 10 },
          u: { x: 5, y: 0, z: 0 },
          v: { x: 0, y: 0, z: 10 }
        }
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
          {
            ...surfaceGridExample.draft.children[0],
            boundary: { face: 'panel' }
          }
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
            ellipse: projectedFaceExample.draft.children[0].ellipse
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
            type: 'projected-face',
            key: 'surface',
            name: 'Surface',
            fill: { template: 'edge' },
            vertices: surfaceGridExample.draft.children[0].boundary
          },
          {
            ...surfaceGridExample.draft.children[0],
            boundary: { face: 'surface' },
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
  'Delegate ready parts to prepare_and_apply_design: preparation, optional criteria, writes and inspection; consume its receipt. Choose from existing data: object IDs -> registered batch edits, not reconstruction; arbitrary/already-projected 2D -> vector (omit both dimensions for measured bounds); identical 2D curves -> vector-pattern template + placements; world planar faces -> projection + projected-face; circles/ellipses -> ellipse:{center,u,v} instead of vertices; translated faces -> pattern.faces + origin/axes; face/grid assemblies -> ordered pattern.members, then origin/axes; UI placement -> row/column/grid or relations. Members keep materials; no pattern fills, nesting or new container. Order: instance, member, grid; last axis fastest. Keep irregular exceptions at their painter position. Let the backend expand templates and calculate projection instead of emitting derived vertices. Define intentional shared fills in draft.sharedFills and use fill:{shared:key}; independent inline fills stay independent. Continuous world materials on projected/pattern faces use draft.linearFields + materialField; plain nodes/grids use native fills. No inferred lighting or visual approval. Resolve artifact targets for edits, never reconstruct canonical IDs from pattern keys. instanceRanges restores known missing complete instances, never uncertain partial writes. Preserve supplied 2D geometry; do not invent depth, force orthographic perspective or build hidden faces to enable projection. Irregular/nonrepeating vectors remain valid; these choices do not set style, detail level or camera angles.'
