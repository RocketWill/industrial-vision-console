import { useEffect, useRef, useState } from "react"
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Space,
  Typography,
  Upload,
} from "antd"
import { UploadOutlined } from "@ant-design/icons"
import { useConfigStore } from "../../store/configStore"

const { Text } = Typography

type Props = {
  cameraId: string
}

type ImageInfo = {
  url: string
  width: number
  height: number
}

type DragMode = "move" | "resize" | null

const VIEWER_HEIGHT = 340

const COMPACT_FORM_ITEM_STYLE = {
  marginBottom: 8,
}

export default function WaferRoiConfigPanel({ cameraId }: Props) {
  const draft = useConfigStore((s) => s.roiDraftByCameraId[cameraId])
  const setRoiDraft = useConfigStore((s) => s.setRoiDraft)
  const resetRoiDraftFromConfig = useConfigStore(
    (s) => s.resetRoiDraftFromConfig,
  )
  const saveRoiDraft = useConfigStore((s) => s.saveRoiDraft)
  const saveRoiDraftLoading = useConfigStore((s) => s.saveRoiDraftLoading)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageWrapRef = useRef<HTMLDivElement | null>(null)

  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [scale, setScale] = useState(1)
  const [dragMode, setDragMode] = useState<DragMode>(null)

  const fitImage = () => {
    if (!imageInfo || !viewportRef.current) return

    const viewport = viewportRef.current
    const availableWidth = viewport.clientWidth - 16
    const availableHeight = VIEWER_HEIGHT - 16

    const nextScale = Math.min(
      availableWidth / imageInfo.width,
      availableHeight / imageInfo.height,
      1,
    )

    setScale(Number(nextScale.toFixed(4)))
  }

  const fit100 = () => {
    setScale(1)
  }

  useEffect(() => {
    if (imageInfo) {
      fitImage()
    }
  }, [imageInfo])

  useEffect(() => {
    if (!dragMode || !imageInfo || !draft) return

    const handlePointerMove = (event: PointerEvent) => {
      if (!imageWrapRef.current) return

      const rect = imageWrapRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / scale
      const y = (event.clientY - rect.top) / scale

      if (dragMode === "move") {
        const nextCx = clamp(x, 0, imageInfo.width)
        const nextCy = clamp(y, 0, imageInfo.height)

        setRoiDraft(cameraId, {
          cx: Math.round(nextCx),
          cy: Math.round(nextCy),
        })
      }

      if (dragMode === "resize") {
        const dx = x - draft.cx
        const dy = y - draft.cy
        const nextR = Math.sqrt(dx * dx + dy * dy)

        setRoiDraft(cameraId, {
          r: Math.max(1, Math.round(nextR)),
        })
      }
    }

    const handlePointerUp = () => {
      setDragMode(null)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [cameraId, draft, dragMode, imageInfo, scale, setRoiDraft])

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight

      setImageInfo({
        url,
        width,
        height,
      })

      setRoiDraft(cameraId, {
        imageWidth: width,
        imageHeight: height,
        cx: draft?.cx ?? Math.round(width / 2),
        cy: draft?.cy ?? Math.round(height / 2),
        r: draft?.r ?? Math.round(Math.min(width, height) * 0.2),
      })
    }

    img.src = url

    return false
  }

  const zoomText = `${Math.round(scale * 100)}%`

  return (
    <Card
      size="small"
      title="Wafer ROI"
      styles={{
        body: {
          padding: 12,
        },
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Row justify="space-between" align="middle" gutter={8}>
          <Col>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <Button size="small" icon={<UploadOutlined />}>
                Upload Image
              </Button>
            </Upload>
          </Col>

          <Col>
            <Space size={6}>
              <Text type="secondary">Zoom: {zoomText}</Text>
              <Button size="small" onClick={fitImage} disabled={!imageInfo}>
                Fit
              </Button>
              <Button size="small" onClick={fit100} disabled={!imageInfo}>
                100%
              </Button>
            </Space>
          </Col>
        </Row>

        <div
          ref={viewportRef}
          style={{
            height: VIEWER_HEIGHT,
            overflow: "auto",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            background: "#0b0f14",
            display: "flex",
            alignItems: imageInfo ? "flex-start" : "center",
            justifyContent: imageInfo ? "flex-start" : "center",
            padding: 8,
          }}
        >
          {!imageInfo ? (
            <Text type="secondary">Upload an image to edit wafer ROI</Text>
          ) : (
            <div
              ref={imageWrapRef}
              style={{
                position: "relative",
                width: imageInfo.width * scale,
                height: imageInfo.height * scale,
                flex: "0 0 auto",
              }}
            >
              <img
                src={imageInfo.url}
                alt="wafer roi source"
                draggable={false}
                style={{
                  width: imageInfo.width * scale,
                  height: imageInfo.height * scale,
                  display: "block",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />

              {draft && (
                <>
                  <div
                    onPointerDown={(event) => {
                      event.preventDefault()
                      setDragMode("move")
                    }}
                    style={{
                      position: "absolute",
                      left: (draft.cx - draft.r) * scale,
                      top: (draft.cy - draft.r) * scale,
                      width: draft.r * 2 * scale,
                      height: draft.r * 2 * scale,
                      border: "2px solid #ff7a1a",
                      borderRadius: "50%",
                      boxSizing: "border-box",
                      cursor: "move",
                    }}
                  />

                  <div
                    onPointerDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setDragMode("resize")
                    }}
                    style={{
                      position: "absolute",
                      left: (draft.cx + draft.r) * scale - 6,
                      top: draft.cy * scale - 6,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#ff7a1a",
                      border: "2px solid #fff",
                      cursor: "ew-resize",
                      boxSizing: "border-box",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: draft.cx * scale - 3,
                      top: draft.cy * scale - 3,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#ff7a1a",
                      pointerEvents: "none",
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <Form layout="vertical" size="small">
          <Row gutter={[8, 4]}>
            <Col span={8}>
              <Form.Item label="Image W" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  disabled
                  style={{ width: "100%" }}
                  value={draft?.imageWidth}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Image H" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  disabled
                  style={{ width: "100%" }}
                  value={draft?.imageHeight}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="CX" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={0}
                  style={{ width: "100%" }}
                  value={draft?.cx}
                  onChange={(v) =>
                    setRoiDraft(cameraId, { cx: Number(v ?? 0) })
                  }
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="CY" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={0}
                  style={{ width: "100%" }}
                  value={draft?.cy}
                  onChange={(v) =>
                    setRoiDraft(cameraId, { cy: Number(v ?? 0) })
                  }
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="R" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={1}
                  style={{ width: "100%" }}
                  value={draft?.r}
                  onChange={(v) =>
                    setRoiDraft(cameraId, { r: Number(v ?? 1) })
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end">
            <Space size={8}>
              <Button
                size="small"
                onClick={() => resetRoiDraftFromConfig(cameraId)}
              >
                Reset
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => saveRoiDraft(cameraId)}
                loading={saveRoiDraftLoading}
              >
                Save
              </Button>
            </Space>
          </Row>
        </Form>
      </Space>
    </Card>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}