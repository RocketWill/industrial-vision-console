import { create } from "zustand";

export type CameraStreamItemConfig = {
  enabled: boolean;
  name: string;
  url: string;
  room: string;
};

type Store = {
  configByCameraId: Record<string, CameraStreamItemConfig>;
  setConfig: (cameraId: string, patch: Partial<CameraStreamItemConfig>) => void;
  resetConfig: (cameraId: string) => void;
};

export const defaultCameraStreamConfig: CameraStreamItemConfig = {
  enabled: false,
  name: "",
  url: "",
  room: "",
};

const STORAGE_KEY = "vc_camera_stream_config";

function load(): Record<string, CameraStreamItemConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function save(data: Record<string, CameraStreamItemConfig>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useCameraStreamConfigStore = create<Store>((set) => ({
  configByCameraId: load(),

  setConfig: (cameraId, patch) => {
    set((state) => {
      const current =
        state.configByCameraId[cameraId] ?? {
          ...defaultCameraStreamConfig,
          name: cameraId,
        };

      const next = {
        ...state.configByCameraId,
        [cameraId]: {
          ...current,
          ...patch,
        },
      };

      save(next);
      return { configByCameraId: next };
    });
  },

  resetConfig: (cameraId) => {
    set((state) => {
      const next = {
        ...state.configByCameraId,
        [cameraId]: {
          ...defaultCameraStreamConfig,
          name: cameraId,
        },
      };

      save(next);
      return { configByCameraId: next };
    });
  },
}));