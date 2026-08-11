import { create } from "zustand"
import type { CameraApiItem, CameraItem } from "../types/camera"
import { http } from "../api/http"

type CameraStore = {
  cameras: CameraItem[]
  activeCameraId: string

  setActiveCamera: (cameraId: string) => void
  updateCamera: (cameraId: string, patch: Partial<CameraItem>) => void
  fetchCameraList: () => Promise<void>
}

const initialCameras: CameraItem[] = [1, 2, 3, 4].map((i) => ({
  id: `camera-${i}`,
  name: `Camera ${i}`,
  enabled: false,
  exists: false,
  started: false,
  room: "",
  track: "",
  publisherIdentity: "",
  sourceType: null,
  sourcePath: null,
}))

function mapApiCamera(apiCam: CameraApiItem, fallback: CameraItem): CameraItem {
  return {
    ...fallback,
    id: apiCam.camera_id,
    name: apiCam.name || fallback.name,

    enabled: apiCam.enabled,
    exists: apiCam.exists,
    started: apiCam.started,

    room: apiCam.room || "",
    track: apiCam.track || "",
    publisherIdentity: apiCam.publisher_identity || "",

    model: apiCam.model,
    serial: apiCam.serial,
    ip: apiCam.ip,

    sourceType: apiCam.source_type,
    sourcePath: apiCam.source_path,

    lastError: apiCam.last_error || "",
  }
}

export const useCameraStore = create<CameraStore>((set) => ({
  cameras: initialCameras,
  activeCameraId: initialCameras[0].id,

  setActiveCamera: (cameraId) => {
    set({ activeCameraId: cameraId })
  },

  updateCamera: (cameraId, patch) => {
    set((state) => ({
      cameras: state.cameras.map((camera) =>
        camera.id === cameraId ? { ...camera, ...patch } : camera
      ),
    }))
  },

  fetchCameraList: async () => {
    const data = await http.getJson<CameraApiItem[]>("/api/cameras")

    set((state) => ({
      cameras: state.cameras.map((camera) => {
        const apiCam = data.find((c) => c.camera_id === camera.id)
        return apiCam ? mapApiCamera(apiCam, camera) : camera
      }),
    }))
  },
}))