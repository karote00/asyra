import { assert, describe, expect, it } from 'vitest'
import {
  appendAnchorPointToTopology,
  createVectorTopologyFromSinglePoint,
  isVectorTopology,
  setAnchorHandleInTopology
} from '../vector-topology'
import { scaleVectorTopologyAroundCenter } from '../vector-consistency'

describe('isVectorTopology', () => {
  it('rejects array-backed topology collections', () => {
    expect(
      isVectorTopology({
        points: [],
        segments: [],
        networks: []
      })
    ).toBe(false)
  })

  it('accepts record-backed topology collections', () => {
    expect(
      isVectorTopology({
        points: {},
        segments: {},
        networks: {}
      })
    ).toBe(true)
  })
})

describe('scaleVectorTopologyAroundCenter', () => {
  it('scales every anchor and control point while preserving canonical topology ids', () => {
    const topology = {
      points: {
        anchorA: {
          anchorType: 'sharp' as const,
          handleMode: 'none' as const,
          id: 'anchorA',
          kind: 'anchor' as const,
          x: 0,
          y: 0
        },
        anchorB: {
          anchorType: 'sharp' as const,
          handleMode: 'none' as const,
          id: 'anchorB',
          kind: 'anchor' as const,
          x: 10,
          y: 10
        },
        controlA: {
          controlForId: 'anchorA',
          controlRole: 'out' as const,
          id: 'controlA',
          kind: 'control' as const,
          x: 5,
          y: 0
        }
      },
      segments: {
        segmentA: {
          endId: 'anchorB',
          id: 'segmentA',
          inControlId: null,
          outControlId: 'controlA',
          startId: 'anchorA'
        }
      },
      networks: {
        networkA: {
          closed: false,
          id: 'networkA',
          pointIds: ['anchorA', 'anchorB'],
          segmentIds: ['segmentA']
        }
      }
    }

    const scaled = scaleVectorTopologyAroundCenter(topology, {
      scaleX: 2,
      scaleY: 1.5
    })

    expect(scaled).not.toBeNull()
    expect(scaled?.points).toEqual({
      anchorA: {
        ...topology.points.anchorA,
        x: -5,
        y: -2.5
      },
      anchorB: {
        ...topology.points.anchorB,
        x: 15,
        y: 12.5
      },
      controlA: {
        ...topology.points.controlA,
        x: 5,
        y: -2.5
      }
    })
    expect(scaled?.segments).toBe(topology.segments)
    expect(scaled?.networks).toBe(topology.networks)
    expect(Object.keys(scaled?.points ?? {})).toEqual([
      'anchorA',
      'anchorB',
      'controlA'
    ])
  })
})

it('reuses segment records while moving a connected handle and detaches them when removing it', () => {
  const line = appendAnchorPointToTopology(
    createVectorTopologyFromSinglePoint('a', { x: 10, y: 10 }),
    'b',
    { x: 40, y: 60 }
  )
  const id = Object.keys(line.segments)[0]
  const withHandle = setAnchorHandleInTopology(line, 'a', 'out', {
    x: 20,
    y: 30
  })
  const handleId = withHandle.segments[id].outControlId

  assert.isString(handleId)

  expect(withHandle.points[handleId]).toMatchObject({ x: 20, y: 30 })
  expect(line.segments[id].outControlId).toBeNull()
  const moved = setAnchorHandleInTopology(withHandle, 'a', 'out', {
    x: 22,
    y: 24
  })

  expect(moved.segments).toBe(withHandle.segments)
  expect(moved.points[handleId]).toMatchObject({ x: 22, y: 24 })
  const removed = setAnchorHandleInTopology(moved, 'a', 'out', null)

  expect(removed.segments[id].outControlId).toBeNull()
  expect(removed.points[handleId]).toBeUndefined()
  expect(moved.segments[id].outControlId).toBe(handleId)
})
