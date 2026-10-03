import { useLayoutEffect, useRef, useState } from 'react'

// Nube de revisión: arcos hacia afuera recorriendo el rectángulo en sentido horario
function cloudPath(width: number, height: number, bump = 8) {
  const points: [number, number][] = []
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / (bump * 2)))
    for (let i = 0; i < steps; i++) {
      points.push([x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps])
    }
  }

  edge(0, 0, width, 0)
  edge(width, 0, width, height)
  edge(width, height, 0, height)
  edge(0, height, 0, 0)
  points.push(points[0])

  const radius = bump * 1.15
  const arcs = points
    .slice(1)
    .map(([x, y]) => `A${radius} ${radius} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join('')

  return `M${points[0][0]} ${points[0][1]}${arcs}Z`
}

function RevisionCloud() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(svg)

    return () => observer.disconnect()
  }, [])

  const margin = 6

  return (
    <svg ref={svgRef} className="revision-cloud" aria-hidden="true">
      {size.width > 0 && (
        <path
          className="revision-cloud-path"
          d={cloudPath(size.width - margin * 2, size.height - margin * 2)}
          transform={`translate(${margin} ${margin})`}
          pathLength={1}
        />
      )}
    </svg>
  )
}

export function TitleBlock() {
  return (
    <dl className="title-block" aria-label="Datos del proyecto">
      <dt>Proyecto</dt>
      <dd>carlosmoriel.com</dd>

      <dt>Autor</dt>
      <dd>Carlos Moriel</dd>

      <dt>Estado</dt>
      <dd className="title-block-status">
        <span className="clouded">
          En construcción
          <RevisionCloud />
        </span>
      </dd>

      <dt>Revisión</dt>
      <dd>0.1</dd>

      <dt>Fecha</dt>
      <dd>Octubre 2026</dd>
    </dl>
  )
}
