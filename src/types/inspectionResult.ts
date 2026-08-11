export type InspectionResultItem = {
    id: number
    camera_id: string
    wafer_session_id: number
    wafer_id: string
    inspection_time: string

    pass_direction: string
    pass_index: number
    trigger_reason: string
    trigger_id?: string | null
    config_version: number

    flow_mean_vy: number
    flow_motion_score: number
    direction: string

    roi_gray_mean: number
    roi_gray_std: number
    is_roi_gray_stable: boolean

    wafer_shape: string
    wafer_center_x?: number | null
    wafer_center_y?: number | null
    wafer_axis_major?: number | null
    wafer_axis_minor?: number | null
    wafer_angle?: number | null
    wafer_geometry_score?: number | null
    wafer_geometry_found: boolean

    ref_point_1_x?: number | null
    ref_point_1_y?: number | null
    ref_point_2_x?: number | null
    ref_point_2_y?: number | null
    ref_point_3_x?: number | null
    ref_point_3_y?: number | null
    ref_point_4_x?: number | null
    ref_point_4_y?: number | null
    reference_points_found: boolean
    fork_match_score?: number | null

    alignment_method: string
    distance_1?: number | null
    distance_2?: number | null
    distance_3?: number | null
    distance_4?: number | null
    alignment_score?: number | null
    alignment_ok: boolean
    alignment_1_ok: boolean
    alignment_2_ok: boolean
    alignment_3_ok: boolean
    alignment_4_ok: boolean

    defect_crack: boolean
    defect_burn: boolean
    defect_ok: boolean

    image_path?: string | null
    image_preview_path?: string | null
    image_thumb_path?: string | null

    overlay_path?: string | null
    overlay_preview_path?: string | null
    overlay_thumb_path?: string | null

    overall_ok: boolean
    alignment_mm_per_pixel: number
}

export type InspectionResultListResponse = {
    total: number
    offset: number
    limit: number
    items: InspectionResultItem[]
}

export type InspectionResultQuery = {
    camera_id?: string
    wafer_session_id?: number
    start_time?: string
    end_time?: string
    pass_direction?: string
    overall_ok?: boolean
    alignment_ok?: boolean
    defect_ok?: boolean
    trigger_reason?: string
    offset?: number
    limit?: number
    sort_by?: string
    order?: "asc" | "desc"
}