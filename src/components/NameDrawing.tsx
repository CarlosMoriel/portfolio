import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const LINES = ['Carlos', 'Moriel']
const FONT_FAMILY = '"Archivo Variable", sans-serif'
const FONT_SIZE = 200
const FONT_WEIGHT = 800
// Distance between baselines, as a multiple of the cap height
const LINE_STEP = 1.42
// Space reserved above the name for the dimension line
const DIMENSION_SPACE = 96
const FONT_TIMEOUT_MS = 3000

interface Metrics {
  cap: number
  xHeight: number
  left: number
  right: number
}

interface Guide {
  y: number
  kind: 'cap' | 'x' | 'base'
  label?: string
}

const GUIDE_LABELS: Record<Guide['kind'], string> = {
  cap: 'cap height',
  x: 'x-height',
  base: 'baseline',
}

function measureMetrics(texts: SVGTextElement[]): Metrics {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) {
    const right = Math.max(...texts.map((t) => t.getComputedTextLength()))
    return { cap: FONT_SIZE * 0.7, xHeight: FONT_SIZE * 0.52, left: 0, right }
  }

  ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`
  const cap = ctx.measureText('H').actualBoundingBoxAscent
  const xHeight = ctx.measureText('x').actualBoundingBoxAscent

  // With fontStretch the canvas measures the actual ink of the expanded width;
  // without it, fall back to the SVG text advance.
  if ('fontStretch' in ctx) {
    ctx.fontStretch = 'expanded'
    const boxes = LINES.map((line) => ctx.measureText(line))
    return {
      cap,
      xHeight,
      left: Math.min(...boxes.map((b) => -b.actualBoundingBoxLeft)),
      right: Math.max(...boxes.map((b) => b.actualBoundingBoxRight)),
    }
  }

  const right = Math.max(...texts.map((t) => t.getComputedTextLength()))
  return { cap, xHeight, left: 0, right }
}

interface NameDrawingProps {
  onReady: () => void
}

export function NameDrawing({ onReady }: NameDrawingProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const textRefs = useRef<SVGTextElement[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    let cancelled = false
    const fontLoaded = document.fonts.load(`${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`)
    const timeout = new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS))

    Promise.race([fontLoaded, timeout])
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setMetrics(measureMetrics(textRefs.current))
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (metrics) onReady()
  }, [metrics, onReady])

  const cap = metrics?.cap ?? FONT_SIZE * 0.7
  const xHeight = metrics?.xHeight ?? FONT_SIZE * 0.52
  const left = metrics?.left ?? 0
  const right = metrics?.right ?? FONT_SIZE * 4.5
  const baselines = LINES.map((_, i) => cap + i * cap * LINE_STEP)

  const viewX = left - 4
  const viewY = -DIMENSION_SPACE
  const viewWidth = right - left + 8
  const viewHeight = DIMENSION_SPACE + baselines[baselines.length - 1] + 20

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg || !metrics) return

    const update = () => setScale(svg.clientWidth / viewWidth || 1)
    const observer = new ResizeObserver(update)
    observer.observe(svg)
    update()

    return () => observer.disconnect()
  }, [metrics, viewWidth])

  // User units equivalent to 1 screen px
  const px = 1 / scale

  const guides: Guide[] = baselines.flatMap((baseline, i) =>
    (['cap', 'x', 'base'] as const).map((kind) => ({
      kind,
      y: kind === 'cap' ? baseline - cap : kind === 'x' ? baseline - xHeight : baseline,
      label: i === 0 ? GUIDE_LABELS[kind] : undefined,
    })),
  )

  const dimensionY = -DIMENSION_SPACE * 0.42
  const tick = 5 * px
  const measuredWidth = Math.round((right - left) / px)

  return (
    <div className="name" style={{ '--ratio': viewWidth / viewHeight } as CSSProperties}>
      {guides.map((guide, i) => (
        <div
          key={i}
          className={`guide guide-${guide.kind}`}
          style={{ top: `${((guide.y - viewY) / viewHeight) * 100}%`, '--i': i } as CSSProperties}
        >
          {guide.label && <span className="guide-label">{guide.label}</span>}
        </div>
      ))}

      <svg
        ref={svgRef}
        className="name-svg"
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="hatch"
            width={7 * px}
            height={7 * px}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={7 * px}
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth={1.2 * px}
            />
          </pattern>
        </defs>

        <g
          style={{
            fontFamily: FONT_FAMILY,
            fontWeight: FONT_WEIGHT,
            fontStretch: '125%',
            fontSize: FONT_SIZE,
          }}
        >
          <g className="name-hatch" fill="url(#hatch)">
            {LINES.map((line, i) => (
              <text key={line} x="0" y={baselines[i]}>
                {line}
              </text>
            ))}
          </g>
          <g className="name-outline" fill="none" stroke="currentColor" strokeWidth={1.4 * px}>
            {LINES.map((line, i) => (
              <text
                key={line}
                ref={(el) => {
                  if (el) textRefs.current[i] = el
                }}
                x="0"
                y={baselines[i]}
              >
                {line}
              </text>
            ))}
          </g>
        </g>

        <g className="dimension" stroke="currentColor" strokeWidth={px}>
          <line x1={left} y1={dimensionY} x2={right} y2={dimensionY} />
          <line x1={left} y1={dimensionY - 8 * px} x2={left} y2={-6 * px} />
          <line x1={right} y1={dimensionY - 8 * px} x2={right} y2={-6 * px} />
          <line x1={left - tick} y1={dimensionY + tick} x2={left + tick} y2={dimensionY - tick} />
          <line x1={right - tick} y1={dimensionY + tick} x2={right + tick} y2={dimensionY - tick} />
          <text
            className="dimension-label"
            x={(left + right) / 2}
            y={dimensionY - 8 * px}
            fontSize={13 * px}
            textAnchor="middle"
            stroke="none"
          >
            {measuredWidth.toLocaleString('en-US')} px
          </text>
        </g>
      </svg>
    </div>
  )
}
