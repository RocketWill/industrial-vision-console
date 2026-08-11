import { http } from "./http"
import type {
  InspectionResultListResponse,
  InspectionResultQuery,
  InspectionResultItem,
} from "../types/inspectionResult"

export async function getInspectionResults(
  params: InspectionResultQuery,
): Promise<InspectionResultListResponse> {
  return http.getJson<InspectionResultListResponse>(
    "/api/inspection-results",
    normalizeInspectionResultQuery(params),
  )
}

export async function getInspectionResultById(
  id: number,
): Promise<InspectionResultItem> {
  return http.getJson<InspectionResultItem>(`/api/inspection-results/${id}`)
}

export async function getLatestInspectionResultByCamera(
  cameraId: string,
): Promise<InspectionResultItem | null> {
  return http.getJson<InspectionResultItem | null>(
    `/api/inspection-results/latest/by-camera/${cameraId}`,
  )
}

export type ExportInspectionReportPayload = {
  camera_id?: string
  wafer_session_id?: number
  start_time?: string
  end_time?: string
  pass_direction?: string
  overall_ok?: boolean
  alignment_ok?: boolean
  defect_ok?: boolean
  trigger_reason?: string
  sort_by?: string
  order?: "asc" | "desc"
  include_raw_metrics?: boolean
  include_sessions_sheet?: boolean
  include_events_sheet?: boolean
}

export async function exportInspectionReport(
  payload: ExportInspectionReportPayload,
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch("/api/reports/inspection-results/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`export failed: ${response.status}`)
  }

  const blob = await response.blob()

  const disposition = response.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="?(.*?)"?$/)
  const filename = match?.[1] || "inspection_report.xlsx"

  return { blob, filename }
}

function normalizeInspectionResultQuery(
  query: InspectionResultQuery,
): Record<string, string | number | boolean | undefined> {
  return {
    camera_id: query.camera_id,
    wafer_session_id: query.wafer_session_id,
    start_time: query.start_time,
    end_time: query.end_time,
    pass_direction: query.pass_direction,
    overall_ok: query.overall_ok,
    alignment_ok: query.alignment_ok,
    defect_ok: query.defect_ok,
    trigger_reason: query.trigger_reason,
    offset: query.offset,
    limit: query.limit,
    sort_by: query.sort_by,
    order: query.order,
  }
}