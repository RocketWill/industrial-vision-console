import { useMemo, useRef } from "react"
import type {
    CSSProperties,
    WheelEvent as ReactWheelEvent,
    MouseEvent as ReactMouseEvent,
} from "react"

type RoiOverlayProps = {
    imageWidth: number
    imageHeight: number

    roiImageWidth?: number | null
    roiImageHeight?: number | null

    cx: number
    cy: number
    r: number

    editable?: boolean
    onChange: (next: { cx: number; cy: number; r: number }) => void
}

const layerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
}

const scaleHintStyle: CSSProperties = {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 14,
    color: "#faad14",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(250,173,20,0.45)",
    pointerEvents: "none",
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

export function RoiOverlay({
    imageWidth,
    imageHeight,
    roiImageWidth,
    roiImageHeight,
    cx,
    cy,
    r,
    editable = false,
    onChange,
}: RoiOverlayProps) {
    const draggingRef = useRef(false)

    const baseWidth = roiImageWidth && roiImageWidth > 0 ? roiImageWidth : imageWidth
    const baseHeight = roiImageHeight && roiImageHeight > 0 ? roiImageHeight : imageHeight

    const sx = imageWidth / baseWidth
    const sy = imageHeight / baseHeight

    const radiusScale = Math.min(sx, sy)

    const scaledRoi = useMemo(() => {
        return {
            cx: cx * sx,
            cy: cy * sy,
            r: r * radiusScale,
        }
    }, [cx, cy, r, sx, sy, radiusScale])

    const isScaled =
        Math.abs(sx - 1) > 0.001 ||
        Math.abs(sy - 1) > 0.001

    function getCurrentImagePoint(e: ReactMouseEvent<SVGSVGElement>) {
        const rect = e.currentTarget.getBoundingClientRect()

        const x = ((e.clientX - rect.left) / rect.width) * imageWidth
        const y = ((e.clientY - rect.top) / rect.height) * imageHeight

        return { x, y }
    }

    function currentToBasePoint(point: { x: number; y: number }) {
        return {
            x: point.x / sx,
            y: point.y / sy,
        }
    }

    function handleWheel(e: ReactWheelEvent<SVGSVGElement>) {
        if (!editable) return

        e.preventDefault()
        e.stopPropagation()

        const nativeEvent = e.nativeEvent
        if ("stopImmediatePropagation" in nativeEvent) {
            nativeEvent.stopImmediatePropagation()
        }

        const deltaInCurrentImage = e.deltaY > 0 ? -5 : 5
        const nextCurrentR = scaledRoi.r + deltaInCurrentImage

        const maxBaseRadius = Math.min(baseWidth, baseHeight) / 2
        const nextBaseR = clamp(
            nextCurrentR / radiusScale,
            5,
            maxBaseRadius,
        )

        onChange({
            cx,
            cy,
            r: nextBaseR,
        })
    }

    return (
        <div style={layerStyle}>
            {isScaled && (
                <div style={scaleHintStyle}>
                    ROI scaled {sx.toFixed(3)}× / {sy.toFixed(3)}×
                </div>
            )}

            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                    cursor: editable ? "move" : "default",
                    pointerEvents: editable ? "auto" : "none",
                }}
                onMouseDown={(e) => {
                    if (!editable) return
                    e.preventDefault()
                    e.stopPropagation()
                    draggingRef.current = true
                }}
                onMouseMove={(e) => {
                    if (!editable || !draggingRef.current) return

                    e.preventDefault()
                    e.stopPropagation()

                    const currentPoint = getCurrentImagePoint(e)
                    const basePoint = currentToBasePoint(currentPoint)

                    onChange({
                        cx: clamp(basePoint.x, 0, baseWidth),
                        cy: clamp(basePoint.y, 0, baseHeight),
                        r,
                    })
                }}
                onMouseUp={(e) => {
                    if (!editable) return

                    e.preventDefault()
                    e.stopPropagation()
                    draggingRef.current = false
                }}
                onMouseLeave={() => {
                    draggingRef.current = false
                }}
                onWheel={handleWheel}
            >
                <circle
                    cx={scaledRoi.cx}
                    cy={scaledRoi.cy}
                    r={scaledRoi.r}
                    fill={editable ? "rgba(250,173,20,0.10)" : "transparent"}
                    stroke="#fcab0b"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                />

                <circle
                    cx={scaledRoi.cx}
                    cy={scaledRoi.cy}
                    r={4}
                    fill="#faad14"
                />
            </svg>
        </div>
    )
}