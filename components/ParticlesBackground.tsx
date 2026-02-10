'use client'

import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

export function ParticlesBackground() {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setInit(true))
  }, [])

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: {
        value: 60,
        density: {
          enable: true,
        },
      },
      color: {
        value: ['#f97316', '#fb923c', '#fdba74', '#fbbf24'],
      },
      opacity: {
        value: { min: 0.3, max: 0.7 },
        animation: {
          enable: true,
          speed: 0.5,
          sync: false,
        },
      },
      size: {
        value: { min: 1, max: 4 },
        animation: {
          enable: true,
          speed: 1,
          sync: false,
        },
      },
      links: {
        enable: true,
        color: '#fdba74',
        opacity: 0.2,
        distance: 150,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: 'none' as const,
        outModes: {
          default: 'bounce' as const,
        },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'grab',
        },
      },
      modes: {
        grab: {
          distance: 200,
          links: {
            opacity: 0.4,
          },
        },
      },
    },
    detectRetina: true,
  }), [])

  if (!init) return null

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="absolute inset-0"
    />
  )
}
