type Props = {
  cx: number
  cy: number
  r: number
  stroke?: string
  strokeWidth?: number
}

export function RoiOverlay({
  cx,
  cy,
  r,
  stroke = "#faad14",
  strokeWidth = 3,
}: Props) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(250,173,20,0.10)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}