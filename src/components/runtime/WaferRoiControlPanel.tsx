import {
  Button,
  Card,
  Flex,
  Space,
} from "antd"
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons"

type Props = {
  cameraId: string
  roiEditMode: boolean
  saveRoiDraftLoading: boolean
  setRoiEditMode: (v: boolean) => void

  roiDraft?: {
    cx: number
    cy: number
    r: number
  }

  setRoiDraft: (cameraId: string, patch: Partial<any>) => void
  resetRoiDraftFromConfig: (cameraId: string) => void
  saveRoiDraft: (cameraId: string) => void
}

export function WaferRoiControlPanel({
  cameraId,
  roiEditMode,
  saveRoiDraftLoading,
  setRoiEditMode,
  roiDraft,
  setRoiDraft,
  resetRoiDraftFromConfig,
  saveRoiDraft,
}: Props) {
  return (
    <Card size="small" styles={{ body: { padding: 10 } }} title="Wafer ROI">
      <Flex vertical gap={10}>
        <Space.Compact block>
          <Button
            size="small"
            type={roiEditMode ? "primary" : "default"}
            icon={<EditOutlined />}
            onClick={() => setRoiEditMode(!roiEditMode)}
          >
            {roiEditMode ? "Editing" : "Edit"}
          </Button>

          <Button
            size="small"
            icon={<ReloadOutlined />}
            disabled={!roiEditMode}
            onClick={() => resetRoiDraftFromConfig(cameraId)}
          >
            Reset
          </Button>

          <Button
            size="small"
            type="primary"
            icon={<SaveOutlined />}
            disabled={!roiEditMode}
            loading={saveRoiDraftLoading}
            onClick={() => saveRoiDraft(cameraId)}
          >
            Save
          </Button>
        </Space.Compact>

        <Flex align="center" justify="space-between" gap={12}>
          {/* 移動控制 */}
          <Flex vertical gap={6}>
            <div style={{ textAlign: "center" }}>
              <Button
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={!roiEditMode || !roiDraft}
                onClick={() =>
                  roiDraft &&
                  setRoiDraft(cameraId, { cy: roiDraft.cy - 5 })
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 32px)",
                gap: 6,
              }}
            >
              <Button
                size="small"
                icon={<ArrowLeftOutlined />}
                disabled={!roiEditMode || !roiDraft}
                onClick={() =>
                  roiDraft &&
                  setRoiDraft(cameraId, { cx: roiDraft.cx - 5 })
                }
              />
              <Button size="small" disabled>
                ROI
              </Button>
              <Button
                size="small"
                icon={<ArrowRightOutlined />}
                disabled={!roiEditMode || !roiDraft}
                onClick={() =>
                  roiDraft &&
                  setRoiDraft(cameraId, { cx: roiDraft.cx + 5 })
                }
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <Button
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={!roiEditMode || !roiDraft}
                onClick={() =>
                  roiDraft &&
                  setRoiDraft(cameraId, { cy: roiDraft.cy + 5 })
                }
              />
            </div>
          </Flex>

          {/* 半徑 */}
          <Flex vertical gap={6} style={{ flex: 1 }}>
            <Space.Compact block>
              <Button
                size="small"
                icon={<MinusOutlined />}
                disabled={!roiEditMode || !roiDraft}
                onClick={() =>
                  roiDraft &&
                  setRoiDraft(cameraId, {
                    r: Math.max(5, roiDraft.r - 5),
                  })
                }
              >
                Radius
              </Button>

              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={!roiEditMode || !roiDraft}
                onClick={() =>
                  roiDraft &&
                  setRoiDraft(cameraId, {
                    r: roiDraft.r + 5,
                  })
                }
              />
            </Space.Compact>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  )
}