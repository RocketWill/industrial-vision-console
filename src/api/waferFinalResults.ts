import { http } from "./http"

export type WaferFinalResult = {
  id: number
  wafer_session_id: number
  wafer_id: string
  camera_id: string

  inspection_count: number
  ok_count: number
  ng_count: number

  alignment_ok_count: number
  alignment_ng_count: number

  final_distance_1_ok: boolean
  final_distance_2_ok: boolean
  final_distance_3_ok: boolean
  final_distance_4_ok: boolean

  final_alignment_ok: boolean

  final_burn_ok: boolean
  final_crack_ok: boolean
  final_defect_ok: boolean

  final_overall_ok: boolean
  final_result: string

  first_time?: string
  last_time?: string

  created_at: string
  updated_at: string
}

export type WaferFinalResultListResponse = {
  items: WaferFinalResult[]
  total: number
  offset: number
  limit: number
}

type WaferFinalQuery = {
  camera_id?: string
  wafer_id?: string
  start_time?: string
  end_time?: string
  offset?: number
  limit?: number
  sort_by?: string
  order?: "asc" | "desc"
}

export type FinalReportExportRequest = {
  camera_id?: string
  wafer_id?: string
  final_result?: string
  start_time?: string
  end_time?: string
  sort_by?: string
  order?: "asc" | "desc"
}

export type FinalReportExportMeta = {
  camera_id?: string
  wafer_id?: string
  final_result?: string
  start_time?: string
  end_time?: string
  sort_by: string
  order: "asc" | "desc"
  total_rows: number
  filename: string
}

export function fetchWaferFinalResults(params: WaferFinalQuery) {
  return http.getJson<WaferFinalResultListResponse>(
    "/api/wafer-final-results",
    params
  )
}

export function previewWaferFinalResultsExport(
  payload: FinalReportExportRequest
) {
  return http.postJson<FinalReportExportMeta>(
    "/api/reports/wafer-final-results/export/preview",
    payload
  )
}

export async function exportWaferFinalResults(
  payload: FinalReportExportRequest
): Promise<Blob> {
  const response = await fetch("/api/reports/wafer-final-results/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`export wafer final results failed: ${response.status}`)
  }

  return await response.blob()
}