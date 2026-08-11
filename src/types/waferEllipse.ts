export type WaferEllipseConfig = {
  crop_roi: {
    x: number
    y: number
    w: number
    h: number
  }
  wafer_roi: {
    cx: number
    cy: number
    r: number
  }
  masks: Array<{
    x: number
    y: number
    w: number
    h: number
    enabled: boolean
  }>
  params: Record<string, unknown>
}

export type WaferEllipseResponse = {
  camera_id: string
  json_data: WaferEllipseConfig
}

export type WaferEllipseUpdatePayload = {
  json_data: WaferEllipseConfig
}