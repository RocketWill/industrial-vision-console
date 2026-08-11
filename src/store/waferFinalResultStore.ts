import { create } from "zustand"

import {
    fetchWaferFinalResults,
    type WaferFinalResult,
} from "../api/waferFinalResults"

type FinalResultSortOrder = "asc" | "desc"

type CameraWaferFinalState = {
    items: WaferFinalResult[]
    total: number
    offset: number
    limit: number
    sortBy: string
    order: FinalResultSortOrder
    loading: boolean
    startTime?: string
    endTime?: string
}

type WaferFinalResultStore = {
    byCameraId: Record<string, CameraWaferFinalState | undefined>

    ensureCameraState: (cameraId: string) => void
    setPagination: (cameraId: string, offset: number, limit: number) => void
    setSort: (
        cameraId: string,
        sortBy: string,
        order: FinalResultSortOrder,
    ) => void
    fetchResults: (cameraId: string) => Promise<void>
    setTimeRange: (cameraId: string, startTime?: string, endTime?: string) => void
}

const createDefaultCameraState = (): CameraWaferFinalState => ({
    items: [],
    total: 0,
    offset: 0,
    limit: 20,
    sortBy: "last_time",
    order: "desc",
    loading: false,
})

export const useWaferFinalResultStore = create<WaferFinalResultStore>(
    (set, get) => ({
        byCameraId: {},

        ensureCameraState: (cameraId) => {
            const existing = get().byCameraId[cameraId]
            if (existing) return

            set((state) => ({
                byCameraId: {
                    ...state.byCameraId,
                    [cameraId]: createDefaultCameraState(),
                },
            }))
        },

        setPagination: (cameraId, offset, limit) => {
            const existing =
                get().byCameraId[cameraId] ?? createDefaultCameraState()

            set((state) => ({
                byCameraId: {
                    ...state.byCameraId,
                    [cameraId]: {
                        ...existing,
                        offset,
                        limit,
                    },
                },
            }))
        },

        setSort: (cameraId, sortBy, order) => {
            const existing =
                get().byCameraId[cameraId] ?? createDefaultCameraState()

            set((state) => ({
                byCameraId: {
                    ...state.byCameraId,
                    [cameraId]: {
                        ...existing,
                        sortBy,
                        order,
                        offset: 0,
                    },
                },
            }))
        },

        fetchResults: async (cameraId) => {
            const existing =
                get().byCameraId[cameraId] ?? createDefaultCameraState()

            set((state) => ({
                byCameraId: {
                    ...state.byCameraId,
                    [cameraId]: {
                        ...existing,
                        loading: true,
                    },
                },
            }))

            try {
                const data = await fetchWaferFinalResults({
                    camera_id: cameraId,
                    offset: existing.offset,
                    limit: existing.limit,
                    sort_by: existing.sortBy,
                    order: existing.order,
                    start_time: existing.startTime,
                    end_time: existing.endTime,
                })
                set((state) => ({
                    byCameraId: {
                        ...state.byCameraId,
                        [cameraId]: {
                            ...existing,
                            items: data.items,
                            total: data.total,
                            loading: false,
                        },
                    },
                }))
            } catch (error) {
                console.error("[waferFinalResultStore] fetchResults failed", error)

                set((state) => ({
                    byCameraId: {
                        ...state.byCameraId,
                        [cameraId]: {
                            ...existing,
                            loading: false,
                        },
                    },
                }))
            }
        },
        setTimeRange: (cameraId, startTime, endTime) => {
            const existing = get().byCameraId[cameraId] ?? createDefaultCameraState()

            set((state) => ({
                byCameraId: {
                    ...state.byCameraId,
                    [cameraId]: {
                        ...existing,
                        startTime,
                        endTime,
                        offset: 0, // 時間變了要回第一頁
                    },
                },
            }))
        },
    }),
)