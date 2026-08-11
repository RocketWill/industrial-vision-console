import { create } from "zustand"

export type ViewerState = {
  showWaferRoi: boolean
  showForkRoi: boolean
}

export const defaultViewerState: ViewerState = {
  showWaferRoi: true,
  showForkRoi: true
}

type ViewerStore = {
  viewerByCameraId: Record<string, ViewerState>
  patchViewerState: (cameraId: string, patch: Partial<ViewerState>) => void
  resetViewerState: (cameraId: string) => void
}

export const useViewerStore = create<ViewerStore>((set) => ({
  viewerByCameraId: {},

  patchViewerState: (cameraId, patch) => {
    set((state) => {
      const current = state.viewerByCameraId[cameraId] ?? defaultViewerState

      return {
        viewerByCameraId: {
          ...state.viewerByCameraId,
          [cameraId]: {
            ...current,
            ...patch,
          },
        },
      }
    })
  },

  resetViewerState: (cameraId) => {
    set((state) => ({
      viewerByCameraId: {
        ...state.viewerByCameraId,
        [cameraId]: { ...defaultViewerState },
      },
    }))
  },
}))