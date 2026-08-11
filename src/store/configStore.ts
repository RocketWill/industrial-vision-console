import { create } from "zustand"
import {
  getCameraConfig,
  updateCameraConfig,
  updateCameraRoi,
} from "../api"
import type { SystemConfig } from "../api"

export type RoiDraft = {
  cx: number
  cy: number
  r: number
  imageWidth?: number
  imageHeight?: number
}

export type ForkRoiDraft = {
  x: number
  y: number
  width: number
  height: number
  imageWidth?: number
  imageHeight?: number
}

type ThresholdConfigPayload = Partial<
  Pick<
    SystemConfig,
    | "distance_tolerance_1"
    | "distance_tolerance_2"
    | "distance_tolerance_3"
    | "distance_tolerance_4"
    | "alignment_mm_per_pixel"
    | "gray_stability_threshold"
    | "stable_frame_count_n"
    | "inspection_cooldown_ms"
    | "fork_match_score_threshold"
    | "fork_hough_votes_threshold"
    | "fork_detection_enabled"
    | "roi_gray_mean_min"
    | "roi_gray_mean_max"
    | "home_position_y"
    | "enabled"
  >
>

type ConfigStore = {
  configByCameraId: Record<string, SystemConfig>

  roiDraftByCameraId: Record<string, RoiDraft | undefined>
  forkRoiDraftByCameraId: Record<string, ForkRoiDraft | undefined>

  loading: boolean
  saveRoiDraftLoading: boolean
  saveForkRoiDraftLoading: boolean
  error: string | null

  fetchConfig: (cameraId: string) => Promise<void>

  setRoiDraft: (cameraId: string, patch: Partial<RoiDraft>) => void
  resetRoiDraftFromConfig: (cameraId: string) => void
  saveRoiDraft: (cameraId: string) => Promise<void>

  setForkRoiDraft: (cameraId: string, patch: Partial<ForkRoiDraft>) => void
  resetForkRoiDraftFromConfig: (cameraId: string) => void
  saveForkRoiDraft: (cameraId: string) => Promise<void>

  updateThresholdConfig: (
    cameraId: string,
    payload: ThresholdConfigPayload
  ) => Promise<void>
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  configByCameraId: {},
  roiDraftByCameraId: {},
  forkRoiDraftByCameraId: {},
  loading: false,
  error: null,
  saveRoiDraftLoading: false,
  saveForkRoiDraftLoading: false,

  fetchConfig: async (cameraId) => {
    set({ loading: true, error: null })
    try {
      const config = await getCameraConfig(cameraId)

      set((state) => ({
        configByCameraId: {
          ...state.configByCameraId,
          [cameraId]: config,
        },
        roiDraftByCameraId: {
          ...state.roiDraftByCameraId,
          [cameraId]: {
            cx: config.roi_center_x,
            cy: config.roi_center_y,
            r: config.roi_radius,
            imageWidth: config.roi_image_width ?? undefined,
            imageHeight: config.roi_image_height ?? undefined,
          },
        },
        forkRoiDraftByCameraId: {
          ...state.forkRoiDraftByCameraId,
          [cameraId]: {
            x: config.fork_roi_x,
            y: config.fork_roi_y,
            width: config.fork_roi_width,
            height: config.fork_roi_height,
            imageWidth: config.fork_roi_image_width ?? undefined,
            imageHeight: config.fork_roi_image_height ?? undefined,
          },
        },
        loading: false,
      }))
    } catch (err: any) {
      set({
        loading: false,
        error: err.message ?? "fetchConfig failed",
      })
    }
  },

  setRoiDraft: (cameraId, patch) => {
    set((state) => {
      const prev =
        state.roiDraftByCameraId[cameraId] ?? {
          cx: 0,
          cy: 0,
          r: 100,
        }

      return {
        roiDraftByCameraId: {
          ...state.roiDraftByCameraId,
          [cameraId]: {
            ...prev,
            ...patch,
          },
        },
      }
    })
  },

  resetRoiDraftFromConfig: (cameraId) => {
    const config = get().configByCameraId[cameraId]
    if (!config) return

    set((state) => ({
      roiDraftByCameraId: {
        ...state.roiDraftByCameraId,
        [cameraId]: {
          cx: config.roi_center_x,
          cy: config.roi_center_y,
          r: config.roi_radius,
          imageWidth: config.roi_image_width ?? undefined,
          imageHeight: config.roi_image_height ?? undefined,
        },
      },
    }))
  },

  saveRoiDraft: async (cameraId: string) => {
    const draft = get().roiDraftByCameraId[cameraId]
    if (!draft) return

    set({
      saveRoiDraftLoading: true,
      error: null,
    })

    try {
      const roiPayload = {
        cx: Math.round(draft.cx),
        cy: Math.round(draft.cy),
        r: Math.max(1, Math.round(draft.r)),
      }

      await updateCameraRoi(cameraId, roiPayload)

      const updated = await updateCameraConfig(cameraId, {
        roi_center_x: roiPayload.cx,
        roi_center_y: roiPayload.cy,
        roi_radius: roiPayload.r,
        roi_image_width: draft.imageWidth,
        roi_image_height: draft.imageHeight,
      })

      set((state) => ({
        configByCameraId: {
          ...state.configByCameraId,
          [cameraId]: updated,
        },
      }))
    } catch (err: any) {
      set({
        error: err.message ?? "saveRoiDraft failed",
      })
      throw err
    } finally {
      set({
        saveRoiDraftLoading: false,
      })
    }
  },

  // ===== Fork ROI =====

  setForkRoiDraft: (cameraId, patch) => {
    set((state) => {
      const prev =
        state.forkRoiDraftByCameraId[cameraId] ?? {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        }

      return {
        forkRoiDraftByCameraId: {
          ...state.forkRoiDraftByCameraId,
          [cameraId]: {
            ...prev,
            ...patch,
          },
        },
      }
    })
  },

  resetForkRoiDraftFromConfig: (cameraId) => {
    const config = get().configByCameraId[cameraId]
    if (!config) return

    set((state) => ({
      forkRoiDraftByCameraId: {
        ...state.forkRoiDraftByCameraId,
        [cameraId]: {
          x: config.fork_roi_x,
          y: config.fork_roi_y,
          width: config.fork_roi_width,
          height: config.fork_roi_height,
          imageWidth: config.fork_roi_image_width ?? undefined,
          imageHeight: config.fork_roi_image_height ?? undefined,
        },
      },
    }))
  },

  saveForkRoiDraft: async (cameraId) => {
    const draft = get().forkRoiDraftByCameraId[cameraId]
    if (!draft) return

    set({
      saveForkRoiDraftLoading: true,
      error: null,
    })

    try {
      const payload = {
        fork_roi_x: Math.round(draft.x),
        fork_roi_y: Math.round(draft.y),
        fork_roi_width: Math.max(1, Math.round(draft.width)),
        fork_roi_height: Math.max(1, Math.round(draft.height)),
        fork_roi_image_width: draft.imageWidth,
        fork_roi_image_height: draft.imageHeight,
      }

      const updated = await updateCameraConfig(cameraId, payload)

      set((state) => ({
        configByCameraId: {
          ...state.configByCameraId,
          [cameraId]: updated,
        },
      }))
    } catch (err: any) {
      set({
        error: err.message ?? "saveForkRoiDraft failed",
      })
      throw err
    } finally {
      set({
        saveForkRoiDraftLoading: false,
      })
    }
  },

  updateThresholdConfig: async (cameraId, payload) => {
    const updated = await updateCameraConfig(cameraId, payload)

    set((state) => ({
      configByCameraId: {
        ...state.configByCameraId,
        [cameraId]: updated,
      },
    }))
  }
}))