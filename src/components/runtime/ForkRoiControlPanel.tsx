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

  forkEditMode: boolean
  saveForkRoiDraftLoading: boolean
  setForkEditMode: (v: boolean) => void

  forkDraft?: {
    x: number
    y: number
    width: number
    height: number
  }

  setForkDraft: (cameraId: string, patch: Partial<any>) => void
  resetForkDraftFromConfig: (cameraId: string) => void
  saveForkDraft: (cameraId: string) => void
}

export function ForkRoiControlPanel({
  cameraId,
  forkEditMode,
  setForkEditMode,
  saveForkRoiDraftLoading,
  forkDraft,
  setForkDraft,
  resetForkDraftFromConfig,
  saveForkDraft,
}: Props) {
  return (
    <Card size="small" styles={{ body: { padding: 10 } }} title="Fork ROI">
      <Flex vertical gap={10}>
        {/* ===== 編輯控制 ===== */}
        <Space.Compact block>
          <Button
            size="small"
            type={forkEditMode ? "primary" : "default"}
            icon={<EditOutlined />}
            onClick={() => setForkEditMode(!forkEditMode)}
          >
            {forkEditMode ? "Editing" : "Edit"}
          </Button>

          <Button
            size="small"
            icon={<ReloadOutlined />}
            disabled={!forkEditMode}
            onClick={() => resetForkDraftFromConfig(cameraId)}
          >
            Reset
          </Button>

          <Button
            size="small"
            type="primary"
            icon={<SaveOutlined />}
            loading={saveForkRoiDraftLoading}
            disabled={!forkEditMode}
            onClick={() => saveForkDraft(cameraId)}
          >
            Save
          </Button>
        </Space.Compact>

        <Flex align="center" justify="space-between" gap={12}>
          {/* ===== 移動 ===== */}
          <Flex vertical gap={6}>
            <div style={{ textAlign: "center" }}>
              <Button
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={!forkEditMode || !forkDraft}
                onClick={() =>
                  forkDraft &&
                  setForkDraft(cameraId, { y: forkDraft.y - 5 })
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
                disabled={!forkEditMode || !forkDraft}
                onClick={() =>
                  forkDraft &&
                  setForkDraft(cameraId, { x: forkDraft.x - 5 })
                }
              />
              <Button size="small" disabled>
                Fork
              </Button>
              <Button
                size="small"
                icon={<ArrowRightOutlined />}
                disabled={!forkEditMode || !forkDraft}
                onClick={() =>
                  forkDraft &&
                  setForkDraft(cameraId, { x: forkDraft.x + 5 })
                }
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <Button
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={!forkEditMode || !forkDraft}
                onClick={() =>
                  forkDraft &&
                  setForkDraft(cameraId, { y: forkDraft.y + 5 })
                }
              />
            </div>
          </Flex>

          {/* ===== 尺寸 ===== */}
          <Flex vertical gap={6} style={{ flex: 1 }}>
            <Space.Compact block>
              <Button
                size="small"
                icon={<MinusOutlined />}
                disabled={!forkEditMode || !forkDraft}
                onClick={() =>
                  forkDraft &&
                  setForkDraft(cameraId, {
                    width: Math.max(10, forkDraft.width - 5),
                    height: Math.max(10, forkDraft.height - 5),
                  })
                }
              >
                Size
              </Button>

              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={!forkEditMode || !forkDraft}
                onClick={() =>
                  forkDraft &&
                  setForkDraft(cameraId, {
                    width: forkDraft.width + 5,
                    height: forkDraft.height + 5,
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