import { create } from "zustand";

export type ViewTransformApi = {
  fit: () => void;
  reset: () => void;
  set100: () => void;
};

type Store = {
  apiByCameraId: Record<string, ViewTransformApi>;
  setApi: (cameraId: string, api: ViewTransformApi) => void;
};

export const useViewTransformStore = create<Store>((set) => ({
  apiByCameraId: {},

  setApi: (cameraId, api) =>
    set((state) => ({
      apiByCameraId: {
        ...state.apiByCameraId,
        [cameraId]: api,
      },
    })),
}));