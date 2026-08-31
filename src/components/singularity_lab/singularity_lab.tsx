import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { uniform, vec4 } from 'three/tsl'
import WebGPUScene from '@/components/canvas/webgpu_scene'
import { WebGPUSketch } from '@/components/canvas/webgpu_sketch'
import { singularity } from '@/sketches/singularity-1'
import './singularity_lab.css'

type LabSettings = {
  iterations: number
  distortion: number
  animationSpeed: number
  frequencyCutoff: number
  frequencyDivisor: number
  distanceScale: number
  colorShift: number
  normalization: number
}

type SettingKey = keyof LabSettings

type Lesson = {
  id: string
  title: string
  description: string
  notice: string
  settings: Partial<LabSettings>
}

const DEFAULT_SETTINGS: LabSettings = {
  iterations: 80,
  distortion: 0.02,
  animationSpeed: 2.5,
  frequencyCutoff: 9,
  frequencyDivisor: 0.25,
  distanceScale: 0.05,
  colorShift: 1.2,
  normalization: 2000,
}

const LESSONS: Lesson[] = [
  {
    id: 'raymarching',
    title: '1. Ray marching',
    description: 'A ray takes many small samples through an imaginary 3D space.',
    notice: 'The folds are disabled here. Move “ray samples” and watch low values create visible bands.',
    settings: { iterations: 24, distortion: 0, animationSpeed: 0, distanceScale: 0.08 },
  },
  {
    id: 'gyroid',
    title: '2. Gyroid warping',
    description: 'Three crossed sine and cosine waves bend each sample point.',
    notice: 'Move “warp strength” from zero upward. The flat bands curl into an organic lattice.',
    settings: { iterations: 80, distortion: 0.035, animationSpeed: 0, frequencyCutoff: 30 },
  },
  {
    id: 'octaves',
    title: '3. Detail layers',
    description: 'The same gyroid can be sampled again at a finer scale.',
    notice: 'Change “detail cutoff.” Crossing 14 adds a second gyroid evaluation to every ray sample.',
    settings: { distortion: 0.025, animationSpeed: 0, frequencyCutoff: 30 },
  },
  {
    id: 'motion',
    title: '4. Animation',
    description: 'Time is added to one gyroid axis, so the field flows through itself.',
    notice: 'This is not object rotation. “Animation speed” changes the coordinates before the field is evaluated.',
    settings: { distortion: 0.025, animationSpeed: 2.5, frequencyCutoff: 30 },
  },
  {
    id: 'density',
    title: '5. Density and color',
    description: 'Nearby samples contribute more light; shifted sine waves produce each color channel.',
    notice: 'Try “distance scale” and “color bias.” Geometry, brightness, and palette are coupled in this technique.',
    settings: { iterations: 100, distortion: 0.02, distanceScale: 0.025, colorShift: 0.8 },
  },
]

const CONTROLS: Array<{
  key: SettingKey
  label: string
  min: number
  max: number
  step: number
  help: string
}> = [
  {
    key: 'iterations',
    label: 'Ray samples',
    min: 8,
    max: 120,
    step: 1,
    help: 'More samples look smoother but require more GPU work.',
  },
  {
    key: 'distortion',
    label: 'Warp strength',
    min: 0,
    max: 0.06,
    step: 0.001,
    help: 'How far the gyroid pushes each point away from its original ray.',
  },
  {
    key: 'animationSpeed',
    label: 'Animation speed',
    min: 0,
    max: 5,
    step: 0.1,
    help: 'How quickly time moves through the gyroid coordinate system.',
  },
  {
    key: 'frequencyCutoff',
    label: 'Detail cutoff',
    min: 4,
    max: 60,
    step: 1,
    help: 'Higher thresholds permit more fine-scale gyroid evaluations.',
  },
  {
    key: 'frequencyDivisor',
    label: 'Detail scale',
    min: 0.2,
    max: 0.8,
    step: 0.05,
    help: 'Controls how quickly each gyroid layer becomes finer.',
  },
  {
    key: 'distanceScale',
    label: 'Distance scale',
    min: 0.01,
    max: 0.12,
    step: 0.005,
    help: 'Controls ray step size: smaller steps linger and gather more light.',
  },
  {
    key: 'colorShift',
    label: 'Color bias',
    min: 0,
    max: 2,
    step: 0.05,
    help: 'Offsets all four sine-wave color channels before accumulation.',
  },
  {
    key: 'normalization',
    label: 'Glow compression',
    min: 500,
    max: 5000,
    step: 100,
    help: 'Divides accumulated light before tone mapping; higher values are dimmer.',
  },
]

const SingularityCanvas = memo(({ colorNode, eventSource }: { colorNode: any; eventSource: any }) => (
  <WebGPUScene className='singularity-lab__canvas' eventSource={eventSource} eventPrefix='client'>
    <WebGPUSketch colorNode={colorNode} />
  </WebGPUScene>
))

SingularityCanvas.displayName = 'SingularityCanvas'

