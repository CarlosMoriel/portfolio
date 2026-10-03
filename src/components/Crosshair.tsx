import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface CrosshairProps {
  containerRef: RefObject<HTMLElement | null>
}

// CAD-style cursor: lines across the plan and coordinates from the bottom-left corner
export function Crosshair({ containerRef }: CrosshairProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const coordsRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const root = rootRef.current
    const coords = coordsRef.current
    if (!container || !root || !coords) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let frame = 0

    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        root.style.setProperty('--x', `${x}px`)
        root.style.setProperty('--y', `${y}px`)
        coords.textContent = `${Math.round(x)}, ${Math.round(rect.height - y)}`
        root.classList.add('is-active')
      })
    }

    const onLeave = () => {
      cancelAnimationFrame(frame)
      root.classList.remove('is-active')
    }

    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
    }
  }, [containerRef])

  return (
    <div ref={rootRef} className="crosshair" aria-hidden="true">
      <div className="crosshair-line crosshair-h" />
      <div className="crosshair-line crosshair-v" />
      <div className="crosshair-pick" />
      <span ref={coordsRef} className="crosshair-coords" />
    </div>
  )
}
