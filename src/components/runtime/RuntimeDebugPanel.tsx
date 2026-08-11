import { Card, Descriptions, Tag, Typography } from "antd"
import { useRuntimeStore } from "../../store/runtimeStore"
import { formatLocalTime } from "../../utils/time"

const { Text } = Typography

type Props = {
  cameraId: string
}

function formatNumber(value?: number, digits = 2) {
  if (value === undefined || Number.isNaN(value)) return "-"
  return value.toFixed(digits)
}

function getDirectionColor(dir?: string) {
  if (dir === "IN") return "green"
  if (dir === "OUT") return "red"
  if (dir === "STABLE") return "blue"
  return "default"
}

export function RuntimeDebugPanel({ cameraId }: Props) {
  const runtime = useRuntimeStore((s) => s.runtimeByCameraId[cameraId])

  return (
    <Card size="small" title="Runtime Debug">
      <div style={{ width: "100%"}}>
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Camera ID">
            {cameraId}
          </Descriptions.Item>

          <Descriptions.Item label="Enabled">
            {runtime?.enabled === undefined ? (
              "-"
            ) : runtime.enabled ? (
              <Tag color="green">TRUE</Tag>
            ) : (
              <Tag color="red">FALSE</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Stream" span={2}>
            {runtime?.streamConnected === undefined ? (
              "-"
            ) : runtime.streamConnected ? (
              <Tag color="green">CONNECTED</Tag>
            ) : (
              <Tag color="red">DISCONNECTED</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Worker">
            {runtime?.workerRunning === undefined ? (
              "-"
            ) : runtime.workerRunning ? (
              <Tag color="green">RUNNING</Tag>
            ) : (
              <Tag color="red">STOPPED</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Direction">
            <Tag color={getDirectionColor(runtime?.currentDirection)}>
              {runtime?.currentDirection ?? "-"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Flow Vy">
            {formatNumber(runtime?.flowVy)}
          </Descriptions.Item>

          <Descriptions.Item label="Flow Smooth">
            {formatNumber(runtime?.flowVySmooth)}
          </Descriptions.Item>

          <Descriptions.Item label="Motion Score">
            {formatNumber(runtime?.flowMotionScore)}
          </Descriptions.Item>

          <Descriptions.Item label="ROI Stable">
            {runtime?.roiStable === undefined ? (
              "-"
            ) : runtime.roiStable ? (
              <Tag color="green">TRUE</Tag>
            ) : (
              <Tag color="orange">FALSE</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="ROI Mean">
            {formatNumber(runtime?.roiMean)}
          </Descriptions.Item>

          <Descriptions.Item label="ROI Delta">
            {formatNumber(runtime?.roiDelta)}
          </Descriptions.Item>

          <Descriptions.Item label="Session" span={2}>
            {runtime?.sessionStatus ?? "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Wafer" span={2}>
            {runtime?.currentWaferId
              ? <Text code>{runtime.currentWaferId}</Text>
              : "-"
            }
          </Descriptions.Item>

          <Descriptions.Item label="Frame Size">
            {runtime?.lastFrameWidth && runtime?.lastFrameHeight
              ? `${runtime.lastFrameWidth} × ${runtime.lastFrameHeight}`
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Timestamp" span={2}>
            {runtime?.lastFrameTimestampUs ?? "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Last Trigger" span={2}>
            {formatLocalTime(runtime?.lastTriggerTime) ?? "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Last Inspect" span={2}>
            {formatLocalTime(runtime?.lastInspectionTime) ?? "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Error" span={2}>
            {runtime?.lastError ? <Tag color="red">{runtime.lastError}</Tag> : "-"}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Card>
  )
}