import { Button, Card, Col, Flex, Radio, Row, Segmented, Space, Switch, Tabs, Typography, message, theme } from "antd"
import { useEffect, useMemo, useState } from "react"
import type { HitPhase } from "../api/types"
import type { CameraItem } from "../types/camera"
import { useRuntimeStore } from "../store/runtimeStore"
import { SessionStatusCard } from "../components/runtime/SessionStatusCard"
import { InspectionResultCard } from "../components/runtime/InspectionResultCard"
import { WaferViewer } from "../components/viewer/WaferViewer"
import { ViewerControls } from "../components/viewer/ViewerControls"
import StreamConfigPanel from "../config/StreamConfigPanel"
import "./CameraWorkspacePage.css"
import { RuntimeDebugPanel } from "../components/runtime/RuntimeDebugPanel"
import WaferRoiConfigPanel from "../components/config/WaferRoiConfigPanel"
import RuntimeThresholdPanel from "../components/config/RuntimeThresholdPanel"
import { useConfigStore } from "../store/configStore"
import { WaferRoiControlPanel } from "../components/runtime/WaferRoiControlPanel"
import ForkRoiConfigPanel from "../components/config/ForkRoiConfigPanel"
import { ForkRoiControlPanel } from "../components/runtime/ForkRoiControlPanel"
import { ForkTemplatePanel } from "../components/config/ForkTemplatePanel"
import WaferEllipsePanel from "../components/config/WaferEllipsePanel"
import InspectionResultsTable from "../components/history/InspectionResultsTable"
import WaferFinalTable from "../components/history/WaferFinalTable"
import WaferDefectResultsTable from "../components/history/WaferDefectResultsTable"
import { formatDisplayName } from "../utils/common"
import ForkMatchConfigPanel from "../components/config/ForkMatchConfigPanel"
import { useCameraStore } from "../store/cameraStore"

const { Title, Text } = Typography

type CameraWorkspacePageProps = {
  camera: CameraItem
  liveStream?: MediaStream | null
  livekitStatus?: "connecting" | "connected" | "lost" | "unknown"
  livekitError?: string
}
type WorkspaceTab = "live" | "history" | "config"

function CameraStartStopActions({ cameraId }: { cameraId: string }) {
  const runtime = useRuntimeStore((state) => state.runtimeByCameraId[cameraId])
  const startCamera = useRuntimeStore((state) => state.startCamera)
  const stopCamera = useRuntimeStore((state) => state.stopCamera)
  const toggleSwitchDetection = useRuntimeStore((state) => state.toggleSwitchDetection)
  const starting = useRuntimeStore((state) => state.startingByCameraId[cameraId] ?? false)
  const stopping = useRuntimeStore((state) => state.stoppingByCameraId[cameraId] ?? false)
  const detectionUpdating = useRuntimeStore(
    (state) => state.detectionUpdatingByCameraId[cameraId] ?? false
  )

  const isRunning = runtime?.workerRunning ?? false
  const [detectionEnabledDraft, setDetectionEnabledDraft] = useState(true)
  const [nextHitPhaseDraft, setNextHitPhaseDraft] = useState<HitPhase>("IN")
  const detectionEnabled = isRunning
    ? runtime?.switch_detection_enabled ?? false
    : detectionEnabledDraft
  const nextHitPhase =
    isRunning && detectionEnabled
      ? runtime?.nextHitPhase ?? "IN"
      : nextHitPhaseDraft
  const isApplying =
    isRunning &&
    runtime?.detectionCommandVersion !== runtime?.detectionAppliedVersion
  const controlsDisabled = starting || stopping || detectionUpdating || isApplying

  const handleDetectionToggle = async (checked: boolean) => {
    setDetectionEnabledDraft(checked)

    if (!isRunning) return

    try {
      await toggleSwitchDetection(
        cameraId,
        checked,
        checked ? nextHitPhase : undefined,
      )
      if (!checked) {
        setNextHitPhaseDraft(runtime?.nextHitPhase ?? "IN")
        void message.success(
          "Detection stopped. Wafer matching will restart when detection is enabled.",
        )
      }
    } catch (error) {
      void message.error(
        error instanceof Error ? error.message : "Unable to update detection",
      )
    }
  }

  const handleStart = async () => {
    try {
      await startCamera(cameraId, {
        enabled: detectionEnabled,
        nextHitPhase,
      })
    } catch (error) {
      void message.error(
        error instanceof Error ? error.message : "Unable to start runtime",
      )
    }
  }

  return (
    <Space>
      <Space align="center" size={8}>
        <Text type="secondary">Enable Detection</Text>
        <Switch
          checked={detectionEnabled}
          disabled={controlsDisabled}
          loading={detectionUpdating}
          onChange={(checked) => void handleDetectionToggle(checked)}
        />
      </Space>

      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        size="small"
        value={nextHitPhase}
        disabled={controlsDisabled || (isRunning && detectionEnabled)}
        onChange={(event) =>
          setNextHitPhaseDraft(event.target.value as HitPhase)
        }
        options={[
          { label: "IN", value: "IN" },
          { label: "OUT", value: "OUT" },
        ]}
      />

      {isApplying && <Text type="secondary">Applying detection settings…</Text>}

      <Button
        type="primary"
        onClick={() => void handleStart()}
        disabled={isRunning || controlsDisabled}
        loading={starting}
      >
        Start Runtime
      </Button>

      <Button
        danger
        onClick={() => void stopCamera(cameraId)}
        disabled={!isRunning || controlsDisabled}
        loading={stopping}
      >
        Stop Runtime
      </Button>
    </Space>
  )
}

