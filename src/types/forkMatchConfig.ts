export type ForkMatchConfig = {
  version?: number
  cv_params?: Record<string, unknown>
  extra_params?: Record<string, unknown>
  target_roi?: number[]
  template_roi?: number[]
  target_masks?: unknown[]
  template_masks?: unknown[]
}

export type ForkMatchConfigUpdate = Partial<ForkMatchConfig>

export type ForkMatchConfigDraft = {
  version?: number
  cv_params: Record<string, unknown>
  extra_params: Record<string, unknown>
  target_roi: number[] | null
  template_roi: number[] | null
  target_masks: unknown[]
  template_masks: unknown[]
}