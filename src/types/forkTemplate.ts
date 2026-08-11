export type RefPoint = {
  x: number
  y: number
  label: "P1" | "P2" | "P3" | "P4"
}

export type ForkTemplateInfo = {
  id: number
  camera_id: string

  source_image_path?: string | null
  template_image_path?: string | null
  preview_image_path?: string | null

  crop_x: number
  crop_y: number
  crop_width: number
  crop_height: number

  ref_points: RefPoint[]

  match_score_threshold: number // Hough 粗匹配門檻
  hough_votes_threshold: number
  enabled: boolean
  version: number
}

export type SaveForkTemplatePayload = {
  crop_x: number
  crop_y: number
  crop_width: number
  crop_height: number
  ref_points: RefPoint[]
  match_score_threshold: number
  hough_votes_threshold: number
  enabled: boolean
}