export function CameraWorkspacePage({
  camera,
  liveStream,
  livekitStatus = "unknown",
  livekitError = "",
}: CameraWorkspacePageProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("live")
  const stopCameraStatusStream = useRuntimeStore(
    (s) => s.stopCameraStatusStream
  )
  const [sseEnabled, setSseEnabled] = useState(true)

  const tabItems = useMemo(
    () => [
      {
        key: "live",
        label: "Live",
        children: (
          <LiveTab
            camera={camera}
            sseEnabled={sseEnabled}
            activeTab={activeTab}
            liveStream={liveStream ?? null}
            livekitStatus={livekitStatus}
            livekitError={livekitError}
          />
        ),
      },
      {
        key: "history",
        label: "History",
        children: <HistoryTab camera={camera} />,
      },
      {
        key: "config",
        label: "Config",
        children: <ConfigTab camera={camera} />,
      },
    ],
    [camera, sseEnabled, activeTab, liveStream, livekitStatus, livekitError]
  )

  return (
    <Flex vertical style={{ height: "100%", padding: 16 }} gap={16}>
      <Flex align="center" justify="space-between" gap={16}>
        <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Title level={4} style={{ margin: 0 }}>
            {formatDisplayName(camera.id)} Workspace
          </Title>
          <Text type="secondary">
            Live view, runtime status, history and configuration
          </Text>
        </Flex>

        <Space>
          <Space align="center" size={8}>
            <Text type="secondary">Runtime SSE</Text>
            <Switch
              checked={sseEnabled}
              onChange={(checked) => {
                setSseEnabled(checked)

                if (!checked) {
                  stopCameraStatusStream(camera.id)
                }
              }}
            />
          </Space>
          <CameraStartStopActions key={camera.id} cameraId={camera.id} />

          <Segmented
            value={activeTab}
            onChange={(value) => setActiveTab(value as WorkspaceTab)}
            options={[
              { label: "Live", value: "live" },
              { label: "History", value: "history" },
              { label: "Config", value: "config" },
            ]}
          />
        </Space>
      </Flex>

      <Card
        style={{ flex: 1, minHeight: 0 }}
        bodyStyle={{
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          padding: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as WorkspaceTab)}
          items={tabItems}
          style={{ height: "100%", minHeight: 0 }}
          className="vcTabsFill"
        />
      </Card>
    </Flex>
  )
}

