import { http } from "./http"
// import type {
//   CameraConfigResult,
//   CameraHealth,
//   CameraParams,
// } from "./types"

// export function getCameraHealth() {
//   return http.getJson<CameraHealth>("/api/camera/health")
// }

// export function getCameraParams() {
//   return http.getJson<CameraParams>("/api/camera/params")
// }

// export function setExposureAuto(enable: boolean) {
//   return http.postJson<CameraConfigResult>("/api/camera/exposure/auto", {
//     enable,
//   })
// }

// export function setExposure(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/exposure", {
//     value,
//   })
// }

// export function setGainAuto(enable: boolean) {
//   return http.postJson<CameraConfigResult>("/api/camera/gain/auto", {
//     enable,
//   })
// }

// export function setGain(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/gain", {
//     value,
//   })
// }

// export function setWhiteBalanceAuto(enable: boolean) {
//   return http.postJson<CameraConfigResult>("/api/camera/white-balance/auto", {
//     enable,
//   })
// }

// export function setWhiteBalance(
//   red: number,
//   green: number,
//   blue: number
// ) {
//   return http.postJson<CameraConfigResult>("/api/camera/white-balance", {
//     red,
//     green,
//     blue,
//   })
// }

// export function setFrameRateAuto(enable: boolean) {
//   return http.postJson<CameraConfigResult>("/api/camera/framerate/auto", {
//     enable,
//   })
// }

// export function setFrameRate(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/framerate", {
//     value,
//   })
// }

// export function setGammaEnable(enable: boolean) {
//   return http.postJson<CameraConfigResult>("/api/camera/gamma/enable", {
//     enable,
//   })
// }

// export function setGamma(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/gamma", {
//     value,
//   })
// }

// export function setBlackLevel(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/blacklevel", {
//     value,
//   })
// }

// export function setSharpeningEnable(enable: boolean) {
//   return http.postJson<CameraConfigResult>("/api/camera/sharpening/enable", {
//     enable,
//   })
// }

// export function setSharpeningAmount(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/sharpening/amount", {
//     value,
//   })
// }

// export function setSharpeningThreshold(value: number) {
//   return http.postJson<CameraConfigResult>("/api/camera/sharpening/threshold", {
//     value,
//   })
// }

// export type UpdateCameraConfigInput = {
//   exposureAuto?: boolean
//   exposureTime?: number

//   gainAuto?: boolean
//   gain?: number

//   frameRateAuto?: boolean
//   frameRate?: number

//   gammaEnable?: boolean
//   gamma?: number

//   blackLevel?: number

//   sharpeningEnable?: boolean
//   sharpeningAmount?: number
//   sharpeningThreshold?: number
// }

// export function updateCameraConfig(input: UpdateCameraConfigInput) {
//   return http.postJson<CameraConfigResult>("/api/camera/config", input)
// }

// export function resetCameraDefaults() {
//   return http.postJson<CameraConfigResult>("/api/camera/restore-default", {})
// }
export type CameraInfo = {
  camera_id: string
  enabled: boolean
  room: string
}

export function fetchCameras() {
  return http.getJson<CameraInfo[]>("/api/cameras")
}