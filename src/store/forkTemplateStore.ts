import { create } from "zustand"
import type { ForkTemplateInfo, RefPoint } from "../types/forkTemplate"
import {
    getForkTemplate,
    uploadForkTemplateImage,
    saveForkTemplate,
    deleteForkTemplate,
} from "../api/forkTemplate"

type Crop = {
    x: number
    y: number
    width: number
    height: number
}

type Draft = {
    sourceImageUrl?: string
    templateImageUrl?: string
    previewImageUrl?: string
    crop?: Crop
    refPoints: RefPoint[]
    matchScoreThreshold: number
    houghVotesThreshold: number
    enabled: boolean
}

type Store = {
    templateByCameraId: Record<string, ForkTemplateInfo | undefined>
    draftByCameraId: Record<string, Draft | undefined>

    fetchTemplate: (cameraId: string) => Promise<void>
    uploadImage: (cameraId: string, file: File) => Promise<void>

    setCrop: (cameraId: string, crop: Crop) => void
    setRefPoints: (cameraId: string, points: RefPoint[]) => void
    setThreshold: (cameraId: string, v: number) => void
    setHoughVotesThreshold: (cameraId: string, v: number) => void
    setEnabled: (cameraId: string, v: boolean) => void

    resetDraftFromTemplate: (cameraId: string) => void
    clearPoints: (cameraId: string) => void

    save: (cameraId: string) => Promise<void>
    remove: (cameraId: string) => Promise<void>
}

function toDraft(template?: ForkTemplateInfo): Draft | undefined {
    if (!template) return undefined

    return {
        sourceImageUrl: template.source_image_path ?? undefined,
        templateImageUrl: template.template_image_path ?? undefined,
        previewImageUrl: template.preview_image_path ?? undefined,
        crop: {
            x: template.crop_x ?? 0,
            y: template.crop_y ?? 0,
            width: template.crop_width ?? 0,
            height: template.crop_height ?? 0,
        },
        refPoints: (template.ref_points ?? []).map((p) => ({
            x: (template.crop_x ?? 0) + p.x,
            y: (template.crop_y ?? 0) + p.y,
            label: p.label,
        })),
        matchScoreThreshold: template.match_score_threshold ?? 0.7,
        houghVotesThreshold: template.hough_votes_threshold ?? 50,
        enabled: template.enabled ?? true,
    }
}

export const useForkTemplateStore = create<Store>((set, get) => ({
    templateByCameraId: {},
    draftByCameraId: {},

    async fetchTemplate(cameraId) {
        const res = await getForkTemplate(cameraId)

        set((s) => ({
            templateByCameraId: {
                ...s.templateByCameraId,
                [cameraId]: res,
            },
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: toDraft(res),
            },
        }))
    },

    async uploadImage(cameraId, file) {
        await uploadForkTemplateImage(cameraId, file)
        await get().fetchTemplate(cameraId)
    },

    setCrop(cameraId, crop) {
        set((s) => ({
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: {
                    ...s.draftByCameraId[cameraId],
                    refPoints: s.draftByCameraId[cameraId]?.refPoints ?? [],
                    houghVotesThreshold:
                        s.draftByCameraId[cameraId]?.houghVotesThreshold ?? 50,
                    matchScoreThreshold:
                        s.draftByCameraId[cameraId]?.matchScoreThreshold ?? 0.7,
                    enabled: s.draftByCameraId[cameraId]?.enabled ?? true,
                    crop,
                },
            },
        }))
    },

    setRefPoints(cameraId, points) {
        set((s) => ({
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: {
                    ...s.draftByCameraId[cameraId],
                    crop: s.draftByCameraId[cameraId]?.crop,
                    houghVotesThreshold:
                        s.draftByCameraId[cameraId]?.houghVotesThreshold ?? 50,
                    matchScoreThreshold:
                        s.draftByCameraId[cameraId]?.matchScoreThreshold ?? 0.7,
                    enabled: s.draftByCameraId[cameraId]?.enabled ?? true,
                    refPoints: points,
                },
            },
        }))
    },

    setThreshold(cameraId, v) {
        set((s) => {
            const prev = s.draftByCameraId[cameraId]

            return {
                draftByCameraId: {
                    ...s.draftByCameraId,
                    [cameraId]: {
                        ...prev,
                        crop: prev?.crop,
                        refPoints: prev?.refPoints ?? [],
                        houghVotesThreshold: prev?.houghVotesThreshold ?? 50,
                        enabled: prev?.enabled ?? true,
                        matchScoreThreshold: v,
                    },
                },
            }
        })
    },

    setHoughVotesThreshold(cameraId, v) {
        set((s) => {
            const prev = s.draftByCameraId[cameraId]

            return {
                draftByCameraId: {
                    ...s.draftByCameraId,
                    [cameraId]: {
                        ...prev,
                        crop: prev?.crop,
                        refPoints: prev?.refPoints ?? [],
                        houghVotesThreshold: v,
                        matchScoreThreshold: prev?.matchScoreThreshold ?? 0.7,
                        enabled: prev?.enabled ?? true,
                    },
                },
            }
        })
    },
    setEnabled(cameraId, v) {
        set((s) => ({
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: {
                    ...s.draftByCameraId[cameraId],
                    crop: s.draftByCameraId[cameraId]?.crop,
                    refPoints: s.draftByCameraId[cameraId]?.refPoints ?? [],
                    matchScoreThreshold:
                        s.draftByCameraId[cameraId]?.matchScoreThreshold ?? 0.7,
                    houghVotesThreshold:
                        s.draftByCameraId[cameraId]?.houghVotesThreshold ?? 50,
                    enabled: v,
                },
            },
        }))
    },

    resetDraftFromTemplate(cameraId) {
        const template = get().templateByCameraId[cameraId]

        set((s) => ({
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: toDraft(template),
            },
        }))
    },

    clearPoints(cameraId) {
        set((s) => ({
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: {
                    ...s.draftByCameraId[cameraId],
                    crop: s.draftByCameraId[cameraId]?.crop,
                    matchScoreThreshold:
                        s.draftByCameraId[cameraId]?.matchScoreThreshold ?? 0.7,
                    houghVotesThreshold:
                        s.draftByCameraId[cameraId]?.houghVotesThreshold ?? 50,
                    enabled: s.draftByCameraId[cameraId]?.enabled ?? true,
                    refPoints: [],
                },
            },
        }))
    },

    async save(cameraId) {
        const draft = get().draftByCameraId[cameraId]
        if (!draft) return
        if (!draft.crop) {
            throw new Error("crop is required")
        }

        const crop = draft.crop

        const localPoints = (draft.refPoints ?? []).map((p) => ({
            label: p.label,
            x: p.x - crop.x,
            y: p.y - crop.y,
        }))

        await saveForkTemplate(cameraId, {
            crop_x: crop.x,
            crop_y: crop.y,
            crop_width: crop.width,
            crop_height: crop.height,
            ref_points: localPoints,
            hough_votes_threshold: draft.houghVotesThreshold,
            match_score_threshold: draft.matchScoreThreshold,
            enabled: draft.enabled,
        })

        await get().fetchTemplate(cameraId)
    },

    async remove(cameraId) {
        await deleteForkTemplate(cameraId)

        set((s) => ({
            templateByCameraId: {
                ...s.templateByCameraId,
                [cameraId]: undefined,
            },
            draftByCameraId: {
                ...s.draftByCameraId,
                [cameraId]: undefined,
            },
        }))
    },
}))
