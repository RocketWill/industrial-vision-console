type RuntimeAppConfig = {
  VITE_LIVEKIT_URL?: string
  VITE_LIVEKIT_ROOM?: string
  API_TARGET?: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeAppConfig
  }
}

export function getRuntimeConfig(): RuntimeAppConfig {
  return {
    VITE_LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_URL,
    VITE_LIVEKIT_ROOM: import.meta.env.VITE_LIVEKIT_ROOM,
    ...window.__APP_CONFIG__,
  }
}
