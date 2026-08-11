import { create } from "zustand"
import {
  deleteForkMatchConfig,
  getForkMatchConfig,
  saveForkMatchConfig,
} from "../api/forkMatchConfig"
import type {
  ForkMatchConfig,
  ForkMatchConfigDraft,
  ForkMatchConfigUpdate,
} from "../types/forkMatchConfig"

function createEmptyForkMatchDraft(): ForkMatchConfigDraft {
  return {
    version: 1,
    cv_params: {},
    extra_params: {},
    target_roi: null,
    template_roi: null,
    target_masks: [],
    template_masks: [],
  }
}

function createForkMatchDraftFromConfig(
  config: ForkMatchConfig | null | undefined,
): ForkMatchConfigDraft {
  if (!config) return createEmptyForkMatchDraft()

  return {
    version: config.version ?? 1,
    cv_params: config.cv_params ?? {},
    extra_params: config.extra_params ?? {},
    target_roi: config.target_roi ?? null,
    template_roi: config.template_roi ?? null,
    target_masks: config.target_masks ?? [],
    template_masks: config.template_masks ?? [],
  }
}

function buildForkMatchPayloadFromDraft(
  draft: ForkMatchConfigDraft,
): ForkMatchConfigUpdate {
  const payload: ForkMatchConfigUpdate = {}

  if (draft.version !== undefined) {
    payload.version = draft.version
  }

  payload.cv_params = draft.cv_params
  payload.extra_params = draft.extra_params

  if (draft.target_roi) {
    payload.target_roi = draft.target_roi
  }

  if (draft.template_roi) {
    payload.template_roi = draft.template_roi
  }

  payload.target_masks = draft.target_masks
  payload.template_masks = draft.template_masks

  return payload
}

type ForkMatchConfigStore = {
  forkMatchConfigByCameraId: Record<string, ForkMatchConfig | null | undefined>
  forkMatchDraftByCameraId: Record<string, ForkMatchConfigDraft | undefined>

  loadingByCameraId: Record<string, boolean>
  savingByCameraId: Record<string, boolean>
  deletingByCameraId: Record<string, boolean>
  errorByCameraId: Record<string, string | undefined>

  fetchForkMatchConfig: (cameraId: string) => Promise<void>
  setForkMatchDraft: (cameraId: string, draft: ForkMatchConfigDraft) => void
  patchForkMatchDraft: (
    cameraId: string,
    patch: Partial<ForkMatchConfigDraft>,
  ) => void
  resetForkMatchDraftFromConfig: (cameraId: string) => void
  saveForkMatchDraft: (cameraId: string) => Promise<void>
  removeForkMatchConfig: (cameraId: string) => Promise<void>
}

export const useForkMatchConfigStore = create<ForkMatchConfigStore>(
  (set, get) => ({
    forkMatchConfigByCameraId: {},
    forkMatchDraftByCameraId: {},

    loadingByCameraId: {},
    savingByCameraId: {},
    deletingByCameraId: {},
    errorByCameraId: {},

    async fetchForkMatchConfig(cameraId) {
      set((state) => ({
        loadingByCameraId: {
          ...state.loadingByCameraId,
          [cameraId]: true,
        },
        errorByCameraId: {
          ...state.errorByCameraId,
          [cameraId]: undefined,
        },
      }))

      try {
        const config = await getForkMatchConfig(cameraId)

        set((state) => ({
          forkMatchConfigByCameraId: {
            ...state.forkMatchConfigByCameraId,
            [cameraId]: config,
          },
          forkMatchDraftByCameraId: {
            ...state.forkMatchDraftByCameraId,
            [cameraId]: createForkMatchDraftFromConfig(config),
          },
        }))
      } catch (error) {
        set((state) => ({
          errorByCameraId: {
            ...state.errorByCameraId,
            [cameraId]:
              error instanceof Error
                ? error.message
                : "fetch fork match config failed",
          },
        }))
      } finally {
        set((state) => ({
          loadingByCameraId: {
            ...state.loadingByCameraId,
            [cameraId]: false,
          },
        }))
      }
    },

    setForkMatchDraft(cameraId, draft) {
      set((state) => ({
        forkMatchDraftByCameraId: {
          ...state.forkMatchDraftByCameraId,
          [cameraId]: draft,
        },
      }))
    },

    patchForkMatchDraft(cameraId, patch) {
      const currentDraft =
        get().forkMatchDraftByCameraId[cameraId] ??
        createEmptyForkMatchDraft()

      set((state) => ({
        forkMatchDraftByCameraId: {
          ...state.forkMatchDraftByCameraId,
          [cameraId]: {
            ...currentDraft,
            ...patch,
          },
        },
      }))
    },

    resetForkMatchDraftFromConfig(cameraId) {
      const config = get().forkMatchConfigByCameraId[cameraId]

      set((state) => ({
        forkMatchDraftByCameraId: {
          ...state.forkMatchDraftByCameraId,
          [cameraId]: createForkMatchDraftFromConfig(config),
        },
      }))
    },

    async saveForkMatchDraft(cameraId) {
      const draft = get().forkMatchDraftByCameraId[cameraId]
      if (!draft) return

      set((state) => ({
        savingByCameraId: {
          ...state.savingByCameraId,
          [cameraId]: true,
        },
        errorByCameraId: {
          ...state.errorByCameraId,
          [cameraId]: undefined,
        },
      }))

      try {
        const saved = await saveForkMatchConfig(
          cameraId,
          buildForkMatchPayloadFromDraft(draft),
        )

        set((state) => ({
          forkMatchConfigByCameraId: {
            ...state.forkMatchConfigByCameraId,
            [cameraId]: saved,
          },
          forkMatchDraftByCameraId: {
            ...state.forkMatchDraftByCameraId,
            [cameraId]: createForkMatchDraftFromConfig(saved),
          },
        }))
      } catch (error) {
        set((state) => ({
          errorByCameraId: {
            ...state.errorByCameraId,
            [cameraId]:
              error instanceof Error
                ? error.message
                : "save fork match config failed",
          },
        }))
      } finally {
        set((state) => ({
          savingByCameraId: {
            ...state.savingByCameraId,
            [cameraId]: false,
          },
        }))
      }
    },

    async removeForkMatchConfig(cameraId) {
      set((state) => ({
        deletingByCameraId: {
          ...state.deletingByCameraId,
          [cameraId]: true,
        },
        errorByCameraId: {
          ...state.errorByCameraId,
          [cameraId]: undefined,
        },
      }))

      try {
        await deleteForkMatchConfig(cameraId)

        set((state) => ({
          forkMatchConfigByCameraId: {
            ...state.forkMatchConfigByCameraId,
            [cameraId]: null,
          },
          forkMatchDraftByCameraId: {
            ...state.forkMatchDraftByCameraId,
            [cameraId]: createEmptyForkMatchDraft(),
          },
        }))
      } catch (error) {
        set((state) => ({
          errorByCameraId: {
            ...state.errorByCameraId,
            [cameraId]:
              error instanceof Error
                ? error.message
                : "delete fork match config failed",
          },
        }))
      } finally {
        set((state) => ({
          deletingByCameraId: {
            ...state.deletingByCameraId,
            [cameraId]: false,
          },
        }))
      }
    },
  }),
)