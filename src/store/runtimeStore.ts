import { create } from "zustand"
import {
    getAllLiveStatus,
    getCameraStatus,
    startCamera as startCameraApi,
    stopCamera as stopCameraApi,
    updateSwitchDetection,
    subscribeCameraStatus,
} from "../api"
import type {
    DetectionArmStatus,
    HitPhase,
    LiveRuntimeStatus,
} from "../api/types"

const streamHandles: Record<string, { close: () => void } | undefined> = {}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

export type CameraRuntimeState = {
    // ===== 基本識別 =====
    cameraId: string

    // ===== runtime 狀態 =====
    enabled: boolean
    streamConnected: boolean
    workerRunning: boolean
    lastError?: string | null

    // ===== frame info =====
    lastFrameWidth?: number
    lastFrameHeight?: number
    lastFrameTimestampUs?: number

    // ===== ROI / 灰度 =====
    roiStable: boolean
    roiMean?: number
    roiDelta?: number
    lastRoiStableTime?: string

    // ===== flow / direction =====
    flowVy?: number                 // raw
    flowVySmooth?: number          // smooth
    flowMotionScore?: number
    currentDirection?: "IN" | "OUT" | "STABLE" | "UNKNOWN"

    // ===== wafer / session =====
    waferState?: string            // e.g. MOVING_IN / MOVING_OUT
    sessionStatus?: string         // e.g. MOVING_OUT
    currentWaferId?: string | null

    // ===== inspection =====
    inspectionCount?: number
    inInspectionCount?: number
    outInspectionCount?: number
    lastInspectionTime?: string
    lastTriggerTime?: string

    // ===== alignment =====
    alignmentOk?: boolean | null
    alignmentDetail?: boolean[] | null  // [p1, p2, p3, p4]

    // ===== switch detection =====
    switch_detection_enabled?: boolean
    nextHitPhase?: HitPhase
    detectionArmStatus?: DetectionArmStatus
    detectionCommandVersion?: number
    detectionAppliedVersion?: number
    pendingOutSessionIds?: number[]
}

type CameraStatusStreamState = {
    connected: boolean
    error?: string
}

type RuntimeStore = {
    runtimeByCameraId: Record<string, CameraRuntimeState>
    startingByCameraId: Record<string, boolean>
    stoppingByCameraId: Record<string, boolean>
    detectionUpdatingByCameraId: Record<string, boolean>
    statusStreamByCameraId: Record<string, CameraStatusStreamState | undefined>
    loading: boolean
    error: string | null

    setRuntime: (cameraId: string, patch: Partial<CameraRuntimeState>) => void
    fetchAllRuntime: () => Promise<void>
    fetchCameraRuntime: (cameraId: string) => Promise<void>
    startCamera: (
        cameraId: string,
        detection: { enabled: boolean; nextHitPhase: HitPhase },
    ) => Promise<void>
    stopCamera: (cameraId: string) => Promise<void>
    toggleSwitchDetection: (
        cameraId: string,
        enabled: boolean,
        nextHitPhase?: HitPhase,
    ) => Promise<void>

    startCameraStatusStream: (cameraId: string) => void
    stopCameraStatusStream: (cameraId: string) => void
    stopAllCameraStatusStreams: () => void
}

const initialRuntimeByCameraId: Record<string, CameraRuntimeState> = {}

function mapApiStatusToRuntimeState(item: LiveRuntimeStatus): CameraRuntimeState {
    return {
        // ===== basic =====
        cameraId: item.camera_id,

        // ===== runtime =====
        enabled: item.enabled ?? false,
        streamConnected: item.stream_connected ?? false,
        workerRunning: item.worker_running ?? false,
        lastError: item.last_error ?? null,

        // ===== frame =====
        lastFrameWidth: item.last_frame_width ?? undefined,
        lastFrameHeight: item.last_frame_height ?? undefined,
        lastFrameTimestampUs: item.last_frame_timestamp_us ?? undefined,

        // ===== ROI =====
        roiStable: item.roi_stable ?? false,
        roiMean: item.roi_gray_mean ?? undefined,
        roiDelta: item.roi_gray_delta ?? undefined,
        lastRoiStableTime: item.last_roi_stable_time ?? undefined,

        // ===== flow =====
        flowVy: item.flow_mean_vy ?? undefined,
        flowVySmooth: item.flow_vy_smooth ?? undefined,
        flowMotionScore: item.flow_motion_score ?? undefined,
        currentDirection: item.current_direction ?? "UNKNOWN",

        // ===== wafer / session =====
        waferState: item.wafer_state ?? undefined,
        sessionStatus: item.session_status ?? undefined,
        currentWaferId: item.current_wafer_id ?? null,

        // ===== inspection =====
        inspectionCount: item.inspection_count ?? 0,
        inInspectionCount: item.in_inspection_count ?? 0,
        outInspectionCount: item.out_inspection_count ?? 0,
        lastInspectionTime: item.last_inspection_time ?? undefined,
        lastTriggerTime: item.last_trigger_time ?? undefined,

        // ===== alignment =====
        alignmentOk: item.alignment_ok ?? null,
        alignmentDetail: item.alignment_detail ?? null,

        switch_detection_enabled: item.switch_detection_enabled ?? false,
        nextHitPhase: item.next_hit_phase ?? "IN",
        detectionArmStatus: item.detection_arm_status ?? "DISABLED",
        detectionCommandVersion: item.detection_command_version ?? 0,
        detectionAppliedVersion: item.detection_applied_version ?? 0,
        pendingOutSessionIds: item.pending_out_session_ids ?? [],
    }
}

