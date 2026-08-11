import { Card, Descriptions, Tag, Typography } from "antd"
import { formatLocalTime } from "../../utils/time"

const { Text } = Typography

type InspectionResultCardProps = {
  waferId?: string
  alignmentOk?: boolean | null
  currentDirection?: string
  flowVy?: number
  roiMean?: number
  roiDelta?: number
  lastTriggerTime?: string
}

function getDirectionColor(dir?: string) {
  if (dir === "IN") return "green"
  if (dir === "OUT") return "red"
  if (dir === "STABLE") return "blue"
  return "default"
}

function formatNumber(value?: number, digits = 2) {
  if (value === undefined || Number.isNaN(value)) return "--"
  return value.toFixed(digits)
}

export function InspectionResultCard({
  waferId,
  currentDirection,
  flowVy,
  roiMean,
  roiDelta,
  lastTriggerTime,
}: InspectionResultCardProps) {
  return (
    <Card size="small" title="Inspection">
      <Descriptions size="small" column={2} colon={false} bordered>
        <Descriptions.Item label="Wafer" span={2}>
          <Text code>{waferId ?? "--"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Direction">
          <Tag color={getDirectionColor(currentDirection)} bordered={false}>
            {currentDirection ?? "--"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Flow Vy">
          <Text>{formatNumber(flowVy)}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="ROI Mean">
          <Text>{formatNumber(roiMean)}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Δ Gray">
          <Text>{formatNumber(roiDelta)}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Trigger" span={2}>
          <Text>{formatLocalTime(lastTriggerTime) ?? "--"}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}
