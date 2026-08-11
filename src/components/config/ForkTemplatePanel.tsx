import { useEffect } from "react"
import {
    Card,
    Button,
    Upload,
    Space,
    Switch,
    InputNumber,
    Typography,
    message,
    Divider,
    Tag,
    Image,
    Row,
    Col,
} from "antd"
import { UploadOutlined } from "@ant-design/icons"
import { useForkTemplateStore } from "../../store/forkTemplateStore"
import { TemplateCropEditor } from "./TemplateCropEditor"
import { RefPointMarkerEditor } from "./RefPointMarkerEditor"

const { Text } = Typography

type Props = {
    cameraId: string
}
type TemplatePreviewSectionProps = {
    templateImageUrl?: string
    previewImageUrl?: string
}

export default function TemplatePreviewSection({
    templateImageUrl,
    previewImageUrl,
}: TemplatePreviewSectionProps) {
    const hasTemplate = !!templateImageUrl
    const hasPreview = !!previewImageUrl

    if (!hasTemplate && !hasPreview) return null

    return (
        <Card size="small" title="Saved Images">
            {hasTemplate && hasPreview ? (
                <Row gutter={12}>
                    <Col span={12}>
                        <div>
                            <Text type="secondary">Saved Template</Text>
                            <div style={{ marginTop: 8 }}>
                                <Image
                                    src={templateImageUrl}
                                    alt="saved-template"
                                    style={{ width: "100%", borderRadius: 8 }}
                                />
                            </div>
                        </div>
                    </Col>

                    <Col span={12}>
                        <div>
                            <Text type="secondary">Saved Preview</Text>
                            <div style={{ marginTop: 8 }}>
                                <Image
                                    src={previewImageUrl}
                                    alt="saved-preview"
                                    style={{ width: "100%", borderRadius: 8 }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            ) : hasTemplate ? (
                <div>
                    <Text type="secondary">Saved Template</Text>
                    <div style={{ marginTop: 8 }}>
                        <Image
                            src={templateImageUrl}
                            alt="saved-template"
                            style={{ width: "100%", borderRadius: 8 }}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <Text type="secondary">Saved Preview</Text>
                    <div style={{ marginTop: 8 }}>
                        <Image
                            src={previewImageUrl}
                            alt="saved-preview"
                            style={{ width: "100%", borderRadius: 8 }}
                        />
                    </div>
                </div>
            )}
        </Card>
    )
}

export function ForkTemplatePanel({ cameraId }: Props) {
    const fetchTemplate = useForkTemplateStore((s) => s.fetchTemplate)
    const uploadImage = useForkTemplateStore((s) => s.uploadImage)
    const save = useForkTemplateStore((s) => s.save)
    const remove = useForkTemplateStore((s) => s.remove)
    const resetDraftFromTemplate = useForkTemplateStore((s) => s.resetDraftFromTemplate)
    const clearPoints = useForkTemplateStore((s) => s.clearPoints)

    const template = useForkTemplateStore((s) => s.templateByCameraId[cameraId])
    const draft = useForkTemplateStore((s) => s.draftByCameraId[cameraId])

    const setEnabled = useForkTemplateStore((s) => s.setEnabled)
    const setThreshold = useForkTemplateStore((s) => s.setThreshold)
    const setHoughVotesThreshold = useForkTemplateStore(
        (s) => s.setHoughVotesThreshold
    )
    const setCrop = useForkTemplateStore((s) => s.setCrop)
    const setRefPoints = useForkTemplateStore((s) => s.setRefPoints)

    useEffect(() => {
        fetchTemplate(cameraId)
    }, [cameraId, fetchTemplate])

    const imageUrl =
        draft?.sourceImageUrl ||
        template?.source_image_path ||
        draft?.previewImageUrl ||
        template?.preview_image_path ||
        draft?.templateImageUrl ||
        template?.template_image_path

    const pointCount = draft?.refPoints?.length ?? 0

    const hasValidCrop =
        !!draft?.crop &&
        draft.crop.width > 0 &&
        draft.crop.height > 0

    const savedPointCount = template?.ref_points?.length ?? 0
    const hasSavedTemplate = !!template?.id
    return (
        <Card size="small" title="Fork Template">
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Space wrap>
                    <Upload
                        showUploadList={false}
                        beforeUpload={(file) => {
                            uploadImage(cameraId, file)
                            return false
                        }}
                    >
                        <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>

                    <Button
                        onClick={async () => {
                            await fetchTemplate(cameraId)
                            message.success("template reloaded")
                        }}
                    >
                        Reload
                    </Button>
                </Space>

                <Card size="small" title="Current Saved Config">
                    <Space direction="vertical" size={6} style={{ width: "100%" }}>
                        <Space wrap>
                            <Text type="secondary">Status</Text>
                            {hasSavedTemplate ? (
                                <Tag color="green">EXISTS</Tag>
                            ) : (
                                <Tag color="default">EMPTY</Tag>
                            )}

                            {template?.enabled ? (
                                <Tag color="green">ENABLED</Tag>
                            ) : (
                                <Tag color="red">DISABLED</Tag>
                            )}
                        </Space>

                        <Text type="secondary">
                            Version: {template?.version ?? "-"}
                        </Text>

                        <Text type="secondary">
                            Threshold: {template?.match_score_threshold ?? "-"}
                        </Text>

                        <Text type="secondary">
                            Crop:
                            {" "}
                            {template
                                ? `x=${template.crop_x}, y=${template.crop_y}, w=${template.crop_width}, h=${template.crop_height}`
                                : "-"}
                        </Text>

                        <Text type="secondary">
                            Saved Points: {savedPointCount}/4
                        </Text>
                    </Space>
                </Card>

                {draft?.templateImageUrl || draft?.previewImageUrl ? (
                    <Row gutter={12}>
                        {draft?.templateImageUrl ? (
                            <Col span={draft?.previewImageUrl ? 12 : 24}>
                                <Card size="small" bodyStyle={{ padding: 8 }}>
                                    <Text type="secondary">Saved Template</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Image
                                            src={draft.templateImageUrl}
                                            alt="saved-template"
                                            style={{ width: "100%", borderRadius: 8 }}
                                        />
                                    </div>
                                </Card>
                            </Col>
                        ) : null}

                        {draft?.previewImageUrl ? (
                            <Col span={draft?.templateImageUrl ? 12 : 24}>
                                <Card size="small" bodyStyle={{ padding: 8 }}>
                                    <Text type="secondary">Saved Preview</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Image
                                            src={draft.previewImageUrl}
                                            alt="saved-preview"
                                            style={{ width: "100%", borderRadius: 8 }}
                                        />
                                    </div>
                                </Card>
                            </Col>
                        ) : null}
                    </Row>
                ) : null}

                <Divider style={{ margin: "4px 0" }} />

                <Space>
                    <span>Enabled</span>
                    <Switch
                        checked={draft?.enabled ?? template?.enabled ?? true}
                        onChange={(v) => setEnabled(cameraId, v)}
                    />
                </Space>

                <Space>
                    <span>Hough Votes Threshold</span>
                    <InputNumber
                        min={1}
                        step={1}
                        value={draft?.houghVotesThreshold ?? template?.hough_votes_threshold ?? 50}
                        onChange={(v) => {
                            if (typeof v === "number") {
                                setHoughVotesThreshold(cameraId, Number(v ?? 50))
                            }
                        }}
                    />
                </Space>

                <Space>
                    <span>Match Score Threshold</span>
                    <InputNumber
                        value={draft?.matchScoreThreshold ?? template?.match_score_threshold ?? 0.7}
                        step={0.05}
                        min={0}
                        max={1}
                        onChange={(v) => {
                            if (typeof v === "number") {
                                setThreshold(cameraId, v)
                            }
                        }}
                    />
                </Space>

                <Typography.Text type="secondary">
                    Crop (source image space)
                </Typography.Text>
                <TemplateCropEditor
                    imageUrl={imageUrl ?? undefined}
                    crop={draft?.crop}
                    onChange={(crop) => setCrop(cameraId, crop)}
                />

                <Typography.Text type="secondary">
                    Reference Points ({pointCount}/4)
                </Typography.Text>
                <RefPointMarkerEditor
                    imageUrl={imageUrl ?? undefined}
                    points={draft?.refPoints ?? []}
                    onChange={(points) => setRefPoints(cameraId, points)}
                />

                <Space wrap>
                    <Button onClick={() => clearPoints(cameraId)}>
                        Clear Points
                    </Button>

                    <Button onClick={() => resetDraftFromTemplate(cameraId)}>
                        Reset
                    </Button>

                    <Button
                        type="primary"
                        onClick={async () => {
                            if (!hasValidCrop) {
                                message.error("need valid crop")
                                return
                            }

                            if (pointCount !== 4) {
                                message.error("need 4 points")
                                return
                            }

                            await save(cameraId)
                            await fetchTemplate(cameraId)
                            message.success("template saved")
                        }}
                    >
                        Save
                    </Button>

                    <Button
                        danger
                        onClick={async () => {
                            await remove(cameraId)
                            await fetchTemplate(cameraId)
                            message.success("template deleted")
                        }}
                    >
                        Delete
                    </Button>
                </Space>
            </Space>
        </Card>
    )
}
