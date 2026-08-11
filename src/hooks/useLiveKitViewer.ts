import { useEffect, useMemo, useState } from "react";
import { useLiveKitVideo } from "./useLiveKitVideo";
import { getViewerToken } from "../api";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxxyxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateId(key: string) {
  if (typeof window === "undefined") return "ssr";

  const k = `vc_${key}`;
  let id = localStorage.getItem(k);

  if (!id) {
    id = uuid();
    localStorage.setItem(k, id);
  }

  return id;
}

export function useLiveKitViewer(
  url: string | null,
  room: string | null,
  identityKey: string
) {
  const stableId = useMemo(() => getOrCreateId(identityKey), [identityKey]);
  const identity = useMemo(
    () => `${identityKey}-${stableId}`,
    [identityKey, stableId]
  );

  const requestKey = `${room ?? ""}:${identity}`;
  const [tokenState, setTokenState] = useState({ key: "", token: "" });
  const enabled = !!url && !!room;
  const token = tokenState.key === requestKey ? tokenState.token : "";

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    getViewerToken({ room: room!, identity })
      .then((t) => {
        if (!cancelled) setTokenState({ key: requestKey, token: t });
      })
      .catch((e) => {
        console.error("[getViewerToken]", e);
        if (!cancelled) setTokenState({ key: requestKey, token: "" });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, room, identity, requestKey]);

  const lk = useLiveKitVideo(
    enabled ? url : null,
    enabled && token ? token : null
  );

  return {
    ...lk,
    tokenReady: enabled && !!token,
    identity,
  };
}
