import { Button, Divider, Flex, Typography } from "antd"
import { ReloadOutlined } from "@ant-design/icons"
import { CameraCard } from "./CameraCard"
import { useCameraStore } from "../../store/cameraStore"
import { useEffect, useState } from "react"

const { Title, Text } = Typography

export function CameraSidebar() {
  const cameras = useCameraStore((s) => s.cameras)
  const activeCameraId = useCameraStore((s) => s.activeCameraId)
  const setActiveCamera = useCameraStore((s) => s.setActiveCamera)
  const fetchCameraList = useCameraStore((s) => s.fetchCameraList)

  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      await fetchCameraList()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <Flex
      vertical
      style={{
        height: "100%",
        padding: 12,
        background: "#0f1621",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
      gap={12}
    >
      <Flex justify="space-between" align="flex-start">
        <Flex vertical gap={4}>
          <Title level={5} style={{ margin: 0 }}>
            Cameras
          </Title>
          <Text type="secondary">4-camera runtime workspace</Text>
        </Flex>

        <Button
          size="small"
          type="text"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={refresh}
        />
      </Flex>

      <Divider style={{ margin: 0, borderColor: "rgba(255,255,255,0.08)" }} />

      <Flex vertical gap={10} style={{ flex: 1, overflow: "auto" }}>
        {cameras.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            active={camera.id === activeCameraId}
            onClick={setActiveCamera}
          />
        ))}
      </Flex>
    </Flex>
  )
}