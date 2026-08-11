import { http } from "./http"
import type {
  ForkTemplateInfo,
  SaveForkTemplatePayload,
} from "../types/forkTemplate"

export async function getForkTemplate(cameraId: string) {
  return http.getJson<ForkTemplateInfo>(`/api/cameras/${cameraId}/fork-template`)
}

export async function uploadForkTemplateImage(cameraId: string, file: File) {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`/api/cameras/${cameraId}/fork-template/image`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    throw new Error(`upload fork template image failed: ${res.status}`)
  }

  return res.json()
}

export async function saveForkTemplate(
  cameraId: string,
  payload: SaveForkTemplatePayload,
) {
  return http.putJson(`/api/cameras/${cameraId}/fork-template`, payload)
}

export async function deleteForkTemplate(cameraId: string) {
  return http.deleteJson(`/api/cameras/${cameraId}/fork-template`)
}