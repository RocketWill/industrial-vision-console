import { Card, Descriptions, Tag, Typography } from "antd"
import { useCameraStore } from "../store/cameraStore"

const { Text } = Typography

type Props = {
  cameraId: string
}

function formatDisplayName(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-")
}

export default function StreamConfigPanel({ cameraId }: Props) {
  const camera = useCameraStore((s) =>
    s.cameras.find((item) => item.id === cameraId)
  )

  if (!camera) {
    return (
      <Card title="Stream Config" size="small">
        <Text type="secondary">Camera not found</Text>
      </Card>
    )
  }

  return (
    <Card title="Stream Config" size="small">
      <Descriptions
        size="small"
        column={2}
        bordered
        items={[
          {
            key: "displayName",
            label: "Name",
            children: formatDisplayName(camera.id),
          },
          {
            key: "cameraId",
            label: "Camera ID",
            children: camera.id,
          },
          {
            key: "exists",
            label: "Runtime",
            children: camera.exists ? (
              <Tag color="success">Exists</Tag>
            ) : (
              <Tag>Not Found</Tag>
            ),
          },
          {
            key: "started",
            label: "Stream",
            children: camera.started ? (
              <Tag color="success">Started</Tag>
            ) : (
              <Tag color="warning">Stopped</Tag>
            ),
          },
          {
            key: "sourceType",
            label: "Source",
            children: <Tag>{camera.sourceType || "none"}</Tag>,
          },
          {
            key: "room",
            label: "Room",
            children: camera.room || "-",
          },
          {
            key: "track",
            label: "Track",
            children: camera.track || "-",
          },
          {
            key: "publisher",
            label: "Publisher",
            children: camera.publisherIdentity || "-",
          },
          {
            key: "model",
            label: "Model",
            children: camera.model || "-",
          },
          {
            key: "serial",
            label: "Serial",
            children: camera.serial || "-",
          },
          {
            key: "ip",
            label: "IP",
            children: camera.ip || "-",
          },
          {
            key: "sourcePath",
            label: "Source Path",
            children: camera.sourcePath || "-",
          },
          {
            key: "lastError",
            label: "Last Error",
            children: camera.lastError || "-",
          },
        ]}
      />
    </Card>
  )
}