import type { CSSProperties } from "react"

type WaferOverlayProps = {
  visible?: boolean
}

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
}

export function WaferOverlay({ visible = true }: WaferOverlayProps) {
  if (!visible) return null

  return (
    <div style={layerStyle}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  )
}