import { create } from "zustand"
import { getWaferEllipse, saveWaferEllipse } from "../api/waferEllipse"
import type { WaferEllipseConfig } from "../types/waferEllipse"

type WaferEllipseStore = {
  configByCameraId: Record<string, WaferEllipseConfig | undefined>
  saveLoading: boolean

  fetchConfig: (cameraId: string) => Promise<void>
  setConfig: (cameraId: string, config: WaferEllipseConfig) => void
  saveConfig: (cameraId: string) => Promise<void>
  clearConfig: (cameraId: string) => void
}

export const useWaferEllipseStore = create<WaferEllipseStore>((set, get) => ({
  configByCameraId: {},
  saveLoading: false,

  async fetchConfig(cameraId) {
    const res = await getWaferEllipse(cameraId)
    set((state) => ({
      configByCameraId: {
        ...state.configByCameraId,
        [cameraId]: res.json_data,
      },
    }))
  },

  setConfig(cameraId, config) {
    set((state) => ({
      configByCameraId: {
        ...state.configByCameraId,
        [cameraId]: config,
      },
    }))
  },

  async saveConfig(cameraId) {
    const config = get().configByCameraId[cameraId]
    if (!config) {
      throw new Error("wafer ellipse config is empty")
    }

    set({
      saveLoading: true,
    })

    try {
      const res = await saveWaferEllipse(cameraId, {
        json_data: config,
      })

      set((state) => ({
        configByCameraId: {
          ...state.configByCameraId,
          [cameraId]: res.json_data,
        },
      }))
    } finally {
      set({
        saveLoading: false,
      })
    }
  },

  clearConfig(cameraId) {
    set((state) => ({
      configByCameraId: {
        ...state.configByCameraId,
        [cameraId]: undefined,
      },
    }))
  },
}))