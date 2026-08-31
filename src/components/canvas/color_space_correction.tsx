import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { LinearSRGBColorSpace, NoToneMapping } from 'three/webgpu'

/**
 * ColorSpaceCorrection
 *
 * Sets the renderer's outputColorSpace to LinearSRGBColorSpace and disables tone mapping.
 * Ensures correct color output for WebGPU rendering.
 *
 * @returns {null}
 */
export const ColorSpaceCorrection = () => {
  const { set } = useThree((state) => state)

  useEffect(() => {
    set((state) => {
      const _state = { ...state }
      _state.gl.outputColorSpace = LinearSRGBColorSpace
      _state.gl.toneMapping = NoToneMapping
      return _state
    })
  }, [])

  return null
}
