import { http } from "./http"
import type {
    CameraState,
    LiveRuntimeStatus,
    StartCameraResponse,
    StopCameraResponse,
    SystemConfig,
    UpdateRoiPayload,
    UpdateRoiResponse,
    UpdateRuntimeConfigPayload,
    UpdateRuntimeConfigResponse,
    UpdateSystemConfigPayload,
    UpdateTolerancePayload,
    UpdateSwitchDetectionPayload,
    UpdateSwitchDetectionResponse,
} from "./types"

export function listCameras() {
    return http.getJson<CameraState[]>("/api/live/cameras")
}

export function listEnabledCameras() {
    return http.getJson<CameraState[]>("/api/live/cameras/enabled")
}

export function refreshCameraTokens() {
    return http.postJson<{ ok: boolean }>("/api/live/cameras/refresh-tokens")
}

export function updateCameraRoi(cameraId: string, payload: UpdateRoiPayload) {
    return http.postJson<UpdateRoiResponse>(`/api/live/cameras/${cameraId}/roi`, payload)
}

export function getAllLiveStatus() {
    return http.getJson<LiveRuntimeStatus[]>("/api/live/status")
}

export function getCameraStatus(cameraId: string) {
    return http.getJson<LiveRuntimeStatus>(`/api/live/status/${cameraId}`)
}

export function startCamera(cameraId: string) {
    return http.postJson<StartCameraResponse>(`/api/live/cameras/${cameraId}/start`)
}

export function stopCamera(cameraId: string) {
    return http.postJson<StopCameraResponse>(`/api/live/cameras/${cameraId}/stop`)
}

export function updateSwitchDetection(
    cameraId: string,
    payload: UpdateSwitchDetectionPayload,
) {
    return http.putJson<UpdateSwitchDetectionResponse>(
        `/api/live/cameras/${cameraId}/switch-detection`,
        payload,
    )
}

export function getCameraConfig(cameraId: string) {
    return http.getJson<SystemConfig>(`/api/config/cameras/${cameraId}`)
}

export function updateCameraConfig(cameraId: string, payload: UpdateSystemConfigPayload) {
    return http.putJson<SystemConfig>(`/api/config/cameras/${cameraId}`, payload)
}

export function updateCameraTolerance(cameraId: string, payload: UpdateTolerancePayload) {
    return http.putJson<SystemConfig>(`/api/config/cameras/${cameraId}/tolerance`, payload)
}

export function updateCameraRuntimeConfig(
    cameraId: string,
    payload: UpdateRuntimeConfigPayload,
) {
    return http.putJson<UpdateRuntimeConfigResponse>(
        `/api/config/cameras/${cameraId}/runtime`,
        payload,
    )
}

export type CameraStatusStreamHandlers = {
    onMessage: (data: LiveRuntimeStatus) => void
    onError?: (event: Event) => void
    onOpen?: () => void
}

export function subscribeCameraStatus(
    cameraId: string,
    handlers: CameraStatusStreamHandlers,
) {
    const es = new EventSource(`/api/live/status/${cameraId}/stream`)

    es.onopen = () => {
        handlers.onOpen?.()
    }

    es.onmessage = (event) => {
        const data = JSON.parse(event.data) as LiveRuntimeStatus
        handlers.onMessage(data)
    }

    es.onerror = (event) => {
        handlers.onError?.(event)
    }

    return {
        close: () => {
            es.close()
        },
        source: es,
    }
}

export async function downloadRawFrame(
  cameraId: string,
  timestampUs: number,
): Promise<void> {
  const blob = await http.getBlob(
    `/api/live/cameras/${cameraId}/raw-frame/download`,
    { timestampUs },
  )

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")

  a.href = url
  a.download = `${cameraId}_${timestampUs}.png`

  document.body.appendChild(a)
  a.click()
  a.remove()

  window.URL.revokeObjectURL(url)
}