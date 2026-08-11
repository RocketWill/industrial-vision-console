import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useImageViewport } from "./useImageViewport"
import { Button } from "antd"

type Crop = {
    x: number
    y: number
    width: number
    height: number
}

type ResizeHandle =
    | "n"
    | "s"
    | "e"
    | "w"
    | "nw"
    | "ne"
    | "sw"
    | "se"

type DragMode =
    | { type: "idle" }
    | { type: "panning"; lastClientX: number; lastClientY: number }
    | {
        type: "drawing"
        startImageX: number
        startImageY: number
    }
    | {
        type: "moving"
        startClientX: number
        startClientY: number
        startCrop: Crop
    }
    | {
        type: "resizing"
        handle: ResizeHandle
        startClientX: number
        startClientY: number
        startCrop: Crop
    }

type Props = {
    imageUrl?: string
    crop?: Crop
    onChange: (crop: Crop) => void
    minCropSize?: number
}

const HANDLE_SIZE = 10
const CROSSHAIR_CURSOR =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='25' height='25' viewBox='0 0 25 25'%3E%3Cline x1='12' y1='0' x2='12' y2='25' stroke='%23ff7a45' stroke-width='1.5'/%3E%3Cline x1='0' y1='12' x2='25' y2='12' stroke='%23ff7a45' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='2' fill='%23ff7a45'/%3E%3C/svg%3E\") 12 12, crosshair"

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function normalizeCrop(crop: Crop): Crop {
    const x = crop.width >= 0 ? crop.x : crop.x + crop.width
    const y = crop.height >= 0 ? crop.y : crop.y + crop.height
    const width = Math.abs(crop.width)
    const height = Math.abs(crop.height)
    return { x, y, width, height }
}

function applyResize(
    crop: Crop,
    handle: ResizeHandle,
    dx: number,
    dy: number,
    minSize: number
): Crop {
    let { x, y, width, height } = crop

    if (handle.includes("w")) {
        x += dx
        width -= dx
    }
    if (handle.includes("e")) {
        width += dx
    }
    if (handle.includes("n")) {
        y += dy
        height -= dy
    }
    if (handle.includes("s")) {
        height += dy
    }

    const next = normalizeCrop({ x, y, width, height })

    return {
        x: next.x,
        y: next.y,
        width: Math.max(minSize, next.width),
        height: Math.max(minSize, next.height),
    }
}

function getCursorByHandle(handle: ResizeHandle) {
    switch (handle) {
        case "n":
        case "s":
            return "ns-resize"
        case "e":
        case "w":
            return "ew-resize"
        case "nw":
        case "se":
            return "nwse-resize"
        case "ne":
        case "sw":
            return "nesw-resize"
    }
}

