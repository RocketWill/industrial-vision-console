import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  VideoQuality,
  type RemoteTrackPublication,
} from "livekit-client";

type ConnStatus = "connecting" | "connected" | "lost" | "unknown";

const PREFERRED_VIDEO_DIMENSIONS = {
  width: 1080,
  height: 720,
};

export function useLiveKitVideo(url: string | null, token: string | null) {
  const roomRef = useRef<Room | null>(null);
  const lastVideoTrackSidRef = useRef<string | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<ConnStatus>("unknown");
  const [error, setError] = useState<string>("");
  const enabled = Boolean(url && token);

  useEffect(() => {
    let cancelled = false;

    if (!url || !token) {
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch {
          // Disconnect is best-effort during cleanup.
        }
      }

      lastVideoTrackSidRef.current = null;
      return;
    }

    if (!roomRef.current) {
      roomRef.current = new Room({
        adaptiveStream: false,
        dynacast: false,

        audioCaptureDefaults: { deviceId: undefined },
        videoCaptureDefaults: { deviceId: undefined },
      });
    }

    const room = roomRef.current;

    const attachVideoTrack = (track: Track) => {
      if (track.kind !== Track.Kind.Video) return;

      // 避免同一條 track 重複 setStream（尤其 reconcile 會再掃一次）
      const sid = track.sid;
      if (sid && lastVideoTrackSidRef.current === sid) return;
      if (sid) lastVideoTrackSidRef.current = sid;

      const ms = new MediaStream([track.mediaStreamTrack]);

      const settings = track.mediaStreamTrack.getSettings();
      console.log("[LiveKit] attach video track settings:", settings);

      if (
        settings.width &&
        settings.height &&
        (settings.width < PREFERRED_VIDEO_DIMENSIONS.width ||
          settings.height < PREFERRED_VIDEO_DIMENSIONS.height)
      ) {
        console.warn("[LiveKit] video dropped to low layer:", settings);
      }

      setStream(ms);
    };

    const reconcileExistingTracks = () => {
      // 掃 room 內已存在的 remote tracks（refresh 後最重要）
      room.remoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (pub.kind === Track.Kind.Video) {
            pub.setVideoQuality(VideoQuality.HIGH);
            pub.setVideoDimensions(PREFERRED_VIDEO_DIMENSIONS);
          }

          // 若未來改成 autoSubscribe: false
          if (!pub.isSubscribed) pub.setSubscribed(true);

          const t = pub.track;
          if (t && t.kind === Track.Kind.Video) attachVideoTrack(t);
        });
      });
    };

    const onTrackSubscribed = (track: Track, pub: RemoteTrackPublication) => {
      if (track.kind === Track.Kind.Video) {
        pub.setVideoQuality?.(VideoQuality.HIGH);
        pub.setVideoDimensions?.(PREFERRED_VIDEO_DIMENSIONS);
      }

      attachVideoTrack(track);
    };

    const onTrackPublished = () => {
      // published 不一定立刻 subscribed，保險補掃
      reconcileExistingTracks();
    };

    const onParticipantConnected = () => {
      reconcileExistingTracks();
    };

    const onDisconnected = () => {
      if (!cancelled) setStatus("lost");
    };

    const onReconnected = () => {
      // 重連後也補掃一次
      reconcileExistingTracks();
    };

    room
      .on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      .on(RoomEvent.TrackPublished, onTrackPublished)
      .on(RoomEvent.ParticipantConnected, onParticipantConnected)
      .on(RoomEvent.Disconnected, onDisconnected)
      .on(RoomEvent.Reconnected, onReconnected);

    (async () => {
      try {
        setStatus("connecting");
        setError("");
        setStream(null);
        lastVideoTrackSidRef.current = null;

        await room.connect(url, token, { autoSubscribe: true });

        if (cancelled) return;

        setStatus("connected");

        // ✅ connect 完立刻補掃：抓到「早就存在」的 tracks
        reconcileExistingTracks();
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("lost");
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;

      // ✅ cleanup 一定要 off，否則 StrictMode / 重連會越綁越多
      room
        .off(RoomEvent.TrackSubscribed, onTrackSubscribed)
        .off(RoomEvent.TrackPublished, onTrackPublished)
        .off(RoomEvent.ParticipantConnected, onParticipantConnected)
        .off(RoomEvent.Disconnected, onDisconnected)
        .off(RoomEvent.Reconnected, onReconnected);

      try {
        room.disconnect();
      } catch {
        // Disconnect is best-effort during cleanup.
      }
    };
  }, [url, token]);

  return {
    stream: enabled ? stream : null,
    status: enabled ? status : "unknown",
    error: enabled ? error : "",
  };
}
