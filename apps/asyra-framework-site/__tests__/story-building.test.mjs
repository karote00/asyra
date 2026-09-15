import assert from 'node:assert/strict'
import test from 'node:test'
import { getBuildingGeometry, buildingExample } from '../lib/story-building.mjs'
import { getStoryFrame } from '../lib/spatial-story.mjs'

test('the same footprint rises from zero to two floors, then eight floors', () => {
  const plan = getBuildingGeometry(0, 0)
  const house = getBuildingGeometry(1, 0)
  const tower = getBuildingGeometry(1, 1)
  assert.equal(plan.height, 0)
  assert.equal(
    house.height,
    buildingExample.floorHeight * buildingExample.houseFloors
  )
  assert.equal(
    tower.height,
    buildingExample.floorHeight * buildingExample.towerFloors
  )
  for (const id of ['front', 'side']) {
    const ground = (value) =>
      value.parts
        .find((p) => p.id === id)
        .points.split(' ')
        .slice(0, 2)
    assert.deepEqual(ground(plan), ground(house))
    assert.deepEqual(ground(house), ground(tower))
  }
  const windows = (value) =>
    value.parts.filter(
      (p) => p.id.startsWith('front-window') && p.opacity === 1
    ).length
  assert.equal(windows(plan), 0)
  assert.equal(windows(house), 4)
  assert.equal(windows(tower), 16)
})
test('growth waits for the state change and tower growth waits for replacement docking', () => {
  assert.equal(getStoryFrame(2, 0.62).effects.house, 0)
  assert.ok(getStoryFrame(2, 0.8).effects.house > 0)
  assert.equal(getStoryFrame(2, 0.94).effects.house, 1)
  assert.equal(getStoryFrame(3, 0.47).effects.tower, 0)
  assert.ok(getStoryFrame(3, 0.65).effects.tower > 0)
  assert.equal(getStoryFrame(3, 0.83).effects.tower, 1)
})
test('all projected intermediate states are finite and exactly reversible', () => {
  for (let i = 0; i <= 100; i++) {
    const geometry = getBuildingGeometry(1, i / 100)
    assert.deepEqual(geometry, getBuildingGeometry(1, i / 100))
    assert.equal(
      new Set(geometry.parts.map((p) => p.id)).size,
      geometry.parts.length
    )
    for (const part of geometry.parts) {
      assert.ok(part.opacity >= 0 && part.opacity <= 1)
      assert.ok(
        part.points
          .split(/[ ,]/)
          .every((value) => Number.isFinite(Number(value)))
      )
    }
  }
})

test('each storey unfolds its slab before raising walls and finishing its facade', () => {
  const early = getBuildingGeometry(0.08, 0)
  assert.ok(early.floors[0].slab > 0)
  assert.equal(early.floors[0].wall, 0)
  assert.equal(early.floors[1].slab, 0)
  const wall = getBuildingGeometry(0.23, 0)
  assert.equal(wall.floors[0].slab, 1)
  assert.ok(wall.floors[0].wall > 0 && wall.floors[0].wall < 1)
  assert.equal(wall.floors[0].facade, 0)
  assert.equal(wall.parts.find((p) => p.id === 'roof-left').opacity, 0)
  const home = getBuildingGeometry(1, 0)
  const extending = getBuildingGeometry(1, 0.45)
  assert.deepEqual(extending.floors.slice(0, 2), home.floors.slice(0, 2))
  assert.ok(extending.floors[2].wall > extending.floors[5].wall)
  for (let i = 0; i <= 100; i++) {
    const frame = getBuildingGeometry(i / 100, 0)
    for (const floor of frame.floors) {
      if (floor.wall > 0) assert.equal(floor.slab, 1)
      if (floor.facade > 0) assert.equal(floor.wall, 1)
    }
  }
})
