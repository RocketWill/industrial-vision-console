import { useCallback, useState } from "react"

type Point = {
  x: number
  y: number
}

type UseImageViewportArgs = {
  minScale?: number
  maxScale?: number
  zoomStep?: number
}

export function useImageViewport(args?: UseImageViewportArgs) {
  const minScale = args?.minScale ?? 0.2
  const maxScale = args?.maxScale ?? 8
  const zoomStep = args?.zoomStep ?? 1.1

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })

  const clampScale = useCallback(
    (next: number) => Math.max(minScale, Math.min(maxScale, next)),
    [minScale, maxScale]
  )

  const zoomAt = useCallback(
    (anchor: Point, deltaY: number) => {
      const factor = deltaY < 0 ? zoomStep : 1 / zoomStep

      setScale((prevScale) => {
        const nextScale = clampScale(prevScale * factor)

        setOffset((prevOffset) => {
          const imageX = (anchor.x - prevOffset.x) / prevScale
          const imageY = (anchor.y - prevOffset.y) / prevScale

          return {
            x: anchor.x - imageX * nextScale,
            y: anchor.y - imageY * nextScale,
          }
        })

        return nextScale
      })
    },
    [clampScale, zoomStep]
  )

  const panBy = useCallback((dx: number, dy: number) => {
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }))
  }, [])

  const reset = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const fitContain = useCallback(
    (
      containerWidth: number,
      containerHeight: number,
      imageWidth: number,
      imageHeight: number
    ) => {
      if (containerWidth <= 0 || containerHeight <= 0) return
      if (imageWidth <= 0 || imageHeight <= 0) return

      const fitScale = Math.min(
        containerWidth / imageWidth,
        containerHeight / imageHeight
      )

      const nextScale = clampScale(fitScale)

      setScale(nextScale)
      setOffset({
        x: (containerWidth - imageWidth * nextScale) / 2,
        y: (containerHeight - imageHeight * nextScale) / 2,
      })
    },
    [clampScale]
  )

  const fit100 = useCallback(
    (
      containerWidth: number,
      containerHeight: number,
      imageWidth: number,
      imageHeight: number
    ) => {
      if (containerWidth <= 0 || containerHeight <= 0) return
      if (imageWidth <= 0 || imageHeight <= 0) return

      const nextScale = clampScale(1)

      setScale(nextScale)
      setOffset({
        x: (containerWidth - imageWidth * nextScale) / 2,
        y: (containerHeight - imageHeight * nextScale) / 2,
      })
    },
    [clampScale]
  )

  return {
    scale,
    offset,
    setOffset,
    zoomAt,
    panBy,
    reset,
    fitContain,
    fit100,
  }
}