import { Badge, Card, Flex, Tag, theme, Typography } from "antd"
import type { CameraItem } from "../../types/camera"
import { formatDisplayName } from "../../utils/common"

const { Text } = Typography

type Props = {
  camera: CameraItem
  active: boolean
  onClick: (cameraId: string) => void
}

export function CameraCard({ camera, active, onClick }: Props) {
  const { token } = theme.useToken()

  const status = !camera.exists
    ? "missing"
    : camera.started
      ? "started"
      : "stopped"

  const badgeStatus =
    status === "started" ? "success" : status === "stopped" ? "warning" : "default"

  const statusText =
    status === "started" ? "Running" : status === "stopped" ? "Stopped" : "Not found"

  return (
    <Card
      size="small"
      hoverable
      onClick={() => onClick(camera.id)}
      style={{
        cursor: "pointer",
        borderColor: active ? token.colorPrimary : token.colorBorder,
        background: token.colorBgContainer,
      }}
      styles={{
        body: { padding: "8px 10px" }, // ↓ from 12
      }}
    >
      <Flex vertical gap={6}> {/* ↓ from 10 */}
        
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Flex vertical style={{ minWidth: 0 }}>
            <Text
              strong
              style={{ lineHeight: 1.2 }}
              ellipsis={{ tooltip: formatDisplayName(camera.id) }}
            >
              {formatDisplayName(camera.id)}
            </Text>

            <Text
              type="secondary"
              style={{ fontSize: 12, lineHeight: 1.1 }}
            >
              {camera.id}
            </Text>
          </Flex>

          <Badge status={badgeStatus} text={statusText} />
        </Flex>

        {/* Tags */}
        <Flex gap={4} wrap="wrap"> {/* ↓ gap */}
          <Tag
            color={camera.sourceType === "mp4" ? "blue" : "orange"}
            style={{
              marginInlineEnd: 0,
              padding: "0 6px",
              lineHeight: "18px",
            }}
          >
            {camera.sourceType || "none"}
          </Tag>

          <Tag
            color={camera.enabled ? "success" : "default"}
            style={{
              marginInlineEnd: 0,
              padding: "0 6px",
              lineHeight: "18px",
            }}
          >
            {camera.enabled ? "Enabled" : "Disabled"}
          </Tag>
        </Flex>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: token.colorBorder,
            opacity: 0.5,
          }}
        />

        {/* Info */}
        <Flex vertical gap={2}> {/* ↓ from 5 */}
          <Info label="Room" value={camera.room || "-"} />
          <Info label="Track" value={camera.track || "-"} />
          <Info label="Publisher" value={camera.publisherIdentity || "-"} />

          {camera.model && <Info label="Model" value={camera.model} />}
          {camera.serial && <Info label="Serial" value={camera.serial} />}
          {camera.ip && <Info label="IP" value={camera.ip} />}

          {camera.sourceType === "mp4" && (
            <Info label="Source" value={camera.sourcePath || "-"} />
          )}
        </Flex>

        {/* Error */}
        {camera.lastError && (
          <div
            style={{
              padding: "4px 6px", // ↓
              borderRadius: token.borderRadius,
              background: token.colorErrorBg,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          >
            <Text type="danger" style={{ fontSize: 12, lineHeight: 1.2 }}>
              {camera.lastError}
            </Text>
          </div>
        )}
      </Flex>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between" align="center" gap={6}>
      <Text
        type="secondary"
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          maxWidth: 140,
          textAlign: "right",
        }}
        ellipsis={{ tooltip: value }}
      >
        {value}
      </Text>
    </Flex>
  )
}