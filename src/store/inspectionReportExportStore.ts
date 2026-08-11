import { create } from "zustand"
import {
  exportInspectionReport,
  type ExportInspectionReportPayload,
} from "../api/inspectionResults"

type InspectionReportExportStore = {
  exporting: boolean
  lastFilename?: string
  error?: string

  exportReport: (payload: ExportInspectionReportPayload) => Promise<void>
  reset: () => void
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

export const useInspectionReportExportStore =
  create<InspectionReportExportStore>((set) => ({
    exporting: false,
    lastFilename: undefined,
    error: undefined,

    exportReport: async (payload) => {
      set({
        exporting: true,
        error: undefined,
      })

      try {
        const { blob, filename } = await exportInspectionReport(payload)
        downloadBlob(blob, filename)

        set({
          exporting: false,
          lastFilename: filename,
          error: undefined,
        })
      } catch (error) {
        set({
          exporting: false,
          error: error instanceof Error ? error.message : "export failed",
        })
        throw error
      }
    },

    reset: () => {
      set({
        exporting: false,
        lastFilename: undefined,
        error: undefined,
      })
    },
  }))