function LiveTab({
  camera,
  sseEnabled,
  activeTab,
  liveStream,
  livekitStatus,
  livekitError,
}: {
  camera: CameraItem
  sseEnabled: boolean
  activeTab: WorkspaceTab
  liveStream: MediaStream | null
  livekitStatus: "connecting" | "connected" | "lost" | "unknown"
  livekitError: string
}) {
  const { token } = theme.useToken()

  const fetchCameraList = useCameraStore((s) => s.fetchCameraList)

  const runtime = useRuntimeStore((s) => s.runtimeByCameraId[camera.id])
  const fetchCameraRuntime = useRuntimeStore((s) => s.fetchCameraRuntime)
  const startCameraStatusStream = useRuntimeStore((s) => s.startCameraStatusStream)
  const stopCameraStatusStream = useRuntimeStore((s) => s.stopCameraStatusStream)

  const fetchConfig = useConfigStore((s) => s.fetchConfig)

  // ===== circle ROI =====
  const roiDraft = useConfigStore((s) => s.roiDraftByCameraId[camera.id])
  const setRoiDraft = useConfigStore((s) => s.setRoiDraft)
  const saveRoiDraft = useConfigStore((s) => s.saveRoiDraft)
  const saveRoiDraftLoading = useConfigStore((s) => s.saveRoiDraftLoading)
  const resetRoiDraftFromConfig = useConfigStore(
    (s) => s.resetRoiDraftFromConfig
  )

  // ===== fork ROI =====
  const forkDraft = useConfigStore(
    (s) => s.forkRoiDraftByCameraId[camera.id]
  )
  const setForkDraft = useConfigStore((s) => s.setForkRoiDraft)
  const saveForkDraft = useConfigStore((s) => s.saveForkRoiDraft)
  const saveForkRoiDraftLoading = useConfigStore((s) => s.saveForkRoiDraftLoading)
  const resetForkDraftFromConfig = useConfigStore(
    (s) => s.resetForkRoiDraftFromConfig
  )

  const [roiEditMode, setRoiEditMode] = useState(false)
  const [forkEditMode, setForkEditMode] = useState(false)

  useEffect(() => {
    void fetchCameraList()
  }, [fetchCameraList])

  useEffect(() => {
    void fetchCameraRuntime(camera.id)
    void fetchConfig(camera.id)

    const shouldConnectSse = sseEnabled && activeTab === "live"

    if (shouldConnectSse) {
      startCameraStatusStream(camera.id)
    } else {
      stopCameraStatusStream(camera.id)
    }

    return () => {
      stopCameraStatusStream(camera.id)
    }
  }, [
    camera.id,
    activeTab,
    sseEnabled,
    fetchCameraRuntime,
    fetchConfig,
    startCameraStatusStream,
    stopCameraStatusStream,
  ])

  return (
    <Row gutter={16} style={{ height: "100%", marginTop: token.marginSM }}>
      {/* ===== 左 Viewer ===== */}
      <Col span={17} style={{ height: "100%" }}>
        <Flex vertical gap={12} style={{ height: "100%" }}>
          <ViewerControls cameraId={camera.id} />

          <div style={{ flex: 1 }}>
            <WaferViewer
              cameraId={camera.id}
              cameraName={formatDisplayName(camera.id)}
              direction={runtime?.currentDirection ?? "UNKNOWN"}
              roiStable={runtime?.roiStable ?? false}
              roi={roiDraft}
              roiEditable={roiEditMode}
              onRoiChange={(next) => setRoiDraft(camera.id, next)}
              forkRoi={forkDraft}
              forkEditable={forkEditMode}
              onForkChange={(next) => setForkDraft(camera.id, next)}
              frameWidth={runtime?.lastFrameWidth}
              frameHeight={runtime?.lastFrameHeight}
              liveStream={liveStream}
              livekitStatus={livekitStatus}
              livekitError={livekitError}
            />
          </div>
        </Flex>
      </Col>

      {/* ===== 右 Panel ===== */}
      <Col span={7} style={{ height: "100%" }}>
        <Flex vertical gap={12} style={{ height: "100%", overflowY: "auto" }}>
          <WaferRoiControlPanel
            cameraId={camera.id}
            roiEditMode={roiEditMode}
            setRoiEditMode={setRoiEditMode}
            saveRoiDraftLoading={saveRoiDraftLoading}
            roiDraft={roiDraft}
            setRoiDraft={setRoiDraft}
            resetRoiDraftFromConfig={resetRoiDraftFromConfig}
            saveRoiDraft={saveRoiDraft}
          />

          <ForkRoiControlPanel
            cameraId={camera.id}
            forkEditMode={forkEditMode}
            saveForkRoiDraftLoading={saveForkRoiDraftLoading}
            setForkEditMode={setForkEditMode}
            forkDraft={forkDraft}
            setForkDraft={setForkDraft}
            resetForkDraftFromConfig={resetForkDraftFromConfig}
            saveForkDraft={saveForkDraft}
          />

          <SessionStatusCard
            sessionActive={camera.enabled}
            connection={camera.enabled ? "connected" : "disconnected"}
            roiStable={runtime?.roiStable ?? false}
          />

          <InspectionResultCard
            waferId={runtime?.currentWaferId ?? camera.waferId}
            alignmentOk={runtime?.alignmentOk}
            currentDirection={runtime?.currentDirection}
            flowVy={runtime?.flowVy}
            roiMean={runtime?.roiMean}
            roiDelta={runtime?.roiDelta}
            lastTriggerTime={runtime?.lastTriggerTime}
          />

          <RuntimeDebugPanel cameraId={camera.id} />
        </Flex>
      </Col>
    </Row>
  )
}

