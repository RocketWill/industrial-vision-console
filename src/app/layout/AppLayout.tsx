import { Layout } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react"
import { TopBar } from "../shell/TopBar"
import { CameraSidebar } from "../../components/camera/CameraSidebar"
import { CameraWorkspacePage } from "../../pages/CameraWorkspacePage"
import { useCameraStore } from "../../store/cameraStore"
import { formatDisplayName } from "../../utils/common"
import { useAuthStore } from "../../store/authStore"
import { useLiveKitViewer } from "../../hooks/useLiveKitViewer"
import type { CameraItem } from "../../types/camera"
import { getRuntimeConfig } from "../../config/runtimeConfig"

const { Header, Sider, Content } = Layout

type CameraViewerState = {
  stream: MediaStream | null
  status: "connecting" | "connected" | "lost" | "unknown"
  error: string
}

function CameraConnectionSlot({
  camera,
  onUpdate,
}: {
  camera: CameraItem
  onUpdate: (cameraId: string, state: CameraViewerState) => void
}) {
  const livekitUrl = getRuntimeConfig().VITE_LIVEKIT_URL || "ws://127.0.0.1:7880"
  const livekitRoom = camera.room || `wafer-${camera.id}`

  const enabled = Boolean(camera.exists && camera.started && livekitUrl && livekitRoom)

  const viewer = useLiveKitViewer(
    enabled ? livekitUrl : null,
    enabled ? livekitRoom : null,
    `viewer-${camera.id}`,
  )

  useEffect(() => {
    onUpdate(camera.id, {
      stream: viewer.stream,
      status: viewer.status,
      error: viewer.error,
    })
  }, [camera.id, viewer.stream, viewer.status, viewer.error, onUpdate])

  return null
}

export function AppLayout() {
  const cameras = useCameraStore((state) => state.cameras)
  const activeCameraId = useCameraStore((state) => state.activeCameraId)

  const activeCamera = useMemo(
    () => cameras.find((camera) => camera.id === activeCameraId) ?? cameras[0],
    [cameras, activeCameraId]
  )

  const [viewerByCameraId, setViewerByCameraId] = useState<
    Record<string, CameraViewerState>
  >({})

  const fetchMe = useAuthStore((s) => s.fetchMe)

  const handleViewerUpdate = useCallback(
    (cameraId: string, state: CameraViewerState) => {
      setViewerByCameraId((prev) => ({
        ...prev,
        [cameraId]: state,
      }))
    },
    [],
  )

  const activeViewer = activeCamera
    ? viewerByCameraId[activeCamera.id]
    : undefined

  useEffect(() => {
    fetchMe().catch(() => { })
  }, [fetchMe])

  if (!activeCamera) return null

  return (
    <>
      {cameras.map((camera) => (
        <CameraConnectionSlot
          key={camera.id}
          camera={camera}
          onUpdate={handleViewerUpdate}
        />
      ))}

      <Layout style={{ height: "100vh", background: "#0b0f14" }}>
        <Header
          style={{
            height: 64,
            padding: 0,
            lineHeight: "normal",
            flex: "0 0 64px",
          }}
        >
          <TopBar
            activeCameraName={formatDisplayName(activeCamera.id)}
            streamStatus={activeCamera.enabled ? "connected" : "disconnected"}
            runtimeStatus={activeCamera.enabled ? "running" : "idle"}
          />
        </Header>

        <Layout style={{ minHeight: 0 }}>
          <Sider
            width={320}
            theme="dark"
            style={{
              background: "#0b0f14",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <CameraSidebar />
          </Sider>

          <Content
            style={{
              background: "#0b0f14",
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <CameraWorkspacePage
              camera={activeCamera}
              liveStream={activeViewer?.stream ?? null}
              livekitStatus={activeViewer?.status ?? "unknown"}
              livekitError={activeViewer?.error ?? ""}
            />
          </Content>
        </Layout>
      </Layout>
    </>
  )
}
