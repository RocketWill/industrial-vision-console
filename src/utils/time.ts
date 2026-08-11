// src/utils/time.ts

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

// 固定台灣時區
const TZ = "Asia/Taipei"

export function formatLocalTime(iso?: string) {
  if (!iso) return "-"

  return dayjs.utc(iso).tz(TZ).format("YYYY-MM-DD HH:mm:ss")
}