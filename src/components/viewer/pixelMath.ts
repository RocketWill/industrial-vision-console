export function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function rgbToGray(r: number, g: number, b: number): number {
  return clampByte(0.299 * r + 0.587 * g + 0.114 * b)
}