import { http } from "./http"
import type {
  WaferDefectExportMeta,
  WaferDefectExportPayload,
  WaferDefectResult,
  WaferDefectResultListResponse,
  WaferDefectResultQuery,
} from "../types/waferDefectResult"

const SORTABLE_FIELDS = new Set([
  "id",
  "wafer_session_id",
  "wafer_id",
  "camera_id",
  "snapshot_index",
  "snapshot_timestamp_us",
  "processing_status",
  "result",
  "severity_score",
  "created_at",
  "updated_at",
])

function withValidSort<T extends { sort_by?: string }>(params: T): T {
  if (!params.sort_by || SORTABLE_FIELDS.has(params.sort_by)) return params
  return { ...params, sort_by: "created_at" }
}

export function fetchWaferDefectResults(params: WaferDefectResultQuery) {
  return http.getJson<WaferDefectResultListResponse>(
    "/api/wafer-defect-results",
    withValidSort(params),
  )
}

export function fetchWaferDefectResultById(defectResultId: number) {
  return http.getJson<WaferDefectResult>(
    `/api/wafer-defect-results/${defectResultId}`,
  )
}

export function fetchLatestWaferDefectResult(cameraId: string) {
  return http.getJson<WaferDefectResult | null>(
    `/api/wafer-defect-results/latest/by-camera/${cameraId}`,
  )
}

export function previewWaferDefectResultsExport(
  payload: WaferDefectExportPayload,
) {
  return http.postJson<WaferDefectExportMeta>(
    "/api/reports/wafer-defect-results/export/preview",
    withValidSort(payload),
  )
}

export function exportWaferDefectResults(payload: WaferDefectExportPayload) {
  return http.postBlob(
    "/api/reports/wafer-defect-results/export",
    withValidSort(payload),
  )
}
