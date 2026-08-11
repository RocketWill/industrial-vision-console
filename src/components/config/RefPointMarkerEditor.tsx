import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RefPoint } from "../../types/forkTemplate"
import { useImageViewport } from "./useImageViewport"
import { Button } from "antd"

type Props = {
    imageUrl?: string
    points: RefPoint[]
    onChange: (points: RefPoint[]) => void
}

type DragMode =
    | { type: "idle" }
    | {
        type: "panning"
        startClientX: number
        startClientY: number
    }

const LABELS: RefPoint["label"][] = ["P1", "P2", "P3", "P4"]
const CROSSHAIR_CURSOR =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='25' height='25' viewBox='0 0 25 25'%3E%3Cline x1='12' y1='0' x2='12' y2='25' stroke='%23ff7a45' stroke-width='1.5'/%3E%3Cline x1='0' y1='12' x2='25' y2='12' stroke='%23ff7a45' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='2' fill='%23ff7a45'/%3E%3C/svg%3E\") 12 12, crosshair"

export function RefPointMarkerEditor({
    imageUrl,
    points,
    onChange,
}: Props) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
    const [dragMode, setDragMode] = useState<DragMode>({ type: "idle" })
    const [hovered, setHovered] = useState(false)

    const { scale, offset, zoomAt, panBy, fitContain, fit100 } = useImageViewport({
        minScale: 0.2,
        maxScale: 10,
        zoomStep: 1.1,
    })

    useEffect(() => {
        if (!imageUrl) return
        setDragMode({ type: "idle" })
    }, [imageUrl])

    useEffect(() => {
        const handleWindowWheel = (e: WheelEvent) => {
            const el = wrapRef.current
            if (!el || !hovered) return

            const rect = el.getBoundingClientRect()
            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom

            if (!inside) return

            e.preventDefault()
            e.stopPropagation()

            zoomAt(
                {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                },
                e.deltaY
            )
        }

        window.addEventListener("wheel", handleWindowWheel, {
            passive: false,
            capture: true,
        })

        return () => {
            window.removeEventListener("wheel", handleWindowWheel, {
                capture: true,
            } as EventListenerOptions)
        }
    }, [hovered, zoomAt])

    const hasImage = !!imageUrl && imageSize.width > 0 && imageSize.height > 0

    const handleFitContain = useCallback(() => {
        const wrap = wrapRef.current
        const img = imgRef.current
        if (!wrap || !img) return

        fitContain(
            wrap.clientWidth,
            wrap.clientHeight,
            img.naturalWidth,
            img.naturalHeight
        )
    }, [fitContain])

    const handleFit100 = useCallback(() => {
        const wrap = wrapRef.current
        const img = imgRef.current
        if (!wrap || !img) return

        fit100(
            wrap.clientWidth,
            wrap.clientHeight,
            img.naturalWidth,
            img.naturalHeight
        )
    }, [fit100])

    const imageStyle = useMemo(
        () => ({
            position: "absolute" as const,
            left: 0,
            top: 0,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "top left",
            userSelect: "none" as const,
            WebkitUserDrag: "none" as const,
            pointerEvents: "none" as const,
        }),
        [offset.x, offset.y, scale]
    )

    if (!imageUrl) return null

    function screenToImage(clientX: number, clientY: number) {
        const rect = wrapRef.current!.getBoundingClientRect()
        const localX = clientX - rect.left
        const localY = clientY - rect.top

        return {
            x: (localX - offset.x) / scale,
            y: (localY - offset.y) / scale,
        }
    }

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        if (!hasImage) return

        if (e.button === 1) {
            e.preventDefault()
            setDragMode({
                type: "panning",
                startClientX: e.clientX,
                startClientY: e.clientY,
            })
        }
    }

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (dragMode.type !== "panning") return

        panBy(e.clientX - dragMode.startClientX, e.clientY - dragMode.startClientY)

        setDragMode({
            type: "panning",
            startClientX: e.clientX,
            startClientY: e.clientY,
        })
    }

    function handleMouseUp() {
        setDragMode({ type: "idle" })
    }

    function handleClick(e: React.MouseEvent<HTMLDivElement>) {
        if (!hasImage) return
        if (dragMode.type !== "idle") return
        if (e.button !== 0) return
        if (points.length >= 4) return

        const p = screenToImage(e.clientX, e.clientY)

        const x = Math.max(0, Math.min(imageSize.width, p.x))
        const y = Math.max(0, Math.min(imageSize.height, p.y))

        const next: RefPoint = {
            x,
            y,
            label: LABELS[points.length],
        }

        onChange([...points, next])
    }

    return (
        <div
            ref={wrapRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                handleMouseUp()
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                position: "relative",
                width: "100%",
                height: 520,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                overflow: "hidden",
                background: "#0b0f14",
                userSelect: "none",
                overscrollBehavior: "contain",
                cursor:
                    dragMode.type === "panning"
                        ? "grabbing"
                        : hasImage
                            ? CROSSHAIR_CURSOR
                            : "default",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    zIndex: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 6,
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.55)",
                    border: "1px solid rgba(255,255,255,0.12)",
                }}
            >
                <Button onClick={handleFitContain}>
                    Fit
                </Button>

                <Button onClick={handleFit100}>
                    100%
                </Button>

                <span
                    style={{
                        minWidth: 48,
                        textAlign: "right",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.88)",
                    }}
                >
                    {Math.round(scale * 100)}%
                </span>
            </div>
            <img
                ref={imgRef}
                src={imageUrl}
                alt="template-marker"
                draggable={false}
                onLoad={(e) => {
                    const img = e.currentTarget

                    setImageSize({
                        width: img.naturalWidth || 0,
                        height: img.naturalHeight || 0,
                    })

                    handleFitContain()
                }}
                style={imageStyle}
            />

            {points.map((p) => {
                const left = offset.x + p.x * scale
                const top = offset.y + p.y * scale
                const markerSize = 10

                return (
                    <div
                        key={p.label}
                        style={{
                            position: "absolute",
                            left: left - markerSize / 2,
                            top: top - markerSize / 2,
                            width: markerSize,
                            height: markerSize,
                            borderRadius: "50%",
                            background: "#ff4d4f",
                            border: "2px solid white",
                            pointerEvents: "none",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 12,
                                top: -4,
                                color: "white",
                                fontSize: 12,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {p.label}
                        </div>
                    </div>
                )
            })}

            <div
                style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    padding: "4px 8px",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.88)",
                    background: "rgba(0,0,0,0.45)",
                    borderRadius: 6,
                    pointerEvents: "none",
                }}
            >
                zoom {Math.round(scale * 100)}%
            </div>
        </div>
    )
}