const countWarpLayers = (cutoff: number, divisor: number) => {
  let frequency = 3.5
  let layers = 0

  while (frequency < cutoff && layers < 12) {
    layers += 1
    frequency /= divisor
  }

  return layers
}

export function SingularityLab() {
  const eventSource = useRef<HTMLElement>(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [activeLesson, setActiveLesson] = useState(LESSONS[0].id)

  const shader = useMemo(() => {
    const values = {
      iterations: uniform(DEFAULT_SETTINGS.iterations),
      distortion: uniform(DEFAULT_SETTINGS.distortion),
      animationSpeed: uniform(DEFAULT_SETTINGS.animationSpeed),
      frequencyCutoff: uniform(DEFAULT_SETTINGS.frequencyCutoff),
      frequencyDivisor: uniform(DEFAULT_SETTINGS.frequencyDivisor),
      distanceScale: uniform(DEFAULT_SETTINGS.distanceScale),
      colorShift: uniform(DEFAULT_SETTINGS.colorShift),
      normalization: uniform(DEFAULT_SETTINGS.normalization),
    }

    return {
      values,
      colorNode: singularity(
        1.5,
        values.iterations,
        1.0,
        0.0,
        3.5,
        values.frequencyCutoff,
        values.distortion,
        0.25,
        values.animationSpeed,
        values.frequencyDivisor,
        0.01,
        values.distanceScale,
        0.5,
        vec4(4, 2, 1, 3),
        values.colorShift,
        values.normalization,
      ),
    }
  }, [])

  useEffect(() => {
    for (const key of Object.keys(shader.values) as SettingKey[]) {
      shader.values[key].value = settings[key]
    }
  }, [settings, shader])

  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson.id)
    setSettings({ ...DEFAULT_SETTINGS, ...lesson.settings })
  }

  const updateSetting = (key: SettingKey, value: number) => {
    setActiveLesson('custom')
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const currentLesson = LESSONS.find(({ id }) => id === activeLesson)
  const warpLayers = countWarpLayers(settings.frequencyCutoff, settings.frequencyDivisor)

  return (
    <section className='singularity-lab' ref={eventSource}>
      <SingularityCanvas colorNode={shader.colorNode} eventSource={eventSource} />

      <main className='singularity-lab__panel'>
        <p className='singularity-lab__eyebrow'>Interactive shader lab</p>
        <h1>Inside the Singularity</h1>
        <p className='singularity-lab__intro'>
          Pick a lesson, read what to look for, then move its controls. There are no wrong values—breaking the image is
          part of learning how it is built.
        </p>

        <div className='singularity-lab__stats' aria-label='Estimated shader workload'>
          <div className='singularity-lab__stat'>
            <span className='singularity-lab__stat-label'>Gyroid layers</span>
            <strong className='singularity-lab__stat-value'>{warpLayers}</strong>
          </div>
          <div className='singularity-lab__stat'>
            <span className='singularity-lab__stat-label'>Evaluations / pixel</span>
            <strong className='singularity-lab__stat-value'>{settings.iterations * warpLayers}</strong>
          </div>
        </div>

        <div className='singularity-lab__lessons' aria-label='Guided lessons'>
          {LESSONS.map((lesson) => (
            <button
              className={`singularity-lab__lesson ${
                activeLesson === lesson.id ? 'singularity-lab__lesson--active' : ''
              }`}
              key={lesson.id}
              type='button'
              onClick={() => selectLesson(lesson)}
            >
              <strong>{lesson.title}</strong>
              <p>{lesson.description}</p>
            </button>
          ))}
        </div>

        <div className='singularity-lab__notice'>
          <strong>{currentLesson ? 'What to notice' : 'Custom experiment'}</strong>
          <br />
          {currentLesson?.notice ?? 'You changed a lesson setting. Compare your result with a lesson or reset below.'}
          {activeLesson === 'gyroid' ? (
            <code className='singularity-lab__formula'>sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)</code>
          ) : null}
        </div>

        <div className='singularity-lab__controls-heading'>
          <h2>Experiment</h2>
          <button
            className='singularity-lab__reset'
            type='button'
            onClick={() => {
              setActiveLesson('custom')
              setSettings(DEFAULT_SETTINGS)
            }}
          >
            Reset values
          </button>
        </div>

        <div>
          {CONTROLS.map((control) => (
            <label className='singularity-lab__control' key={control.key}>
              <span className='singularity-lab__control-row'>
                <span>{control.label}</span>
                <output>{settings[control.key]}</output>
              </span>
              <input
                type='range'
                min={control.min}
                max={control.max}
                step={control.step}
                value={settings[control.key]}
                onChange={(event) => updateSetting(control.key, Number(event.target.value))}
              />
              <span className='singularity-lab__control-help'>{control.help}</span>
            </label>
          ))}
        </div>

        <footer className='singularity-lab__footer'>
          <a className='singularity-lab__source' href='/sketches/singularity-1'>
            Open clean sketch
          </a>
          <span>Tip: fewer evaluations usually means faster rendering.</span>
        </footer>
      </main>
    </section>
  )
}
