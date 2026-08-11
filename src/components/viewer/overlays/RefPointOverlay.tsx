import type { CSSProperties } from "react"

type RefPointOverlayProps = {
  visible?: boolean
}

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
}

const points = [
  { x: 30, y: 52 },
  { x: 42, y: 72 },
  { x: 58, y: 72 },
  { x: 70, y: 52 },
]

export function RefPointOverlay({ visible = true }: RefPointOverlayProps) {
  if (!visible) return null

  return (
    <div style={layerStyle}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="1.8"
              fill="#36cfc9"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="0.5"
            />
            <text
              x={point.x + 2}
              y={point.y - 2}
              fontSize="3"
              fill="#36cfc9"
            >
              P{index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}