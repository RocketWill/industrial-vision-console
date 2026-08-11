import type { CSSProperties } from "react"

type DistanceOverlayProps = {
  visible?: boolean
}

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
}

const lines = [
  { x1: 30, y1: 52, x2: 22, y2: 50, label: "D1", ok: true },
  { x1: 42, y1: 72, x2: 40, y2: 78, label: "D2", ok: false },
  { x1: 58, y1: 72, x2: 60, y2: 78, label: "D3", ok: true },
  { x1: 70, y1: 52, x2: 78, y2: 50, label: "D4", ok: true },
]

export function DistanceOverlay({ visible = true }: DistanceOverlayProps) {
  if (!visible) return null

  return (
    <div style={layerStyle}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map((line) => {
          const color = line.ok ? "#52c41a" : "#ff4d4f"
          const labelX = (line.x1 + line.x2) / 2
          const labelY = (line.y1 + line.y2) / 2

          return (
            <g key={line.label}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={color}
                strokeWidth="1"
              />
              <text
                x={labelX + 1}
                y={labelY - 1}
                fontSize="3"
                fill={color}
              >
                {line.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}