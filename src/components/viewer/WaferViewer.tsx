import { Button, Card, Flex, message, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { RoiOverlay } from "./overlays/RoiOverlay";
import { ForkRoiOverlay } from "./overlays/ForkRoiOverlay"
import { defaultViewerState, useViewerStore } from "../../store/viewerStore";
import { useViewTransform } from "../../hooks/useViewTransform";
import { useViewTransformStore } from "../../store/viewTransformStore";
import { useRuntimeStore } from "../../store/runtimeStore";
import { useConfigStore, type RoiDraft } from "../../store/configStore";
import { CameraOutlined, DownloadOutlined } from "@ant-design/icons";
import { downloadRawFrame } from "../../api";
import LiveVideoLayer from "./LiveVideoLayer";

const { Title, Text } = Typography;

type WaferViewerProps = {
    cameraId: string
    cameraName: string
    direction: string
    roiStable: boolean

    // ===== circle ROI =====
    roi?: RoiDraft
    roiEditable?: boolean
    onRoiChange?: (next: { cx: number; cy: number; r: number }) => void

    // ===== fork ROI =====
    forkRoi?: {
        x: number
        y: number
        width: number
        height: number
        imageWidth?: number
        imageHeight?: number
    }
    forkEditable?: boolean
    onForkChange?: (next: {
        x: number
        y: number
        width: number
        height: number
    }) => void

    // ===== frame =====
    frameWidth?: number
    frameHeight?: number

    liveStream?: MediaStream | null
    livekitStatus?: "connecting" | "connected" | "lost" | "unknown"
    livekitError?: string
}

type PixelInfo = {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    gray: number;
} | null;

const stageStyle: CSSProperties = {
    position: "relative",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    border: "1px dashed rgba(255,255,255,0.15)",
    borderRadius: 8,
    background: "#000",
};

const baseLayerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    pointerEvents: "none",
};

const hudStyle: CSSProperties = {
    position: "absolute",
    right: 12,
    bottom: 12,
    background: "rgba(16,23,34,0.38)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "8px 10px",
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1.5,
    pointerEvents: "none",
    color: "rgba(255,255,255,0.88)",
    minWidth: 180,
};

const actionButtonsStyle: React.CSSProperties = {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
    display: "flex",
    gap: 8,
}

