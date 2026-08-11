import { http } from "./http"
import type { WaferDetail, WaferSession } from "./types"

export function listWafers() {
  return http.getJson<WaferSession[]>("/api/wafers")
}

export function getWaferDetail(waferId: string) {
  return http.getJson<WaferDetail>(`/api/wafers/${waferId}`)
}