function HistoryTab({ camera }: { camera: CameraItem }) {
  const { token } = theme.useToken()
  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Flex
        vertical
        gap={12}
        style={{
          height: "100%",
          padding: 16,
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {camera.name} History
          </Title>
          <Text type="secondary">
            Inspection, defect, and final wafer results
          </Text>
        </div>

        {/* Tabs */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Tabs
            defaultActiveKey="inspection"
            items={[
              {
                key: "inspection",
                label: "Inspection Results",
                children: (
                  <div style={{ marginTop: token.marginMD }}>
                    <InspectionResultsTable cameraId={camera.id} />
                  </div>
                ),
              },
              {
                key: "defect",
                label: "Defect Results",
                children: (
                  <div style={{ marginTop: token.marginMD }}>
                    <WaferDefectResultsTable cameraId={camera.id} />
                  </div>
                ),
              },
              {
                key: "final",
                label: "Final Results",
                children: (
                  <div style={{ marginTop: token.marginMD }}>
                    <WaferFinalTable cameraId={camera.id} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Flex>
    </div>
  );
}

function ConfigTab({ camera }: { camera: CameraItem }) {
  const fetchConfig = useConfigStore((state) => state.fetchConfig)

  useEffect(() => {
    fetchConfig(camera.id)
  }, [camera.id, fetchConfig])

  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden", // 外層鎖住
      }}
    >
      <Flex
        vertical
        gap={16}
        style={{
          padding: 16,
          height: "100%",
          overflowY: "auto",
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {camera.name} Config
          </Title>
          <Text type="secondary">
            Configure ROI and runtime thresholds
          </Text>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <WaferRoiConfigPanel cameraId={camera.id} />
          </Col>
          <Col span={12}>
            <ForkRoiConfigPanel cameraId={camera.id} />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <RuntimeThresholdPanel cameraId={camera.id} />
          </Col>
          <Col span={12}>
            <StreamConfigPanel cameraId={camera.id} />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <WaferEllipsePanel cameraId={camera.id} />
          </Col>
          <Col span={12}>
            <ForkMatchConfigPanel cameraId={camera.id} />
          </Col>
        </Row>
        <ForkTemplatePanel cameraId={camera.id} />
      </Flex>
    </div>
  )
}
