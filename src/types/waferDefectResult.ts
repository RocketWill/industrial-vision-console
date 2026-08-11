export type WaferDefectProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "DONE"
  | "FAILED"

export type WaferDefectResultValue = "OK" | "BURN" | "UNKNOWN"

export type WaferDefectResult = {
  id: number
  wafer_session_id: number
  wafer_id: string
  camera_id: string
  snapshot_index: number
  snapshot_timestamp_us: number | null
  image_path: string | null
  overlay_path: string | null
  processing_status: WaferDefectProcessingStatus
  result: WaferDefectResultValue
  error_message: string | null
  bright_angle_percent: number | null
  dark_angle_percent: number | null
  bright_area_percent: number | null
  dark_area_percent: number | null
  max_component_percent: number | null
  bright_threshold_used: number | null
  dark_threshold_used: number | null
  severity_score: number | null
  config_version: number | null
  raw_metrics_json: string | null
  created_at: string
  updated_at: string
}

export type WaferDefectResultListResponse = {
  items: WaferDefectResult[]
  total: number
  offset: number
  limit: number
}

export type WaferDefectResultQuery = {
  camera_id?: string
  wafer_id?: string
  wafer_session_id?: number
  snapshot_index?: number
  processing_status?: WaferDefectProcessingStatus
  result?: WaferDefectResultValue
  start_time?: string
  end_time?: string
  offset?: number
  limit?: number
  sort_by?: string
  order?: "asc" | "desc"
}

export type WaferDefectExportPayload = Omit<
  WaferDefectResultQuery,
  "offset" | "limit" | "snapshot_index"
>

export type WaferDefectExportMeta = WaferDefectExportPayload & {
  total_rows: number
  filename: string
}
