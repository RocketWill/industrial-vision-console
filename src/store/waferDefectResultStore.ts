import { create } from "zustand"
import { fetchWaferDefectResults } from "../api/waferDefectResults"
import type {
  WaferDefectProcessingStatus,
  WaferDefectResult,
  WaferDefectResultValue,
} from "../types/waferDefectResult"

const SORTABLE_FIELDS = new Set([
  "id",
  "wafer_session_id",
  "wafer_id",
  "camera_id",
  "snapshot_index",
  "snapshot_timestamp_us",
  "processing_status",
  "result",
  "severity_score",
  "created_at",
  "updated_at",
])

function normalizeSortBy(sortBy: string) {
  return SORTABLE_FIELDS.has(sortBy) ? sortBy : "created_at"
}

type DefectQueryState = {
  waferId?: string
  processingStatus?: WaferDefectProcessingStatus
  result?: WaferDefectResultValue
  startTime?: string
  endTime?: string
  offset: number
  limit: number
  sortBy: string
  order: "asc" | "desc"
}

type CameraDefectState = {
  items: WaferDefectResult[]
  total: number
  loading: boolean
  error?: string
  selectedRowId?: number
  query: DefectQueryState
}

type WaferDefectResultStore = {
  byCameraId: Record<string, CameraDefectState | undefined>
  ensureCameraState: (cameraId: string) => void
  setTimeRange: (cameraId: string, startTime?: string, endTime?: string) => void
  setFilters: (
    cameraId: string,
    filters: Pick<DefectQueryState, "waferId" | "processingStatus" | "result">,
  ) => void
  clearFilters: (cameraId: string) => void
  setPagination: (cameraId: string, offset: number, limit: number) => void
  setSort: (
    cameraId: string,
    sortBy: string,
    order: "asc" | "desc",
  ) => void
  setSelectedRowId: (cameraId: string, selectedRowId?: number) => void
  fetchResults: (cameraId: string) => Promise<void>
}

function createDefaultState(): CameraDefectState {
  return {
    items: [],
    total: 0,
    loading: false,
    query: {
      offset: 0,
      limit: 20,
      sortBy: "created_at",
      order: "desc",
    },
  }
}

export const useWaferDefectResultStore = create<WaferDefectResultStore>(
  (set, get) => {
    const updateCameraState = (
      cameraId: string,
      update: (state: CameraDefectState) => CameraDefectState,
    ) => {
      set((state) => ({
        byCameraId: {
          ...state.byCameraId,
          [cameraId]: update(
            state.byCameraId[cameraId] ?? createDefaultState(),
          ),
        },
      }))
    }

    return {
      byCameraId: {},

      ensureCameraState(cameraId) {
        if (get().byCameraId[cameraId]) return
        updateCameraState(cameraId, (state) => state)
      },

      setTimeRange(cameraId, startTime, endTime) {
        updateCameraState(cameraId, (state) => ({
          ...state,
          query: { ...state.query, startTime, endTime, offset: 0 },
        }))
      },

      setFilters(cameraId, filters) {
        updateCameraState(cameraId, (state) => ({
          ...state,
          query: { ...state.query, ...filters, offset: 0 },
        }))
      },

      clearFilters(cameraId) {
        updateCameraState(cameraId, (state) => ({
          ...state,
          query: {
            ...state.query,
            waferId: undefined,
            processingStatus: undefined,
            result: undefined,
            startTime: undefined,
            endTime: undefined,
            offset: 0,
          },
        }))
      },

      setPagination(cameraId, offset, limit) {
        updateCameraState(cameraId, (state) => ({
          ...state,
          query: { ...state.query, offset, limit },
        }))
      },

      setSort(cameraId, sortBy, order) {
        updateCameraState(cameraId, (state) => ({
          ...state,
          query: {
            ...state.query,
            sortBy: normalizeSortBy(sortBy),
            order,
            offset: 0,
          },
        }))
      },

      setSelectedRowId(cameraId, selectedRowId) {
        updateCameraState(cameraId, (state) => ({ ...state, selectedRowId }))
      },

      async fetchResults(cameraId) {
        const cameraState = get().byCameraId[cameraId] ?? createDefaultState()
        const { query } = cameraState

        updateCameraState(cameraId, (state) => ({
          ...state,
          loading: true,
          error: undefined,
        }))

        try {
          const response = await fetchWaferDefectResults({
            camera_id: cameraId,
            wafer_id: query.waferId,
            processing_status: query.processingStatus,
            result: query.result,
            start_time: query.startTime,
            end_time: query.endTime,
            offset: query.offset,
            limit: query.limit,
            sort_by: normalizeSortBy(query.sortBy),
            order: query.order,
          })

          updateCameraState(cameraId, (state) => {
            const selectionStillExists = response.items.some(
              (item) => item.id === state.selectedRowId,
            )
            return {
              ...state,
              items: response.items,
              total: response.total,
              loading: false,
              selectedRowId: selectionStillExists
                ? state.selectedRowId
                : response.items[0]?.id,
            }
          })
        } catch (error) {
          updateCameraState(cameraId, (state) => ({
            ...state,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "fetch wafer defect results failed",
          }))
        }
      },
    }
  },
)
