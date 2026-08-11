import { http } from "./http"
import type {
  ForkMatchConfig,
  ForkMatchConfigUpdate,
} from "../types/forkMatchConfig"

const BASE_URL = "/api/camera-match-configs"

export function getForkMatchConfig(cameraId: string) {
  return http.getJson<ForkMatchConfig | null>(`${BASE_URL}/${cameraId}`)
}

export function saveForkMatchConfig(
  cameraId: string,
  payload: ForkMatchConfigUpdate,
) {
  return http.putJson<ForkMatchConfig>(`${BASE_URL}/${cameraId}`, payload)
}

export function deleteForkMatchConfig(cameraId: string) {
  return http.deleteJson<{ ok: boolean }>(`${BASE_URL}/${cameraId}`)
}