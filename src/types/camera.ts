export type CameraDirection = "IN" | "OUT" | "STABLE"
export type CameraConnection = "connected" | "disconnected" | "connecting"

export type CameraSourceType = "lucid" | "mp4" | null

export type CameraItem = {
  id: string
  name: string

  enabled: boolean
  exists: boolean
  started: boolean

  room: string
  track: string
  publisherIdentity: string

  model?: string | null
  serial?: string | null
  ip?: string | null

  sourceType?: CameraSourceType
  sourcePath?: string | null

  lastError?: string

  connection?: CameraConnection
  direction?: CameraDirection
  sessionActive?: boolean
  waferId?: string
  url?: string
}

export type CameraApiItem = {
  camera_id: string
  name: string | null
  model: string | null
  serial: string | null
  ip: string | null
  source_type: CameraSourceType
  source_path: string | null
  room: string | null
  publisher_identity: string | null
  track: string | null
  enabled: boolean
  started: boolean
  exists: boolean
  last_error: string
}