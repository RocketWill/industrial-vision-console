import { Card, Descriptions, Tag, Typography } from "antd"
import type { CameraDirection } from "../../types/camera"

const { Text } = Typography

type DirectionCardProps = {
  direction: CameraDirection
  flowVy?: number
}

function getDirectionColor(direction: CameraDirection) {
  switch (direction) {
    case "IN":
      return "green"
    case "OUT":
      return "orange"
    default:
      return "default"
  }
}

function formatNumber(value?: number, digits = 2) {
  if (value === undefined || Number.isNaN(value)) return "--"
  return value.toFixed(digits)
}

export function DirectionCard({ direction, flowVy }: DirectionCardProps) {
  return (
    <Card size="small" title="Direction">
      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item label="Current">
          <Tag color={getDirectionColor(direction)} bordered={false}>
            {direction}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Flow Vy">
          <Text>{formatNumber(flowVy)}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}