export function WaferViewer({
    cameraId,
    cameraName,
    direction,
    roiStable,

    // ===== circle =====
    roi,
    roiEditable,
    onRoiChange,

    // ===== fork =====
    forkRoi,
    forkEditable,
    onForkChange,

    frameWidth,
    frameHeight,

    liveStream,
    livekitStatus = "unknown",
    livekitError = "",
}: WaferViewerProps) {
    const viewer = useViewerStore(
        (state) => state.viewerByCameraId[cameraId] ?? defaultViewerState,
    );

    const runtime = useRuntimeStore(
        (state) => state.runtimeByCameraId[cameraId]
    )
    const stream = liveStream ?? null
    const status = livekitStatus
    const error = livekitError
    // const { showRoi, showWafer, showRefPoints, showDistances } = viewer;

    const stageRef = useRef<HTMLDivElement | null>(null);
    const transformRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const sampleCanvasRef = useRef<HTMLCanvasElement | null>(
        document.createElement("canvas")
    );
    const frameLoopIdRef = useRef<number | null>(null);
    const lastSampleTimeRef = useRef(0);
    const didAutoFitRef = useRef(false);
    const lastStreamKeyRef = useRef<string | null>(null);
    const lastVideoSizeKeyRef = useRef<string | null>(null);
    const setRoiDraft = useConfigStore((s) => s.setRoiDraft)

    const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);
    const [pixelInfo, setPixelInfo] = useState<PixelInfo>(null);
    const [viewScale, setViewScale] = useState(1);

    const setForkDraft = useConfigStore((s) => s.setForkRoiDraft)

    const vt = useViewTransform({
        minScale: 0.2,
        maxScale: 8,
        zoomSpeed: 0.0015,
    });

    const setApi = useViewTransformStore((s) => s.setApi);

    const syncScaleState = () => {
        setViewScale(vt.getState().scale);
    };

    const toGray = (r: number, g: number, b: number) =>
        Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    const refreshSampleFrame = () => {
        const video = videoRef.current;
        const canvas = sampleCanvasRef.current;
        if (!video || !canvas) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;
        if (video.readyState < 2) return;

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, w, h);
    };

    const getImagePoint = (clientX: number, clientY: number) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return null;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const state = vt.getState();

        const imageX = Math.floor((x - state.tx) / state.scale);
        const imageY = Math.floor((y - state.ty) / state.scale);

        return { imageX, imageY };
    };

    const samplePixel = (ix: number, iy: number) => {
        const video = videoRef.current;
        const canvas = sampleCanvasRef.current;
        if (!video || !canvas) return null;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return null;
        if (ix < 0 || iy < 0 || ix >= w || iy >= h) return null;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        const data = ctx.getImageData(ix, iy, 1, 1).data;
        const r = data[0];
        const g = data[1];
        const b = data[2];

        return {
            x: ix,
            y: iy,
            r,
            g,
            b,
            gray: toGray(r, g, b),
        };
    };

    const setToActual100 = () => {
        const el = stageRef.current;
        if (!el || !videoSize) return;

        const rect = el.getBoundingClientRect();

        vt.setView({
            scale: 1,
            tx: (rect.width - videoSize.width) / 2,
            ty: (rect.height - videoSize.height) / 2,
        });

        syncScaleState();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const now = performance.now();
        if (now - lastSampleTimeRef.current < 16) return;
        lastSampleTimeRef.current = now;

        const p = getImagePoint(e.clientX, e.clientY);
        if (!p) {
            setPixelInfo(null);
            return;
        }

        if (
            !videoSize ||
            p.imageX < 0 ||
            p.imageY < 0 ||
            p.imageX >= videoSize.width ||
            p.imageY >= videoSize.height
        ) {
            setPixelInfo(null);
            return;
        }

        setPixelInfo(samplePixel(p.imageX, p.imageY));
    };

    const handleLeave = () => {
        setPixelInfo(null);
    };

    const handleVideoReady = useCallback(
        ({ width, height }: { width: number; height: number }) => {
            setVideoSize((prev) => {
                if (prev?.width === width && prev?.height === height) {
                    return prev;
                }
                return { width, height };
            });
        },
        [],
    );

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleScreenshot = () => {
        const video = videoRef.current;
        const canvas = sampleCanvasRef.current;

        if (!video || !canvas) return;
        if (video.readyState < 2) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, w, h);

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const filename =
            `${cameraId}_` +
            `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
            `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;

        canvas.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, filename);
        }, "image/png");
    };

    useEffect(() => {
        vt.attach(transformRef.current);
    }, [vt]);

    useEffect(() => {
        const loop = () => {
            refreshSampleFrame();
            frameLoopIdRef.current = requestAnimationFrame(loop);
        };

        frameLoopIdRef.current = requestAnimationFrame(loop);

        return () => {
            if (frameLoopIdRef.current != null) {
                cancelAnimationFrame(frameLoopIdRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;

        const getRect = () => el.getBoundingClientRect();

        setApi(cameraId, {
            fit: () => {
                const r = getRect();
                if (!videoSize) return;
                vt.fitContain(r.width, r.height, videoSize.width, videoSize.height);
                syncScaleState();
            },
            reset: () => {
                setToActual100();
            },
            set100: () => {
                setToActual100();
            },
        });
    }, [cameraId, setApi, videoSize, vt]);

    useEffect(() => {
        if (!stream || !videoSize) return;

        const sizeKey = `${videoSize.width}x${videoSize.height}`;
        const sizeChanged = lastVideoSizeKeyRef.current !== sizeKey;

        if (sizeChanged) {
            lastVideoSizeKeyRef.current = sizeKey;
            didAutoFitRef.current = false;
        }

        if (didAutoFitRef.current) return;

        const el = stageRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        vt.fitContain(rect.width, rect.height, videoSize.width, videoSize.height);
        syncScaleState();
        didAutoFitRef.current = true;
    }, [stream, videoSize, vt]);

    useEffect(() => {
        const nextStreamKey = stream ? `${cameraId}-active` : `${cameraId}-idle`;

        if (lastStreamKeyRef.current !== nextStreamKey) {
            lastStreamKeyRef.current = nextStreamKey;
            didAutoFitRef.current = false;
        }
    }, [cameraId, stream]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        // e.preventDefault();

        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const current = vt.getState();
        const nextScale = current.scale * (1 - e.deltaY * vt.zoomSpeed);

        vt.zoomAt(x, y, nextScale);
        syncScaleState();
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        const isDoubleRightClick = vt.onContextMenuInternal(e);
        if (!isDoubleRightClick) return;

        const el = stageRef.current;
        if (!el || !videoSize) return;

        const rect = el.getBoundingClientRect();
        vt.fitContain(rect.width, rect.height, videoSize.width, videoSize.height);
        syncScaleState();
    };

    const handleDownloadRawFrame = async () => {
        // const timestampUs = runtime?.lastFrameTimestampUs
        const timestampUs = Date.now() * 1000

        if (!timestampUs) {
            message.warning("No frame timestamp available")
            return
        }

        try {
            await downloadRawFrame(cameraId, timestampUs)
            message.success("Raw frame downloaded")
        } catch (error) {
            console.error(error)
            message.error(error instanceof Error ? error.message : "Download raw frame failed")
        }
    }

    return (
        <Card
            title="Viewer"
            style={{
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
            }}
            styles={{
                body: {
                    flex: 1,
                    minHeight: 0,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                },
            }}
            size="small"
            extra={
                <Tag>
                    {videoSize ? `${videoSize.width} × ${videoSize.height}` : "-- × --"}
                </Tag>
            }
        >
            <Flex vertical style={{ height: "100%", minHeight: 0 }} gap={12}>
                <Space wrap>
                    <Tag>LiveKit: {status}</Tag>
                    <Tag>{direction}</Tag>
                    <Tag>ROI Stable: {roiStable ? "Yes" : "No"}</Tag>
                </Space>

                <div
                    ref={stageRef}
                    style={stageStyle}
                    onWheel={handleWheel}
                    onContextMenu={handleContextMenu}
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handleLeave}
                    {...vt.bindings}
                >
                    <div style={actionButtonsStyle}>
                        <Button
                            type="default"
                            icon={<DownloadOutlined />}
                            size="small"
                            shape="round"
                            disabled={!runtime?.enabled}
                            onClick={(e) => {
                                e.stopPropagation()
                                void handleDownloadRawFrame()
                            }}
                            style={{ background: "rgba(0,0,0,0.2)" }}
                        >
                            RAW
                        </Button>

                        <Button
                            type="default"
                            icon={<CameraOutlined />}
                            size="small"
                            shape="round"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleScreenshot()
                            }}
                            style={{ background: "rgba(0,0,0,0.2)" }}
                        />
                    </div>
                    <div
                        ref={transformRef}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: videoSize?.width ?? "100%",
                            height: videoSize?.height ?? "100%",
                        }}
                    >
                        <LiveVideoLayer
                            stream={stream}
                            videoRef={videoRef}
                            onReady={handleVideoReady}
                        />
                        {forkRoi && frameWidth && frameHeight && onForkChange && viewer.showForkRoi && (
                            <div
                                onWheel={(e) => {
                                    if (!forkEditable) return
                                    e.preventDefault()
                                    e.stopPropagation()

                                    const nativeEvent = e.nativeEvent
                                    if ("stopImmediatePropagation" in nativeEvent) {
                                        nativeEvent.stopImmediatePropagation()
                                    }
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    pointerEvents: forkEditable ? "auto" : "none",
                                    overscrollBehavior: "contain",
                                }}
                            >
                                <ForkRoiOverlay
                                    imageWidth={frameWidth}
                                    imageHeight={frameHeight}
                                    forkRoiImageWidth={forkRoi.imageWidth}
                                    forkRoiImageHeight={forkRoi.imageHeight}
                                    x={forkRoi.x}
                                    y={forkRoi.y}
                                    width={forkRoi.width}
                                    height={forkRoi.height}
                                    editable={forkEditable}
                                    onChange={(next) => setForkDraft(cameraId, next)}
                                />
                            </div>
                        )}
                        {roi && frameWidth && frameHeight && onRoiChange && viewer.showWaferRoi && (
                            <div
                                onWheel={(e) => {
                                    if (!roiEditable) return
                                    e.preventDefault()
                                    e.stopPropagation()

                                    const nativeEvent = e.nativeEvent
                                    if ("stopImmediatePropagation" in nativeEvent) {
                                        nativeEvent.stopImmediatePropagation()
                                    }
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    pointerEvents: roiEditable ? "auto" : "none",
                                    overscrollBehavior: "contain",
                                }}
                            >
                                <RoiOverlay
                                    imageWidth={frameWidth}
                                    imageHeight={frameHeight}
                                    roiImageWidth={roi.imageWidth}
                                    roiImageHeight={roi.imageHeight}
                                    cx={roi.cx}
                                    cy={roi.cy}
                                    r={roi.r}
                                    editable={roiEditable}
                                    onChange={(next) => setRoiDraft(cameraId, next)}
                                />
                            </div>
                        )}
                    </div>

                    {!stream && (
                        <div style={baseLayerStyle}>
                            <Title level={4} style={{ margin: 0 }}>
                                {cameraName} Viewer
                            </Title>
                            <Text type="secondary">Waiting for LiveKit video...</Text>
                            {!!error && <Text type="danger">{error}</Text>}
                        </div>
                    )}

                    <div style={hudStyle}>
                        <div>Zoom: {(viewScale * 100).toFixed(0)}%</div>
                        <div>
                            Pos: {pixelInfo ? `${pixelInfo.x}, ${pixelInfo.y}` : "--, --"}
                        </div>
                        <div>
                            RGB:{" "}
                            {pixelInfo
                                ? `${pixelInfo.r}, ${pixelInfo.g}, ${pixelInfo.b}`
                                : "--, --, --"}
                        </div>
                        <div>Gray: {pixelInfo ? pixelInfo.gray : "--"}</div>
                    </div>
                </div>
            </Flex>
        </Card>
    );
}
