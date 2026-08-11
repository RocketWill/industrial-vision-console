import { create } from "zustand"
import {
  exportWaferDefectResults,
  previewWaferDefectResultsExport,
} from "../api/waferDefectResults"
import type {
  WaferDefectExportMeta,
  WaferDefectExportPayload,
} from "../types/waferDefectResult"

type WaferDefectReportExportStore = {
  exporting: boolean
  exportMeta?: WaferDefectExportMeta
  error?: string
  exportResults: (payload: WaferDefectExportPayload) => Promise<void>
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export const useWaferDefectReportExportStore =
  create<WaferDefectReportExportStore>((set) => ({
    exporting: false,

    async exportResults(payload) {
      set({ exporting: true, error: undefined })
      try {
        const meta = await previewWaferDefectResultsExport(payload)
        const blob = await exportWaferDefectResults(payload)
        downloadBlob(blob, meta.filename)
        set({ exportMeta: meta, exporting: false })
      } catch (error) {
        set({
          exporting: false,
          error: error instanceof Error ? error.message : "export failed",
        })
        throw error
      }
    },
  }))
