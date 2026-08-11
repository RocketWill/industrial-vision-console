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

export default function ForkRoiConfigPanel({ cameraId }: Props) {
  const draft = useConfigStore((s) => s.forkRoiDraftByCameraId[cameraId])
  const setForkDraft = useConfigStore((s) => s.setForkRoiDraft)
  const resetForkDraftFromConfig = useConfigStore(
    (s) => s.resetForkRoiDraftFromConfig,
  )
  const saveForkDraft = useConfigStore((s) => s.saveForkRoiDraft)
  const saveForkDraftLoading = useConfigStore(
    (s) => s.saveForkRoiDraftLoading,
  )

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageWrapRef = useRef<HTMLDivElement | null>(null)

  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [scale, setScale] = useState(1)
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

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
        const nextX = clamp(x - dragOffset.x, 0, imageInfo.width - draft.width)
        const nextY = clamp(y - dragOffset.y, 0, imageInfo.height - draft.height)

        setForkDraft(cameraId, {
          x: Math.round(nextX),
          y: Math.round(nextY),
        })
      }

      if (dragMode === "resize") {
        const nextWidth = clamp(x - draft.x, 1, imageInfo.width - draft.x)
        const nextHeight = clamp(y - draft.y, 1, imageInfo.height - draft.y)

        setForkDraft(cameraId, {
          width: Math.round(nextWidth),
          height: Math.round(nextHeight),
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
  }, [
    cameraId,
    draft,
    dragMode,
    dragOffset.x,
    dragOffset.y,
    imageInfo,
    scale,
    setForkDraft,
  ])

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

      const defaultWidth = Math.round(width * 0.35)
      const defaultHeight = Math.round(height * 0.25)

      setForkDraft(cameraId, {
        imageWidth: width,
        imageHeight: height,
        x: draft?.x ?? Math.round((width - defaultWidth) / 2),
        y: draft?.y ?? Math.round((height - defaultHeight) / 2),
        width: draft?.width ?? defaultWidth,
        height: draft?.height ?? defaultHeight,
      })
    }

    img.src = url

    return false
  }

  const zoomText = `${Math.round(scale * 100)}%`

  return (
    <Card
      size="small"
      title="Fork ROI"
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
            <Text type="secondary">Upload an image to edit fork ROI</Text>
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
                alt="fork roi source"
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
                      if (!imageWrapRef.current) return

                      const rect = imageWrapRef.current.getBoundingClientRect()
                      const x = (event.clientX - rect.left) / scale
                      const y = (event.clientY - rect.top) / scale

                      setDragOffset({
                        x: x - draft.x,
                        y: y - draft.y,
                      })
                      setDragMode("move")
                    }}
                    style={{
                      position: "absolute",
                      left: draft.x * scale,
                      top: draft.y * scale,
                      width: draft.width * scale,
                      height: draft.height * scale,
                      border: "2px solid #ff7a1a",
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
                      left: (draft.x + draft.width) * scale - 6,
                      top: (draft.y + draft.height) * scale - 6,
                      width: 12,
                      height: 12,
                      background: "#ff7a1a",
                      border: "2px solid #fff",
                      borderRadius: 2,
                      cursor: "nwse-resize",
                      boxSizing: "border-box",
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
              <Form.Item label="X" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={0}
                  style={{ width: "100%" }}
                  value={draft?.x}
                  onChange={(v) =>
                    setForkDraft(cameraId, { x: Number(v ?? 0) })
                  }
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Y" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={0}
                  style={{ width: "100%" }}
                  value={draft?.y}
                  onChange={(v) =>
                    setForkDraft(cameraId, { y: Number(v ?? 0) })
                  }
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="W" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={1}
                  style={{ width: "100%" }}
                  value={draft?.width}
                  onChange={(v) =>
                    setForkDraft(cameraId, {
                      width: Number(v ?? 1),
                    })
                  }
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="H" style={COMPACT_FORM_ITEM_STYLE}>
                <InputNumber
                  size="small"
                  min={1}
                  style={{ width: "100%" }}
                  value={draft?.height}
                  onChange={(v) =>
                    setForkDraft(cameraId, {
                      height: Number(v ?? 1),
                    })
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end">
            <Space size={8}>
              <Button
                size="small"
                onClick={() => resetForkDraftFromConfig(cameraId)}
              >
                Reset
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => saveForkDraft(cameraId)}
                loading={saveForkDraftLoading}
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