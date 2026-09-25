/** Model-facing executable examples, validated through the real preparation tools.
 * These are input syntax examples, never fallback artwork or request fixtures.
 */
export const designPreparationExamples = [
  {
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
          width: 100,
          height: 80,
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
  },
  {
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
]
