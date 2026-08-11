import { useCallback, useMemo, useRef } from "react"

export type ViewTransformState = {
  scale: number
  tx: number
  ty: number
}

export type UseViewTransformOptions = {
  minScale?: number
  maxScale?: number
  zoomSpeed?: number
  rightClickDblMs?: number
  onChange?: (state: ViewTransformState) => void
}

export type ViewTransformBindings = {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function useViewTransform(options: UseViewTransformOptions = {}) {
  const {
    minScale = 0.2,
    maxScale = 10,
    zoomSpeed = 0.0015,
    rightClickDblMs = 280,
    onChange,
  } = options

  const stateRef = useRef<ViewTransformState>({ scale: 1, tx: 0, ty: 0 })
  const targetsRef = useRef<HTMLElement[]>([])

  const draggingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const rafRef = useRef<number | null>(null)
  const lastRightClickAtRef = useRef<number>(0)

  const applyNow = useCallback(() => {
    const s = stateRef.current
    const t = `translate(${s.tx}px, ${s.ty}px) scale(${s.scale})`
    onChange?.(s)

    for (const el of targetsRef.current) {
      el.style.transform = t
      el.style.transformOrigin = "0 0"
      el.style.willChange = "transform"
      el.style.cursor = draggingRef.current ? "grabbing" : "default"
    }
  }, [onChange])

  const scheduleApply = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      applyNow()
    })
  }, [applyNow])

  const attachMany = useCallback(
    (els: Array<HTMLElement | null>) => {
      targetsRef.current = els.filter(Boolean) as HTMLElement[]
      scheduleApply()
    },
    [scheduleApply]
  )

  const attach = useCallback(
    (el: HTMLElement | null) => {
      attachMany([el])
    },
    [attachMany]
  )

  const getState = useCallback(() => stateRef.current, [])

  const setView = useCallback(
    (next: ViewTransformState) => {
      stateRef.current = next
      scheduleApply()
    },
    [scheduleApply]
  )

  const zoomAt = useCallback(
    (cursorX: number, cursorY: number, nextScale: number) => {
      const prev = stateRef.current
      const oldScale = prev.scale
      const clamped = clamp(nextScale, minScale, maxScale)
      if (clamped === oldScale) return

      const k = clamped / oldScale
      const tx = cursorX - (cursorX - prev.tx) * k
      const ty = cursorY - (cursorY - prev.ty) * k

      stateRef.current = { scale: clamped, tx, ty }
      scheduleApply()
    },
    [maxScale, minScale, scheduleApply]
  )

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const s = stateRef.current
      stateRef.current = { ...s, tx: s.tx + dx, ty: s.ty + dy }
      scheduleApply()
    },
    [scheduleApply]
  )

  const fitContain = useCallback(
    (containerW: number, containerH: number, imageW: number, imageH: number) => {
      if (containerW <= 0 || containerH <= 0) return
      if (imageW <= 0 || imageH <= 0) return

      const scale = clamp(
        Math.min(containerW / imageW, containerH / imageH),
        minScale,
        maxScale
      )

      const tx = (containerW - imageW * scale) / 2
      const ty = (containerH - imageH * scale) / 2

      stateRef.current = { scale, tx, ty }
      scheduleApply()
    },
    [maxScale, minScale, scheduleApply]
  )

  const fit100 = useCallback(
    (containerW: number, containerH: number, imageW: number, imageH: number) => {
      if (containerW <= 0 || containerH <= 0) return
      if (imageW <= 0 || imageH <= 0) return

      const scale = clamp(1, minScale, maxScale)
      const tx = (containerW - imageW * scale) / 2
      const ty = (containerH - imageH * scale) / 2

      stateRef.current = { scale, tx, ty }
      scheduleApply()
    },
    [maxScale, minScale, scheduleApply]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 1) return
      e.preventDefault()
      draggingRef.current = true
      lastPosRef.current = { x: e.clientX, y: e.clientY }
      scheduleApply()
    },
    [scheduleApply]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current) return
      e.preventDefault()

      const last = lastPosRef.current
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y

      lastPosRef.current = { x: e.clientX, y: e.clientY }
      panBy(dx, dy)
    },
    [panBy]
  )

  const endDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current) return
      e.preventDefault()
      draggingRef.current = false
      scheduleApply()
    },
    [scheduleApply]
  )

  const onContextMenuInternal = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const now = performance.now()
      const last = lastRightClickAtRef.current
      lastRightClickAtRef.current = now
      return now - last <= rightClickDblMs
    },
    [rightClickDblMs]
  )

  return {
    attach,
    attachMany,
    getState,
    zoomAt,
    setView,
    panBy,
    fitContain,
    fit100,
    onContextMenuInternal,
    zoomSpeed,
    bindings: useMemo(
      () => ({
        onMouseDown,
        onMouseMove,
        onMouseUp: endDrag,
        onMouseLeave: endDrag,
      }),
      [endDrag, onMouseDown, onMouseMove]
    ),
  }
}
