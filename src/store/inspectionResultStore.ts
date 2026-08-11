import { create } from "zustand"
import { getInspectionResults } from "../api/inspectionResults"
import type {
  InspectionResultItem,
  InspectionResultQuery,
} from "../types/inspectionResult"

type QueryState = {
  startTime?: string
  endTime?: string
  offset: number
  limit: number
  sortBy: string
  order: "asc" | "desc"
}

type PreviewKind = "original" | "overlay"

type CameraHistoryState = {
  items: InspectionResultItem[]
  total: number
  loading: boolean
  error?: string
  selectedRowId?: number
  query: QueryState
  previewVisible: boolean
  previewKind?: PreviewKind
}

type InspectionResultStore = {
  byCameraId: Record<string, CameraHistoryState | undefined>

  ensureCameraState: (cameraId: string) => void
  setTimeRange: (cameraId: string, startTime?: string, endTime?: string) => void
  setPagination: (cameraId: string, offset: number, limit: number) => void
  setSort: (
    cameraId: string,
    sortBy: string,
    order: "asc" | "desc"
  ) => void
  setSelectedRowId: (cameraId: string, rowId?: number) => void

  openPreview: (cameraId: string, kind: PreviewKind) => void
  closePreview: (cameraId: string) => void

  fetchResults: (cameraId: string) => Promise<void>
}

function createDefaultState(): CameraHistoryState {
  return {
    items: [],
    total: 0,
    loading: false,
    error: undefined,
    selectedRowId: undefined,
    query: {
      offset: 0,
      limit: 20,
      sortBy: "inspection_time",
      order: "desc",
    },
    previewVisible: false,
    previewKind: undefined,
  }
}

export const useInspectionResultStore = create<InspectionResultStore>(
  (set, get) => ({
    byCameraId: {},

    ensureCameraState(cameraId) {
      const state = get().byCameraId[cameraId]
      if (state) return

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: createDefaultState(),
        },
      }))
    },

    setTimeRange(cameraId, startTime, endTime) {
      get().ensureCameraState(cameraId)

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            query: {
              ...s.byCameraId[cameraId]!.query,
              startTime,
              endTime,
              offset: 0,
            },
          },
        },
      }))
    },

    setPagination(cameraId, offset, limit) {
      get().ensureCameraState(cameraId)

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            query: {
              ...s.byCameraId[cameraId]!.query,
              offset,
              limit,
            },
          },
        },
      }))
    },

    setSort(cameraId, sortBy, order) {
      get().ensureCameraState(cameraId)

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            query: {
              ...s.byCameraId[cameraId]!.query,
              sortBy,
              order,
              offset: 0,
            },
          },
        },
      }))
    },

    setSelectedRowId(cameraId, rowId) {
      get().ensureCameraState(cameraId)

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            selectedRowId: rowId,
          },
        },
      }))
    },

    openPreview(cameraId, kind) {
      get().ensureCameraState(cameraId)

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            previewVisible: true,
            previewKind: kind,
          },
        },
      }))
    },

    closePreview(cameraId) {
      get().ensureCameraState(cameraId)

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            previewVisible: false,
          },
        },
      }))
    },

    async fetchResults(cameraId) {
      get().ensureCameraState(cameraId)
      const cameraState = get().byCameraId[cameraId]!

      const query: InspectionResultQuery = {
        camera_id: cameraId,
        start_time: cameraState.query.startTime,
        end_time: cameraState.query.endTime,
        offset: cameraState.query.offset,
        limit: cameraState.query.limit,
        sort_by: cameraState.query.sortBy,
        order: cameraState.query.order,
      }

      set((s) => ({
        byCameraId: {
          ...s.byCameraId,
          [cameraId]: {
            ...s.byCameraId[cameraId]!,
            loading: true,
            error: undefined,
          },
        },
      }))

      try {
        const res = await getInspectionResults(query)

        set((s) => {
          const prev = s.byCameraId[cameraId]!
          const nextItems = res.items
          const hasSelected =
            prev.selectedRowId != null &&
            nextItems.some((item) => item.id === prev.selectedRowId)

          const nextSelectedRowId =
            hasSelected || nextItems.length === 0
              ? prev.selectedRowId
              : nextItems[0].id

          return {
            byCameraId: {
              ...s.byCameraId,
              [cameraId]: {
                ...prev,
                items: nextItems,
                total: res.total,
                loading: false,
                selectedRowId: nextSelectedRowId,
              },
            },
          }
        })
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "fetch inspection results failed"

        set((s) => ({
          byCameraId: {
            ...s.byCameraId,
            [cameraId]: {
              ...s.byCameraId[cameraId]!,
              loading: false,
              error: message,
            },
          },
        }))
      }
    },
  })
)