export type ApiSuccess<T> = {
  ok: true
  data: T
}

export type ApiError = {
  ok: false
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type DirectionType = "IN" | "OUT" | "STABLE" | "UNKNOWN"
export type HitPhase = "IN" | "OUT"
export type DetectionArmStatus = "DISABLED" | "ARMED"

export type CircleRoi = {
  cx: number
  cy: number
  r: number
}

export type ForkRoi = {
  x: number
  y: number
  width: number
  height: number
}

export type CameraRuntimeConfig = {
  gray_stability_threshold: number
  stable_frame_count_n: number
  inspection_cooldown_ms: number
}

export type CameraState = {
  camera_id: string
  name?: string
  enabled: boolean
  token?: string | null
  room?: string | null
  url?: string | null
  roi?: CircleRoi | null
  fork_roi?: ForkRoi | null
  runtime_config?: CameraRuntimeConfig
}

export type LiveRuntimeStatus = {
  camera_id: string
  enabled: boolean
  stream_connected: boolean
  worker_running: boolean
  last_error: string | null
  last_frame_width: number | null
  last_frame_height: number | null
  last_frame_timestamp_us: number | null
  roi_gray_mean: number | null
  roi_gray_delta: number | null
  roi_stable: boolean
  last_roi_stable_time?: string | null
  flow_mean_vy?: number | null
  flow_vy_smooth?: number | null
  flow_motion_score?: number | null
  current_direction?: DirectionType
  wafer_state?: string | null
  session_status?: string | null
  current_wafer_id?: string | null
  inspection_count?: number
  in_inspection_count?: number
  out_inspection_count?: number
  last_inspection_time?: string | null
  last_trigger_time?: string | null
  alignment_ok: boolean | null
  alignment_detail: boolean[] | null
  switch_detection_enabled?: boolean
  next_hit_phase?: HitPhase
  detection_arm_status?: DetectionArmStatus
  detection_command_version?: number
  detection_applied_version?: number
  pending_out_session_ids?: number[]
}

export type StartCameraResponse = {
  accepted: boolean
  camera_id: string
  task_created: boolean
  task_exists: boolean
  task_done: boolean | null
  runtime: {
    worker_running: boolean
    stream_connected: boolean
    last_error: string | null
  }
}

export type StopCameraResponse = {
  ok: boolean
  camera_id: string
}

export type UpdateRoiPayload = {
  cx: number
  cy: number
  r: number
}

export type UpdateRoiResponse = {
  camera_id: string
  roi: CircleRoi | null
}

export type SystemConfig = {
  id: number
  camera_id: string
  config_name: string

  roi_center_x: number
  roi_center_y: number
  roi_radius: number
  roi_image_width: number | null
  roi_image_height: number | null

  fork_roi_x: number
  fork_roi_y: number
  fork_roi_width: number
  fork_roi_height: number
  fork_roi_image_width: number | null
  fork_roi_image_height: number | null

  fork_detection_enabled: boolean
  fork_match_score_threshold: number
  fork_hough_votes_threshold: number

  gray_stability_threshold: number
  stable_frame_count_n: number

  roi_gray_mean_min: number | null
  roi_gray_mean_max: number | null

  inspection_cooldown_ms: number

  distance_tolerance_1: number
  distance_tolerance_2: number
  distance_tolerance_3: number
  distance_tolerance_4: number

  alignment_mm_per_pixel: number

  home_position_y: number

  enabled: boolean
  version: number
  created_at?: string
  updated_at?: string
}

export type UpdateSystemConfigPayload = Partial<
  Pick<
    SystemConfig,
    | "config_name"
    | "roi_center_x"
    | "roi_center_y"
    | "roi_radius"
    | "roi_image_width"
    | "roi_image_height"
    | "fork_roi_x"
    | "fork_roi_y"
    | "fork_roi_width"
    | "fork_roi_height"
    | "fork_roi_image_width"
    | "fork_roi_image_height"
    | "fork_detection_enabled"
    | "fork_match_score_threshold"
    | "gray_stability_threshold"
    | "stable_frame_count_n"
    | "inspection_cooldown_ms"
    | "distance_tolerance_1"
    | "distance_tolerance_2"
    | "distance_tolerance_3"
    | "distance_tolerance_4"
    | "alignment_mm_per_pixel"
    | "home_position_y"
    | "enabled"
    | "fork_hough_votes_threshold"
  >
>

export type UpdateTolerancePayload = Partial<{
  distance_tolerance_1: number
  distance_tolerance_2: number
  distance_tolerance_3: number
  distance_tolerance_4: number
  alignment_mm_per_pixel: number
}>

export type UpdateRuntimeConfigPayload = Partial<{
  gray_stability_threshold: number
  stable_frame_count_n: number
  inspection_cooldown_ms: number
}>

export type UpdateRuntimeConfigResponse = {
  camera_id: string
  runtime_config: CameraRuntimeConfig
}

export type WaferSession = {
  id: number
  wafer_id: string
  start_time?: string | null
  end_time?: string | null
  session_status?: string | null
  inspection_count?: number | null
  created_at?: string
  updated_at?: string
}

export type InspectionResult = {
  id: number
  wafer_session_id: number
  inspection_time?: string | null
  pass_direction?: string | null
  trigger_reason?: string | null
  roi_gray_mean?: number | null
  roi_gray_std?: number | null
  alignment_ok?: boolean | null
  alignment_detail?: string | null
  defect_ok?: boolean | null
  overall_ok?: boolean | null
  image_path?: string | null
  overlay_path?: string | null
}

export type WaferDetail = {
  session: WaferSession
  inspection_results: InspectionResult[]
}

export type UpdateSwitchDetectionPayload = {
  enabled: boolean
  next_hit_phase?: HitPhase
}

export type UpdateSwitchDetectionResponse = {
  camera_id: string
  switch_detection_enabled: boolean
  next_hit_phase: HitPhase
  detection_arm_status: DetectionArmStatus
  detection_command_version: number
  detection_applied_version: number
  aborted_session_ids: number[]
}