export function TemplateCropEditor({
    imageUrl,
    crop,
    onChange,
    minCropSize = 8,
}: Props) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)

    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
    const [dragMode, setDragMode] = useState<DragMode>({ type: "idle" })
    const [hovered, setHovered] = useState(false)
    const dragModeRef = useRef<DragMode>({ type: "idle" })

    const setActiveDragMode = useCallback((next: DragMode) => {
        dragModeRef.current = next
        setDragMode(next)
    }, [])

    const { scale, offset, zoomAt, panBy, fitContain, fit100 } = useImageViewport({
        minScale: 0.2,
        maxScale: 10,
        zoomStep: 1.1,
    })
    useEffect(() => {
        if (!imageUrl) return
        setActiveDragMode({ type: "idle" })
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

    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (dragModeRef.current.type === "idle") return
            handlePointerMove(e.clientX, e.clientY)
        }

        const handleWindowMouseUp = () => {
            if (dragModeRef.current.type === "idle") return
            setActiveDragMode({ type: "idle" })
        }

        window.addEventListener("mousemove", handleWindowMouseMove)
        window.addEventListener("mouseup", handleWindowMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove)
            window.removeEventListener("mouseup", handleWindowMouseUp)
        }
    }, [setActiveDragMode])

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

    function screenToImage(clientX: number, clientY: number) {
        const rect = wrapRef.current!.getBoundingClientRect()
        const localX = clientX - rect.left
        const localY = clientY - rect.top

        return {
            x: (localX - offset.x) / scale,
            y: (localY - offset.y) / scale,
        }
    }

    function isPointInCrop(imageX: number, imageY: number, box?: Crop) {
        if (!box) return false
        return (
            imageX >= box.x &&
            imageX <= box.x + box.width &&
            imageY >= box.y &&
            imageY <= box.y + box.height
        )
    }

    function clampCropToImage(next: Crop): Crop {
        const normalized = normalizeCrop(next)

        const x = clamp(normalized.x, 0, imageSize.width)
        const y = clamp(normalized.y, 0, imageSize.height)

        const maxWidth = Math.max(0, imageSize.width - x)
        const maxHeight = Math.max(0, imageSize.height - y)

        return {
            x,
            y,
            width: clamp(normalized.width, minCropSize, maxWidth),
            height: clamp(normalized.height, minCropSize, maxHeight),
        }
    }

    function handleMouseDownOnStage(e: React.MouseEvent<HTMLDivElement>) {
        if (!hasImage) return

        if (e.button === 1) {
            e.preventDefault()
            setActiveDragMode({
                type: "panning",
                lastClientX: e.clientX,
                lastClientY: e.clientY,
            })
            return
        }

        if (e.button !== 0) return

        const p = screenToImage(e.clientX, e.clientY)

        if (crop && isPointInCrop(p.x, p.y, crop)) {
            setActiveDragMode({
                type: "moving",
                startClientX: e.clientX,
                startClientY: e.clientY,
                startCrop: crop,
            })
            return
        }

        const startX = clamp(p.x, 0, imageSize.width)
        const startY = clamp(p.y, 0, imageSize.height)

        onChange({
            x: startX,
            y: startY,
            width: minCropSize,
            height: minCropSize,
        })

        setActiveDragMode({
            type: "drawing",
            startImageX: startX,
            startImageY: startY,
        })
    }

    const handlePointerMove = useCallback((clientX: number, clientY: number) => {
        if (!hasImage) return

        if (dragMode.type === "idle") return

        if (dragMode.type === "panning") {
            panBy(clientX - dragMode.lastClientX, clientY - dragMode.lastClientY)
            setActiveDragMode({
                type: "panning",
                lastClientX: clientX,
                lastClientY: clientY,
            })
            return
        }

        if (dragMode.type === "drawing") {
            const p = screenToImage(clientX, clientY)
            const next = clampCropToImage({
                x: dragMode.startImageX,
                y: dragMode.startImageY,
                width: p.x - dragMode.startImageX,
                height: p.y - dragMode.startImageY,
            })
            onChange(next)
            return
        }

        if (dragMode.type === "moving") {
            const dx = (clientX - dragMode.startClientX) / scale
            const dy = (clientY - dragMode.startClientY) / scale

            const next = clampCropToImage({
                ...dragMode.startCrop,
                x: dragMode.startCrop.x + dx,
                y: dragMode.startCrop.y + dy,
            })
            onChange(next)
            return
        }

        if (dragMode.type === "resizing") {
            const dx = (clientX - dragMode.startClientX) / scale
            const dy = (clientY - dragMode.startClientY) / scale

            const next = clampCropToImage(
                applyResize(dragMode.startCrop, dragMode.handle, dx, dy, minCropSize)
            )
            onChange(next)
        }
    }, [
        hasImage,
        dragMode,
        panBy,
        scale,
        minCropSize,
        screenToImage,
        clampCropToImage,
        onChange,
        setActiveDragMode,
    ])

    function handleMouseUp() {
        setActiveDragMode({ type: "idle" })
    }

    function renderHandle(handle: ResizeHandle, left: number, top: number) {
        if (!crop) return null

        return (
            <div
                key={handle}
                onMouseDown={(e) => {
                    e.stopPropagation()
                    if (e.button !== 0) return
                    setActiveDragMode({
                        type: "resizing",
                        handle,
                        startClientX: e.clientX,
                        startClientY: e.clientY,
                        startCrop: crop,
                    })
                }}
                style={{
                    position: "absolute",
                    left,
                    top,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    marginLeft: -HANDLE_SIZE / 2,
                    marginTop: -HANDLE_SIZE / 2,
                    borderRadius: 999,
                    border: "2px solid #52c41a",
                    background: "#0b0f14",
                    boxSizing: "border-box",
                    cursor: getCursorByHandle(handle),
                    pointerEvents: "auto",
                }}
            />
        )
    }

    if (!imageUrl) return null

    const screenCrop =
        crop && hasImage
            ? {
                left: offset.x + crop.x * scale,
                top: offset.y + crop.y * scale,
                width: crop.width * scale,
                height: crop.height * scale,
            }
            : null

    return (
        <div
            ref={wrapRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
            }}
            onMouseDown={handleMouseDownOnStage}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                position: "relative",
                width: "100%",
                height: 520,
                overflow: "hidden",
                userSelect: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                background: "#0b0f14",
                overscrollBehavior: "contain",
                cursor:
                    dragMode.type === "panning"
                        ? "grabbing"
                        : dragMode.type === "moving"
                            ? "move"
                            : dragMode.type === "resizing"
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
                alt="template-source"
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

            {screenCrop && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            left: screenCrop.left,
                            top: screenCrop.top,
                            width: screenCrop.width,
                            height: screenCrop.height,
                            border: "2px solid #52c41a",
                            background: "rgba(82,196,26,0.08)",
                            boxSizing: "border-box",
                            pointerEvents: "none",
                        }}
                    />

                    {renderHandle("nw", screenCrop.left, screenCrop.top)}
                    {renderHandle("n", screenCrop.left + screenCrop.width / 2, screenCrop.top)}
                    {renderHandle("ne", screenCrop.left + screenCrop.width, screenCrop.top)}
                    {renderHandle("w", screenCrop.left, screenCrop.top + screenCrop.height / 2)}
                    {renderHandle(
                        "e",
                        screenCrop.left + screenCrop.width,
                        screenCrop.top + screenCrop.height / 2
                    )}
                    {renderHandle("sw", screenCrop.left, screenCrop.top + screenCrop.height)}
                    {renderHandle(
                        "s",
                        screenCrop.left + screenCrop.width / 2,
                        screenCrop.top + screenCrop.height
                    )}
                    {renderHandle(
                        "se",
                        screenCrop.left + screenCrop.width,
                        screenCrop.top + screenCrop.height
                    )}
                </>
            )}

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