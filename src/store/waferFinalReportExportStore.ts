import { create } from "zustand"

import {
  previewWaferFinalResultsExport,
  exportWaferFinalResults,
  type FinalReportExportRequest,
  type FinalReportExportMeta,
} from "../api/waferFinalResults"

type WaferFinalReportExportStore = {
  exporting: boolean
  exportMeta?: FinalReportExportMeta

  previewExport: (payload: FinalReportExportRequest) => Promise<FinalReportExportMeta>
  exportResults: (payload: FinalReportExportRequest) => Promise<void>
  clearExportMeta: () => void
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export const useWaferFinalReportExportStore = create<WaferFinalReportExportStore>((set) => ({
  exporting: false,
  exportMeta: undefined,

  previewExport: async (payload) => {
    const meta = await previewWaferFinalResultsExport(payload)
    set({ exportMeta: meta })
    return meta
  },

  exportResults: async (payload) => {
    set({ exporting: true })

    try {
      const meta = await previewWaferFinalResultsExport(payload)
      const blob = await exportWaferFinalResults(payload)
      downloadBlob(blob, meta.filename)
      set({ exportMeta: meta })
    } finally {
      set({ exporting: false })
    }
  },

  clearExportMeta: () => set({ exportMeta: undefined }),
}))