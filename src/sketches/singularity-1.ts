import {
  abs,
  add,
  cos,
  float,
  Fn,
  Loop,
  mul,
  normalize,
  screenCoordinate,
  screenSize,
  sin,
  time,
  vec3,
  vec4,
} from 'three/tsl'
import { tanh } from '@/tsl/utils/color/tonemapping'

/**
 * Builds the dense, warped volume shared by Singularity-style sketches.
 *
 * The parameters are deliberately exposed so additional sketches can reuse the
 * raymarcher with different geometry, motion, and palette settings.
 */
export const singularity = Fn(
  ([
    _scalar,
    _raymarchIterations,
    _yOffset,
    _xOffset,
    _initialFrequency,
    _maxFrequency,
    _distortionMultiplier,
    _depthMultiplier,
    _timeMultiplier,
    _frequencyDivisor,
    _baseDistance,
    _distanceScale,
    _distanceOffset,
    _colorOffsets,
    _colorShift,
    _normalizationDivisor,
  ]) => {
    const finalColor = vec4(0).toVar()
    const depth = float(0).toVar()
    const distance = float(0).toVar()

    // Project each pixel into an aspect-correct ray. The negative Z component
    // points the ray through the volume while XY span the viewport.
    const rayDirection = normalize(vec3(screenCoordinate.mul(2), 0).sub(screenSize.xyy)).toVar()

    Loop({ start: 0, end: _raymarchIterations, type: 'float' }, ({ i }) => {
      const p = vec3(depth.mul(rayDirection)).toVar()
      p.y.subAssign(_yOffset)
      p.x.subAssign(_xOffset)

      // Repeatedly sample a gyroid at increasing frequencies and feed it back
      // into the point. This is domain warping rather than a conventional
      // signed-distance field, which gives the volume its folded appearance.
      distance.assign(_initialFrequency)
      Loop(distance.lessThan(_maxFrequency), () => {
        const scaled = p.mul(distance).add(vec3(depth.mul(_depthMultiplier), time.mul(_timeMultiplier), 0))
        const gyroid = sin(scaled.x)
          .mul(cos(scaled.y))
          .add(sin(scaled.y).mul(cos(scaled.z)))
          .add(sin(scaled.z).mul(cos(scaled.x)))

        p.addAssign(vec3(gyroid).mul(i.mul(_distortionMultiplier)).div(distance))
        distance.divAssign(_frequencyDivisor)
      })

      // This L1 distance estimate controls the next step. Small values linger
      // around the folded axes; large values skip quickly through empty space.
      distance.assign(
        add(_baseDistance, mul(_distanceScale, abs(p.x.add(_distanceOffset)).add(abs(p.y.add(_distanceOffset))))),
      )
      depth.addAssign(distance)

      // Every step contributes a phase-shifted RGBA wave. Dividing by distance
      // makes samples near the volume brighter and creates the glowing density.
      const phase = _scalar.add(sin(time.mul(0.5)))
      finalColor.addAssign(sin(depth.add(phase).add(_colorOffsets)).add(_colorShift).div(distance))
    })

    return tanh(finalColor.div(_normalizationDivisor))
  },
)

/**
 * The first Singularity variant. Keep this wrapper parameter-free so the
 * sketches route can instantiate it like every other sketch in the project.
 */
const singularity1 = Fn(() =>
  singularity(1.5, 80, 1.0, 0.0, 3.5, 9.0, 0.02, 0.25, 2.5, 0.25, 0.01, 0.05, 0.5, vec4(4, 2, 1, 3), 1.2, 2000),
)

export default singularity1
