import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";

type LiveVideoLayerProps = {
    stream: MediaStream | null;
    onReady?: (size: { width: number; height: number }) => void;
    videoRef?: RefObject<HTMLVideoElement | null>;
};

const videoStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
    userSelect: "none",
};

export default function LiveVideoLayer({
    stream,
    onReady,
    videoRef,
}: LiveVideoLayerProps) {
    const innerVideoRef = useRef<HTMLVideoElement | null>(null);
    const resolvedVideoRef = videoRef ?? innerVideoRef;

    useEffect(() => {
        const video = resolvedVideoRef.current;
        if (!video) return;

        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }

        if (stream) {
            void video.play().catch(() => { });
        }
    }, [stream, resolvedVideoRef]);

    useEffect(() => {
        const video = resolvedVideoRef.current;
        if (!video) return;

        const emitReady = () => {
            if (!video.videoWidth || !video.videoHeight) return;

            console.log("[LiveVideoLayer] video resolution:", {
                width: video.videoWidth,
                height: video.videoHeight,
            });

            onReady?.({
                width: video.videoWidth,
                height: video.videoHeight,
            });
        };

        video.addEventListener("loadedmetadata", emitReady);
        video.addEventListener("resize", emitReady);

        if (video.videoWidth && video.videoHeight) {
            emitReady();
        }

        return () => {
            video.removeEventListener("loadedmetadata", emitReady);
            video.removeEventListener("resize", emitReady);
        };
    }, [onReady, resolvedVideoRef]);

    return (
        <video
            ref={resolvedVideoRef}
            muted
            autoPlay
            playsInline
            style={videoStyle}
        />
    );
}