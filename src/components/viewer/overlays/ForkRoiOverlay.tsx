import { useMemo, useRef } from "react"
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
} from "react"

type ForkRoiOverlayProps = {
  imageWidth: number
  imageHeight: number

  forkRoiImageWidth?: number | null
  forkRoiImageHeight?: number | null

  x: number
  y: number
  width: number
  height: number

  editable?: boolean
  onChange: (next: {
    x: number
    y: number
    width: number
    height: number
  }) => void
}

type DragMode = "move" | "resize" | null

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
}

const scaleHintStyle: CSSProperties = {
  position: "absolute",
  top: 45,
  right: 8,
  zIndex: 2,
  padding: "3px 8px",
  borderRadius: 6,
  fontSize: 14,
  color: "#90c8fc",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(89,100,255,0.45)",
  pointerEvents: "none",
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function ForkRoiOverlay({
  imageWidth,
  imageHeight,
  forkRoiImageWidth,
  forkRoiImageHeight,
  x,
  y,
  width,
  height,
  editable = false,
  onChange,
}: ForkRoiOverlayProps) {
  const dragModeRef = useRef<DragMode>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const baseWidth =
    forkRoiImageWidth && forkRoiImageWidth > 0
      ? forkRoiImageWidth
      : imageWidth

  const baseHeight =
    forkRoiImageHeight && forkRoiImageHeight > 0
      ? forkRoiImageHeight
      : imageHeight

  const sx = imageWidth / baseWidth
  const sy = imageHeight / baseHeight

  const scaledRoi = useMemo(() => {
    return {
      x: x * sx,
      y: y * sy,
      width: width * sx,
      height: height * sy,
    }
  }, [x, y, width, height, sx, sy])

  const isScaled =
    Math.abs(sx - 1) > 0.001 ||
    Math.abs(sy - 1) > 0.001

  function getCurrentImagePoint(clientX: number, clientY: number) {
    if (!svgRef.current) {
      return { x: 0, y: 0 }
    }

    const rect = svgRef.current.getBoundingClientRect()

    const px = ((clientX - rect.left) / rect.width) * imageWidth
    const py = ((clientY - rect.top) / rect.height) * imageHeight

    return { x: px, y: py }
  }

  function currentToBasePoint(point: { x: number; y: number }) {
    return {
      x: point.x / sx,
      y: point.y / sy,
    }
  }

  function handleMouseMove(e: ReactMouseEvent<SVGSVGElement>) {
    if (!editable || !dragModeRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const currentPoint = getCurrentImagePoint(e.clientX, e.clientY)
    const basePoint = currentToBasePoint(currentPoint)

    if (dragModeRef.current === "move") {
      const nextX = clamp(
        basePoint.x - dragOffsetRef.current.x,
        0,
        baseWidth - width,
      )

      const nextY = clamp(
        basePoint.y - dragOffsetRef.current.y,
        0,
        baseHeight - height,
      )

      onChange({
        x: Math.round(nextX),
        y: Math.round(nextY),
        width,
        height,
      })
    }

    if (dragModeRef.current === "resize") {
      const nextWidth = clamp(basePoint.x - x, 1, baseWidth - x)
      const nextHeight = clamp(basePoint.y - y, 1, baseHeight - y)

      onChange({
        x,
        y,
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      })
    }
  }

  function stopDrag() {
    dragModeRef.current = null
  }

  return (
    <div style={layerStyle}>
      {isScaled && (
        <div style={scaleHintStyle}>
          Fork ROI scaled {sx.toFixed(3)}× / {sy.toFixed(3)}×
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          cursor: editable ? "default" : "default",
          pointerEvents: editable ? "auto" : "none",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <rect
          x={scaledRoi.x}
          y={scaledRoi.y}
          width={scaledRoi.width}
          height={scaledRoi.height}
          fill={editable ? "rgba(89, 100, 255, 0.10)" : "transparent"}
          stroke="#5964ff"
          strokeWidth={3}
          strokeDasharray="6 4"
          style={{
            cursor: editable ? "move" : "default",
          }}
          onMouseDown={(e) => {
            if (!editable) return

            e.preventDefault()
            e.stopPropagation()

            const currentPoint = getCurrentImagePoint(e.clientX, e.clientY)
            const basePoint = currentToBasePoint(currentPoint)

            dragOffsetRef.current = {
              x: basePoint.x - x,
              y: basePoint.y - y,
            }

            dragModeRef.current = "move"
          }}
        />

        <rect
          x={scaledRoi.x + scaledRoi.width - 8}
          y={scaledRoi.y + scaledRoi.height - 8}
          width={16}
          height={16}
          fill="#5964ff"
          stroke="#fff"
          strokeWidth={2}
          rx={2}
          style={{
            cursor: editable ? "nwse-resize" : "default",
            pointerEvents: editable ? "auto" : "none",
          }}
          onMouseDown={(e) => {
            if (!editable) return

            e.preventDefault()
            e.stopPropagation()

            dragModeRef.current = "resize"
          }}
        />
      </svg>
    </div>
  )
}