export const useRuntimeStore = create<RuntimeStore>((set, get) => ({
    runtimeByCameraId: initialRuntimeByCameraId,
    startingByCameraId: {},
    stoppingByCameraId: {},
    detectionUpdatingByCameraId: {},
    statusStreamByCameraId: {},
    loading: false,
    error: null,

    setRuntime: (cameraId, patch) => {
        set((state) => ({
            runtimeByCameraId: {
                ...state.runtimeByCameraId,
                [cameraId]: {
                    ...state.runtimeByCameraId[cameraId],
                    ...patch,
                },
            },
        }))
    },

    fetchAllRuntime: async () => {
        set({ loading: true, error: null })

        try {
            const list = await getAllLiveStatus()

            set((state) => {
                const next = { ...state.runtimeByCameraId }

                for (const item of list) {
                    next[item.camera_id] = {
                        ...next[item.camera_id],
                        ...mapApiStatusToRuntimeState(item),
                    }
                }

                return {
                    runtimeByCameraId: next,
                    loading: false,
                }
            })
        } catch (err: unknown) {
            set({
                loading: false,
                error: getErrorMessage(err, "fetchAllRuntime failed"),
            })
        }
    },

    fetchCameraRuntime: async (cameraId) => {
        try {
            const item = await getCameraStatus(cameraId)

            set((state) => ({
                runtimeByCameraId: {
                    ...state.runtimeByCameraId,
                    [cameraId]: {
                        ...state.runtimeByCameraId[cameraId],
                        ...mapApiStatusToRuntimeState(item),
                    },
                },
            }))
        } catch (err: unknown) {
            set({
                error: getErrorMessage(err, "fetchCameraRuntime failed"),
            })
        }
    },

    startCamera: async (cameraId, detection) => {
        set((state) => ({
            startingByCameraId: {
                ...state.startingByCameraId,
                [cameraId]: true,
            },
            error: null,
        }))

        try {
            const currentRuntime = get().runtimeByCameraId[cameraId]

            if (
                detection.enabled &&
                currentRuntime?.switch_detection_enabled &&
                currentRuntime.nextHitPhase !== detection.nextHitPhase
            ) {
                await updateSwitchDetection(cameraId, { enabled: false })
            }

            const detectionResponse = await updateSwitchDetection(cameraId, {
                enabled: detection.enabled,
                next_hit_phase: detection.enabled
                    ? detection.nextHitPhase
                    : undefined,
            })

            set((state) => ({
                runtimeByCameraId: {
                    ...state.runtimeByCameraId,
                    [cameraId]: {
                        ...state.runtimeByCameraId[cameraId],
                        switch_detection_enabled:
                            detectionResponse.switch_detection_enabled,
                        nextHitPhase: detectionResponse.next_hit_phase,
                        detectionArmStatus:
                            detectionResponse.detection_arm_status,
                        detectionCommandVersion:
                            detectionResponse.detection_command_version,
                        detectionAppliedVersion:
                            detectionResponse.detection_applied_version,
                    },
                },
            }))

            await startCameraApi(cameraId)
            await get().fetchCameraRuntime(cameraId)
        } catch (err: unknown) {
            set({
                error: getErrorMessage(err, "startCamera failed"),
            })
            throw err
        } finally {
            set((state) => ({
                startingByCameraId: {
                    ...state.startingByCameraId,
                    [cameraId]: false,
                },
            }))
        }
    },

    stopCamera: async (cameraId) => {
        set((state) => ({
            stoppingByCameraId: {
                ...state.stoppingByCameraId,
                [cameraId]: true,
            },
            error: null,
        }))

        try {
            await stopCameraApi(cameraId)
            await get().fetchCameraRuntime(cameraId)
        } catch (err: unknown) {
            set({
                error: getErrorMessage(err, "stopCamera failed"),
            })
        } finally {
            set((state) => ({
                stoppingByCameraId: {
                    ...state.stoppingByCameraId,
                    [cameraId]: false,
                },
            }))
        }
    },
    toggleSwitchDetection: async (cameraId, enabled, nextHitPhase) => {
        set((state) => ({
            detectionUpdatingByCameraId: {
                ...state.detectionUpdatingByCameraId,
                [cameraId]: true,
            },
            error: null,
        }))

        try {
            const response = await updateSwitchDetection(cameraId, {
                enabled,
                next_hit_phase: enabled ? nextHitPhase : undefined,
            })

            set((state) => ({
                runtimeByCameraId: {
                    ...state.runtimeByCameraId,
                    [cameraId]: {
                        ...state.runtimeByCameraId[cameraId],
                        switch_detection_enabled:
                            response.switch_detection_enabled,
                        nextHitPhase: response.next_hit_phase,
                        detectionArmStatus: response.detection_arm_status,
                        detectionCommandVersion:
                            response.detection_command_version,
                        detectionAppliedVersion:
                            response.detection_applied_version,
                        ...(enabled
                            ? {}
                            : {
                                currentWaferId: null,
                                waferState: undefined,
                                sessionStatus: undefined,
                                alignmentOk: null,
                                alignmentDetail: null,
                            }),
                    },
                },
            }))
        } catch (err: unknown) {
            set({
                error: getErrorMessage(err, "update switch detection failed"),
            })
            throw err
        } finally {
            set((state) => ({
                detectionUpdatingByCameraId: {
                    ...state.detectionUpdatingByCameraId,
                    [cameraId]: false,
                },
            }))
        }
    },
    
    startCameraStatusStream: (cameraId) => {
        const closedIds = Object.keys(streamHandles).filter((id) => id !== cameraId)

        for (const id of closedIds) {
            streamHandles[id]?.close()
            delete streamHandles[id]
        }

        set((state) => {
            const nextStreamState = { ...state.statusStreamByCameraId }

            for (const id of closedIds) {
                nextStreamState[id] = {
                    connected: false,
                    error: undefined,
                }
            }

            if (!nextStreamState[cameraId]) {
                nextStreamState[cameraId] = {
                    connected: false,
                    error: undefined,
                }
            }

            return {
                statusStreamByCameraId: nextStreamState,
            }
        })

        if (streamHandles[cameraId]) {
            return
        }

        const handle = subscribeCameraStatus(cameraId, {
            onOpen: () => {
                set((state) => ({
                    statusStreamByCameraId: {
                        ...state.statusStreamByCameraId,
                        [cameraId]: {
                            connected: true,
                            error: undefined,
                        },
                    },
                }))
            },

            onMessage: (item) => {
                const mapped = mapApiStatusToRuntimeState(item)

                set((state) => ({
                    runtimeByCameraId: {
                        ...state.runtimeByCameraId,
                        [cameraId]: {
                            ...state.runtimeByCameraId[cameraId],
                            ...mapped,
                        },
                    },
                    statusStreamByCameraId: {
                        ...state.statusStreamByCameraId,
                        [cameraId]: {
                            connected: true,
                            error: undefined,
                        },
                    },
                }))
            },

            onError: () => {
                set((state) => ({
                    statusStreamByCameraId: {
                        ...state.statusStreamByCameraId,
                        [cameraId]: {
                            connected: false,
                            error: "stream disconnected",
                        },
                    },
                }))
            },
        })

        streamHandles[cameraId] = handle
    },

    stopCameraStatusStream: (cameraId) => {
        streamHandles[cameraId]?.close()
        delete streamHandles[cameraId]

        set((state) => ({
            statusStreamByCameraId: {
                ...state.statusStreamByCameraId,
                [cameraId]: {
                    connected: false,
                    error: undefined,
                },
            },
        }))
    },

    stopAllCameraStatusStreams: () => {
        for (const cameraId of Object.keys(streamHandles)) {
            streamHandles[cameraId]?.close()
            delete streamHandles[cameraId]
        }

        set(() => ({
            statusStreamByCameraId: {},
        }))
    },
}))
