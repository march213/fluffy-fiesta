import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

interface SketchInfo {
  name: string
  path: string
  url: string
  description?: string
}

export function SketchesList() {
  const [sketches, setSketches] = useState<SketchInfo[]>([])

  useEffect(() => {
    // Use the same glob pattern as the sketches route
    const sketchesGlob: Record<string, { default: () => any }> = import.meta.glob('../../sketches/**/*.ts', {
      eager: true,
    })

    const sketchesList: SketchInfo[] = Object.keys(sketchesGlob).map((filePath) => {
      // Convert file path to URL path
      // ../../sketches/flare-1.ts -> flare-1
      // ../../sketches/nested/dawn-1.ts -> nested/dawn-1
      const relativePath = filePath.replace('../../sketches/', '').replace('.ts', '')
      const url = `/sketches/${relativePath}`

      // Extract name from path (last part before extension)
      const name = relativePath.split('/').pop() || relativePath

      return {
        name,
        path: relativePath,
        url,
        description: getSketchDescription(name),
      }
    })

    setSketches(sketchesList)
  }, [])

  return (
    <div className='sketches-list'>
      <div className='sketches-list__grid'>
        {sketches.map((sketch) => (
          <Link key={sketch.path} to={sketch.url} className='sketch-card'>
            <h3 className='sketch-card__title'>{sketch.name}</h3>
            <p className='sketch-card__description'>{sketch.description}</p>
            <div className='sketch-card__path'>{sketch.path}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function getSketchDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'flare-1': 'A gradient sketch with fractionated coordinates and vertical banding',
    'dawn-1': 'A gradient sketch tribute to Rik Oostenbroek with animated patterns',
  }

  return descriptions[name] || 'A creative WebGPU sketch'
}
