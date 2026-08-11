import type {
  WaferEllipseResponse,
  WaferEllipseUpdatePayload,
} from "../types/waferEllipse"

export async function getWaferEllipse(cameraId: string): Promise<WaferEllipseResponse> {
  const res = await fetch(`/api/cameras/${cameraId}/wafer-ellipse`)
  if (!res.ok) {
    throw new Error("failed to fetch wafer ellipse config")
  }
  return res.json()
}

export async function saveWaferEllipse(
  cameraId: string,
  payload: WaferEllipseUpdatePayload,
): Promise<WaferEllipseResponse> {
  const res = await fetch(`/api/cameras/${cameraId}/wafer-ellipse`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error("failed to save wafer ellipse config")
  }

  return res.json()
}