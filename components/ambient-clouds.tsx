"use client"

import { useEffect, useState, type CSSProperties } from "react"

interface Cloud {
  id: number
  style: CSSProperties
}

const randomBetween = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min))

function createCloud(id: number): Cloud {
  const duration = randomBetween(85000, 145000)

  return {
    id,
    style: {
      "--cloud-y": `${randomBetween(-8, 92)}vh`,
      "--cloud-width": `${randomBetween(260, 620)}px`,
      "--cloud-height": `${randomBetween(120, 250)}px`,
      "--cloud-duration": `${duration}ms`,
      "--cloud-delay": `${-randomBetween(0, duration)}ms`,
      "--cloud-opacity": (randomBetween(80, 100) / 100).toFixed(2),
      "--cloud-shape": `${randomBetween(35, 65)}% ${randomBetween(35, 65)}% ${randomBetween(35, 65)}% ${randomBetween(35, 65)}% / ${randomBetween(35, 65)}% ${randomBetween(35, 65)}% ${randomBetween(35, 65)}% ${randomBetween(35, 65)}%`,
      "--puff-one-x": `${randomBetween(5, 25)}%`,
      "--puff-one-y": `${randomBetween(-30, 0)}%`,
      "--puff-one-width": `${randomBetween(42, 68)}%`,
      "--puff-one-height": `${randomBetween(70, 115)}%`,
      "--puff-two-x": `${randomBetween(48, 68)}%`,
      "--puff-two-y": `${randomBetween(-24, 8)}%`,
      "--puff-two-width": `${randomBetween(34, 58)}%`,
      "--puff-two-height": `${randomBetween(62, 100)}%`,
    } as CSSProperties,
  }
}

export function AmbientClouds() {
  const [clouds, setClouds] = useState<Cloud[]>([])

  useEffect(() => {
    setClouds(Array.from({ length: 16 }, (_, index) => createCloud(index)))
  }, [])

  return (
    <div className="ambient-clouds" aria-hidden="true">
      {clouds.map((cloud) => (
        <div key={cloud.id} className="ambient-cloud" style={cloud.style}>
          <span className="ambient-cloud__body" />
          <span className="ambient-cloud__puff ambient-cloud__puff--one" />
          <span className="ambient-cloud__puff ambient-cloud__puff--two" />
        </div>
      ))}
    </div>
  )
}