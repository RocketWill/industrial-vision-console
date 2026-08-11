import { Card, Descriptions, Tag } from "antd"

type SessionStatusCardProps = {
  sessionActive: boolean
  connection: "connected" | "connecting" | "disconnected"
  roiStable: boolean
}

function getConnectionColor(connection: SessionStatusCardProps["connection"]) {
  switch (connection) {
    case "connected":
      return "success"
    case "connecting":
      return "processing"
    default:
      return "default"
  }
}

export function SessionStatusCard({
  sessionActive,
  connection,
  roiStable,
}: SessionStatusCardProps) {
  return (
    <Card size="small" title="Session Status">
      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item label="Session">
          <Tag color={sessionActive ? "green" : "default"} bordered={false}>
            {sessionActive ? "Active" : "Idle"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Connection">
          <Tag color={getConnectionColor(connection)} bordered={false}>
            {connection}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="ROI Stable">
          <Tag color={roiStable ? "green" : "default"} bordered={false}>
            {roiStable ? "Yes" : "No"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}