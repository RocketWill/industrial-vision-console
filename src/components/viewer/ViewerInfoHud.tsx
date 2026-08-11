import { Card, Space, Typography } from "antd"

const { Text } = Typography

export type ViewerPixelInfo = {
  imageX: number
  imageY: number
  r: number
  g: number
  b: number
  gray: number
} | null

type ViewerInfoHudProps = {
  pixelInfo: ViewerPixelInfo
  zoomScale: number
}

export function ViewerInfoHud({ pixelInfo, zoomScale }: ViewerInfoHudProps) {
  return (
    <Card
      size="small"
      styles={{
        body: {
          padding: 10,
        },
      }}
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        minWidth: 220,
        pointerEvents: "none",
        background: "rgb(30, 110, 238)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(4px)",
      }}
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Text type="secondary">Viewer Info</Text>

        <Text>
          Zoom: {(zoomScale * 100).toFixed(0)}%
        </Text>

        <Text>
          Pos:{" "}
          {pixelInfo
            ? `${pixelInfo.imageX}, ${pixelInfo.imageY}`
            : "--, --"}
        </Text>

        <Text>
          RGB:{" "}
          {pixelInfo
            ? `${pixelInfo.r}, ${pixelInfo.g}, ${pixelInfo.b}`
            : "--, --, --"}
        </Text>

        <Text>
          Gray: {pixelInfo ? pixelInfo.gray : "--"}
        </Text>
      </Space>
    </Card>
  )
}