import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import {
  prepareQueryExactForwardFrame,
  prepareQueryExactInstanceFrame
} from '../ray-query'
import { dyadic } from '../../domain/scalar-arithmetic'
import { WalkingSourceRelationEvaluator } from '../walking-source-relation'
import {
  nonlinearExact,
  nonlinearFraction,
  nonlinearFixture,
  nonlinearGcd,
  nonlinearNeg,
  nonlinearRequired
} from './walking-motion-test-fixtures'
import type { NonlinearFraction } from './walking-motion-test-fixtures'

describe('canonical nonlinear first sheet witness', () => {
  it('proves the recorded first sheet collision with independent source halfspace clipping', async (context) => {
    await context.annotate(
      'Starting bounded first sheet source witness',
      'info'
    )
    const { source, demand, cycle, cycleOwner } = nonlinearFixture()
    const parameter = nonlinearFraction(1n, 2n)
    const point = cycleOwner.evaluate(cycle, 0, parameter)
    const robotInventory = source.rig.bodies.flatMap((body) =>
      body.parts.flatMap((part) =>
        part.regions.map((region) => ({ body, part, region }))
      )
    )
    const robot = nonlinearRequired(robotInventory[600])
    expect([
      robot.body.id,
      robot.part.id,
      robot.region.id,
      robot.region.indexStart,
      robot.region.indexCount
    ]).toEqual(['right-front-lower', 'right-front-lower', 'region-0', 0, 36])
    const world = demand.freePassage.exclusions.filter(
      (entry) => entry.kind === 'source'
    )
    const matches = world.filter(
      (entry, index) =>
        robotInventory.length + index === 31903 &&
        entry.region.id === 'region-4' &&
        entry.region.kind === 'sheet' &&
        entry.region.indexStart === 24 &&
        entry.region.indexCount === 6 &&
        entry.transform.instance?.yaw === Math.PI &&
        entry.transform.instance.position.every(
          (value, k) => value === [3.1500000000000004, 0, 24.650000000000002][k]
        )
    )
    expect(matches).toHaveLength(1)
    const selected = nonlinearRequired(matches[0])
    expect(selected.mesh.id).toBe('cucumber-1914-11-2')
    expect(selected.instance).toBe(44)
    const instance = nonlinearRequired(selected.transform.instance)
    expect(selected.transform.descriptor).toBe(selected.mesh.descriptor)
    expect(selected.mesh.regions.includes(selected.region)).toBe(true)
    expect(selected.mesh.descriptor.instances?.[selected.instance]).toBe(
      instance
    )
    const exactFrames = Object.freeze([
      prepareQueryExactInstanceFrame(instance),
      prepareQueryExactForwardFrame(selected.transform.descriptor)
    ])
    const lift = (v: ReturnType<typeof dyadic>) =>
      v.exponent >= 0
        ? nonlinearFraction(v.significand << BigInt(v.exponent))
        : nonlinearFraction(v.significand, 1n << BigInt(-v.exponent))
    const scalar = (n: number) => nonlinearExact(n)
    const zero = scalar(0)
    const oracleWork = {
      arithmeticChecks: 0,
      maxBits: 0,
      maxChecks: 100000,
      bitLimit: 24000
    }
    const check = (...values: bigint[]) => {
      oracleWork.arithmeticChecks++
      for (const value of values) {
        const bits = (value < 0n ? -value : value).toString(2).length
        oracleWork.maxBits = Math.max(oracleWork.maxBits, bits)
        if (
          bits > oracleWork.bitLimit ||
          oracleWork.arithmeticChecks > oracleWork.maxChecks
        )
          throw new Error('Independent sheet witness arithmetic limit')
      }
    }
    const product = (a: bigint, b: bigint) => {
      check(a, b)
      if (
        a &&
        b &&
        (a < 0n ? -a : a).toString(2).length +
          (b < 0n ? -b : b).toString(2).length >
          oracleWork.bitLimit
      )
        throw new Error('Independent sheet witness product limit')
      const result = a * b
      check(result)
      return result
    }
    const plus = (a: NonlinearFraction, b: NonlinearFraction) => {
      const g = nonlinearGcd(a.denominator, b.denominator)
      const n =
        product(a.numerator, b.denominator / g) +
        product(b.numerator, a.denominator / g)
      check(n)
      return nonlinearFraction(n, product(a.denominator / g, b.denominator))
    }
    const minus = (a: NonlinearFraction, b: NonlinearFraction) =>
      plus(a, nonlinearNeg(b))
    const times = (a: NonlinearFraction, b: NonlinearFraction) => {
      const g = nonlinearGcd(a.numerator, b.denominator),
        h = nonlinearGcd(b.numerator, a.denominator)
      return nonlinearFraction(
        product(a.numerator / g, b.numerator / h),
        product(a.denominator / h, b.denominator / g)
      )
    }
    const quotient = (a: NonlinearFraction, b: NonlinearFraction) => {
      if (!b.numerator) throw new Error('Singular witness inverse')
      return times(a, nonlinearFraction(b.denominator, b.numerator))
    }
    const dot = (
      a: readonly NonlinearFraction[],
      b: readonly NonlinearFraction[]
    ) => a.reduce((sum, v, i) => plus(sum, times(v, b[i])), zero)
    const sub = (
      a: readonly NonlinearFraction[],
      b: readonly NonlinearFraction[]
    ) => a.map((v, i) => minus(v, b[i]))
    const cross = (
      a: readonly NonlinearFraction[],
      b: readonly NonlinearFraction[]
    ) =>
      [0, 1, 2].map((i) =>
        minus(
          times(a[(i + 1) % 3], b[(i + 2) % 3]),
          times(a[(i + 2) % 3], b[(i + 1) % 3])
        )
      )
    const affine = (
      matrix: readonly (readonly NonlinearFraction[])[],
      origin: readonly NonlinearFraction[],
      v: readonly NonlinearFraction[]
    ) => matrix.map((row, i) => plus(dot(row, v), origin[i]))
    const bodyFrame = nonlinearRequired(
      point.parts.find((p) => p.part === robot.part)
    ).exact
    const cofactor = [
      cross(bodyFrame.matrix[1], bodyFrame.matrix[2]),
      cross(bodyFrame.matrix[2], bodyFrame.matrix[0]),
      cross(bodyFrame.matrix[0], bodyFrame.matrix[1])
    ]
    const determinant = dot(bodyFrame.matrix[0], cofactor[0])
    expect(determinant.numerator).not.toBe(0n)
    const inverse = (v: readonly NonlinearFraction[]) => {
      const translated = sub(v, bodyFrame.origin)
      return [0, 1, 2].map((k) =>
        quotient(
          dot(
            cofactor.map((row) => row[k]),
            translated
          ),
          determinant
        )
      )
    }
    const original = (
      shape: typeof robot.part.shape,
      start: number,
      count: number
    ) => {
      const offsets = Array.from({ length: count / 3 }, (_, i) => start + 3 * i)
      const indices = [...new Set(shape.indices.slice(start, start + count))]
      const vertices = indices.map((index) => ({
        index,
        coordinates: shape.positions.slice(index * 3, index * 3 + 3),
        exact: shape.positions.slice(index * 3, index * 3 + 3).map(scalar)
      }))
      return {
        vertices,
        triangles: offsets.map((offset) => ({
          offset,
          indices: shape.indices.slice(offset, offset + 3)
        }))
      }
    }
    if (selected.mesh.descriptor.shape.kind !== 'triangles')
      throw new Error('Foreign sheet shape')
    const solid = original(
      robot.part.shape,
      robot.region.indexStart,
      robot.region.indexCount
    )
    const sheet = original(
      selected.mesh.descriptor.shape,
      selected.region.indexStart,
      selected.region.indexCount
    )
    const localPoint = (index: number) =>
      nonlinearRequired(solid.vertices.find((v) => v.index === index)).exact
    const key = (v: readonly NonlinearFraction[]) =>
      v.map((q) => q.numerator + '/' + q.denominator).join(',')
    const edges = new Map<string, number>()
    const planes = solid.triangles.map((triangle) => {
      const vertices = triangle.indices.map(localPoint)
      for (let i = 0; i < 3; i++) {
        const edge = key(vertices[i]) + '>' + key(vertices[(i + 1) % 3])
        edges.set(edge, (edges.get(edge) ?? 0) + 1)
      }
      const normal = cross(
        sub(vertices[1], vertices[0]),
        sub(vertices[2], vertices[0])
      )
      expect(normal.some((v) => v.numerator !== 0n)).toBe(true)
      const distances = solid.vertices.map(
        (v) => dot(normal, sub(v.exact, vertices[0])).numerator
      )
      const negative =
        distances.every((d) => d <= 0n) && distances.some((d) => d < 0n)
      const positive =
        distances.every((d) => d >= 0n) && distances.some((d) => d > 0n)
      expect(negative || positive).toBe(true)
      return {
        origin: vertices[0],
        normal: positive ? normal.map(nonlinearNeg) : normal
      }
    })
    for (const [edge, count] of edges) {
      expect(count).toBe(1)
      expect(edges.get(edge.split('>').reverse().join('>'))).toBe(1)
    }
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 2,
      maxExactPredicates: 5000000,
      maxBits: 24000
    })
    const node = evaluator.prepareRationalNode([bodyFrame], 24000)
    const preparedSolid = evaluator.prepare(robot.part.shape, robot.region)
    const preparedSheet = evaluator.prepare(
      selected.mesh.descriptor.shape,
      selected.region
    )
    expect(preparedSolid.certified).toBe(true)
    const solidPlacement = evaluator.rationalPlacement(preparedSolid, node, 0)
    const sheetPlacement = evaluator.rationalPlacement(
      preparedSheet,
      node,
      -1,
      exactFrames
    )
    const scale = lift(node.scale)
    const worldSheet = sheet.vertices.map((v) => {
      const worldPoint = exactFrames.reduce(
        (p, f) =>
          affine(
            f.matrix.map((row) => row.map(lift)),
            f.position.map(lift),
            p
          ),
        v.exact
      )
      return { ...v, world: worldPoint, solidLocal: inverse(worldPoint) }
    })
    const verifyCompiled = (
      vertices: typeof solid.vertices,
      placement: typeof solidPlacement,
      direct: (v: readonly NonlinearFraction[]) => NonlinearFraction[]
    ) =>
      vertices.map((v) => {
        const expected = direct(v.exact)
        const compiled = placement.frames
          .reduce(
            (p, f) =>
              affine(
                f.matrix.map((row) => row.map(lift)),
                f.position.map(lift),
                p
              ),
            v.exact
          )
          .map((q) => quotient(q, scale))
        expect(compiled).toEqual(expected)
        return { index: v.index, world: expected, compiledWorld: compiled }
      })
    const solidCoordinates = verifyCompiled(
      solid.vertices,
      solidPlacement,
      (v) => affine(bodyFrame.matrix, bodyFrame.origin, v)
    )
    const sheetCoordinates = verifyCompiled(
      sheet.vertices,
      sheetPlacement,
      (v) =>
        exactFrames.reduce(
          (p, f) =>
            affine(
              f.matrix.map((row) => row.map(lift)),
              f.position.map(lift),
              p
            ),
          [...v]
        )
    )
    const outcomes = sheet.triangles.map((triangle) => {
      let polygon = triangle.indices.map(
        (index) =>
          nonlinearRequired(worldSheet.find((v) => v.index === index))
            .solidLocal
      )
      const initial = polygon
      expect(
        cross(sub(polygon[1], polygon[0]), sub(polygon[2], polygon[0])).some(
          (v) => v.numerator !== 0n
        )
      ).toBe(true)
      for (const plane of planes) {
        const next: NonlinearFraction[][] = []
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i],
            b = polygon[(i + 1) % polygon.length]
          const da = dot(plane.normal, sub(a, plane.origin)),
            db = dot(plane.normal, sub(b, plane.origin))
          if (da.numerator <= 0n) next.push(a)
          if (
            (da.numerator < 0n && db.numerator > 0n) ||
            (da.numerator > 0n && db.numerator < 0n)
          ) {
            const t = quotient(da, minus(da, db))
            next.push(a.map((v, k) => plus(v, times(t, minus(b[k], v)))))
          }
        }
        polygon = next
      }
      const triangleNormal = cross(
        sub(initial[1], initial[0]),
        sub(initial[2], initial[0])
      )
      for (const v of polygon) {
        expect(
          planes.every((p) => dot(p.normal, sub(v, p.origin)).numerator <= 0n)
        ).toBe(true)
        expect(dot(triangleNormal, sub(v, initial[0])).numerator).toBe(0n)
        for (let i = 0; i < 3; i++) {
          const side = cross(
            triangleNormal,
            sub(initial[(i + 1) % 3], initial[i])
          )
          expect(dot(side, sub(v, initial[i])).numerator >= 0n).toBe(true)
        }
        const roundtrip = inverse(affine(bodyFrame.matrix, bodyFrame.origin, v))
        expect(roundtrip).toEqual(v)
      }
      const centroid = polygon.length
        ? [0, 1, 2].map((k) =>
            quotient(
              polygon.reduce((sum, v) => plus(sum, v[k]), zero),
              scalar(polygon.length)
            )
          )
        : null
      const strictInterior =
        centroid !== null &&
        planes.every(
          (p) => dot(p.normal, sub(centroid, p.origin)).numerator < 0n
        )
      const result = evaluator.relateRationalSheetTriangle(
        solidPlacement,
        sheetPlacement,
        node,
        triangle.offset
      )
      expect(result.kind).toBe(
        polygon.length ? 'surface-intersection' : 'separated'
      )
      return {
        triangleOffset: triangle.offset,
        originalIndices: triangle.indices,
        originalInSolidFrame: initial,
        clippedLocus: polygon,
        centroid,
        strictInterior,
        production: result
      }
    })
    const intersections = outcomes.filter((r) => r.clippedLocus.length)
    const artifact = {
      format: 'walking-sheet-source-witness/1',
      phase: 0,
      parameter,
      authority:
        'Independent original-source convex halfspace clipping after exact rational inverse placement',
      originalEvidence: 'test-supervision/1789419134707693000-28803',
      identities: {
        sourceDefinition: source.definition.definitionId,
        profile: source.definition.sourceModel.kind,
        sourceCurrent: cycleOwner.read(source, cycle.recipe) === cycle,
        pointSourceCurrent: point.source === source,
        pointRecipeCurrent: point.recipe === cycle.recipe,
        exactPartCurrent: point.parts.some(
          (p) => p.part === robot.part && p.exact === bodyFrame
        ),
        exclusionCurrent: demand.freePassage.exclusions.includes(selected),
        descriptorCurrent:
          selected.transform.descriptor === selected.mesh.descriptor,
        instanceCurrent:
          selected.mesh.descriptor.instances?.[selected.instance] === instance,
        regionCurrent: selected.mesh.regions.includes(selected.region)
      },
      first: {
        inventoryIndex: 600,
        bodyId: robot.body.id,
        partId: robot.part.id,
        region: robot.region,
        original: solid,
        exactFrame: bodyFrame,
        certifiedSourcePlanes: planes,
        coordinates: solidCoordinates
      },
      second: {
        inventoryIndex: 31903,
        meshId: selected.mesh.id,
        layer: selected.mesh.layer,
        instanceIndex: selected.instance,
        instance,
        region: selected.region,
        descriptor: {
          position: selected.mesh.descriptor.position,
          rotation: selected.mesh.descriptor.rotation,
          color: selected.mesh.descriptor.color,
          roughness: selected.mesh.descriptor.roughness,
          metalness: selected.mesh.descriptor.metalness,
          surface: selected.mesh.descriptor.surface
        },
        shapeDigest: createHash('sha256')
          .update(JSON.stringify(selected.mesh.descriptor.shape))
          .digest('hex'),
        original: sheet,
        exactFrames,
        coordinates: sheetCoordinates
      },
      outcomes,
      oracleWork,
      productWork: evaluator.work
    }
    if (process.env.CAPTURE_SHEET_WITNESS === '1')
      writeFileSync(
        new URL(
          '../../../.artifacts/first-blocked-sheet-witness.json',
          import.meta.url
        ),
        JSON.stringify(
          artifact,
          (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
          2
        ) + '\n',
        { flag: 'wx' }
      )
    process.stdout.write(
      JSON.stringify({
        sheetWitness: {
          mesh: selected.mesh.id,
          layer: selected.mesh.layer,
          instance: selected.instance,
          triangleOffsets: intersections.map((v) => v.triangleOffset),
          strictInterior: intersections.map((v) => v.strictInterior),
          oracleWork,
          productPredicates: evaluator.work.exactPredicates
        }
      }) + '\n'
    )
    expect(
      Object.values(artifact.identities)
        .filter((v) => typeof v === 'boolean')
        .every(Boolean)
    ).toBe(true)
    expect(outcomes.map((value) => value.triangleOffset)).toEqual([24, 27])
    expect(
      outcomes.every(
        (value) =>
          value.clippedLocus.length > 0 && value.strictInterior === true
      )
    ).toBe(true)
  }, 300000)
})
