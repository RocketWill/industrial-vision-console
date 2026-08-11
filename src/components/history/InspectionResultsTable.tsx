import { useEffect, useState } from "react"
import { Button, DatePicker, Flex, Image, Modal, Radio, Space, Switch, Table, Tag, Tooltip, Typography } from "antd"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import type { SorterResult } from "antd/es/table/interface"
import dayjs from "dayjs"

import { useInspectionResultStore } from "../../store/inspectionResultStore"
import type { InspectionResultItem } from "../../types/inspectionResult"
import { useInspectionReportExportStore } from "../../store/inspectionReportExportStore"
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons"


const { RangePicker } = DatePicker
const { Text } = Typography

type Props = {
    cameraId: string
}

type PreviewCardProps = {
    title: string
    imageUrl?: string
    originalUrl?: string
    onOpen: () => void
}

function toImageUrl(path?: string | null) {
    if (!path) return undefined
    const normalized = path.replaceAll("\\", "/")
    return normalized.startsWith("/") ? normalized : `/${normalized}`
}

function PreviewCard({ title, imageUrl, originalUrl, onOpen }: PreviewCardProps) {
    return (
        <Flex
            vertical
            gap={8}
            style={{
                flex: 1,
                minWidth: 0,
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: 12,
                background: "rgba(255,255,255,0.02)",
            }}
        >
            <Flex align="center" justify="space-between">
                <Text strong>{title}</Text>
                <Space>
                    <Tooltip title="Download original RAW image (full resolution)">
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            disabled={!originalUrl}
                            onClick={() => {
                                if (!originalUrl) return

                                const link = document.createElement("a")
                                link.href = originalUrl

                                const filename = originalUrl.split("/").pop() || "raw.jpg"
                                link.download = filename

                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                            }}
                        >
                            RAW
                        </Button>
                    </Tooltip>

                    <Tooltip title="Open preview image">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={onOpen}
                        >
                            Preview
                        </Button>
                    </Tooltip>
                </Space>
            </Flex>

            <div
                style={{
                    height: 180,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                ) : (
                    <Text type="secondary">No image</Text>
                )}
            </div>
        </Flex>
    )
}

export default function InspectionResultsTable({ cameraId }: Props) {
    const ensureCameraState = useInspectionResultStore((s) => s.ensureCameraState)
    const fetchResults = useInspectionResultStore((s) => s.fetchResults)
    const setTimeRange = useInspectionResultStore((s) => s.setTimeRange)
    const setPagination = useInspectionResultStore((s) => s.setPagination)
    const setSort = useInspectionResultStore((s) => s.setSort)
    const setSelectedRowId = useInspectionResultStore((s) => s.setSelectedRowId)
    const openPreview = useInspectionResultStore((s) => s.openPreview)
    const closePreview = useInspectionResultStore((s) => s.closePreview)
    const exportReport = useInspectionReportExportStore((s) => s.exportReport)
    const exporting = useInspectionReportExportStore((s) => s.exporting)
    const state = useInspectionResultStore((s) => s.byCameraId[cameraId])

    const [exportModalOpen, setExportModalOpen] = useState(false)
    const [exportOrder, setExportOrder] = useState<"asc" | "desc">("desc")
    const [showRefMissRows, setShowRefMissRows] = useState(false)

    useEffect(() => {
        ensureCameraState(cameraId)
    }, [cameraId, ensureCameraState])

    useEffect(() => {
        if (!state) return
        fetchResults(cameraId)
    }, [
        cameraId,
        state?.query.startTime,
        state?.query.endTime,
        state?.query.offset,
        state?.query.limit,
        state?.query.sortBy,
        state?.query.order,
        fetchResults,
    ])

    useEffect(() => {
        if (!state || showRefMissRows || state.selectedRowId == null) return

        const selectedItem = state.items.find((item) => item.id === state.selectedRowId)
        if (selectedItem && !selectedItem.reference_points_found) {
            closePreview(cameraId)
            setSelectedRowId(cameraId, undefined)
        }
    }, [
        cameraId,
        closePreview,
        setSelectedRowId,
        showRefMissRows,
        state?.items,
        state?.selectedRowId,
    ])

    if (!state) return null

    const columns: ColumnsType<InspectionResultItem> = [
        {
            title: "Session",
            dataIndex: "wafer_session_id",
            key: "session_id",
            sorter: true,
            width: 80,
        },
        {
            title: "Wafer ID",
            dataIndex: "wafer_id",
            key: "wafer_id",
            sorter: true,
            width: 200,
            render: (value: string) => <Text code>{value}</Text>,
        },
        {
            title: "Time",
            dataIndex: "inspection_time",
            key: "inspection_time",
            sorter: true,
            render: (value: string) => dayjs(value).add(8, "hour").format("YYYY-MM-DD HH:mm:ss"),
            width: 180,
        },
        {
            title: "Pass",
            dataIndex: "pass_direction",
            key: "pass_direction",
            width: 80,
            render: (value: string) => <Tag>{value}</Tag>,
        },
        {
            title: "Overall",
            dataIndex: "overall_ok",
            key: "overall_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Align",
            dataIndex: "alignment_ok",
            key: "alignment_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Ref Points",
            key: "ref_points",
            width: 220,
            render: (_, record) => (
                <Space size={4} wrap>
                    <Tag color={record.alignment_1_ok ? "success" : "error"}>P1</Tag>
                    <Tag color={record.alignment_2_ok ? "success" : "error"}>P2</Tag>
                    <Tag color={record.alignment_3_ok ? "success" : "error"}>P3</Tag>
                    <Tag color={record.alignment_4_ok ? "success" : "error"}>P4</Tag>
                </Space>
            ),
        },
        {
            title: "Defect",
            dataIndex: "defect_ok",
            key: "defect_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Wafer",
            dataIndex: "wafer_geometry_found",
            key: "wafer_geometry_found",
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "default"}>{v ? "Found" : "Miss"}</Tag>
            ),
        },
        {
            title: "Refs",
            dataIndex: "reference_points_found",
            key: "reference_points_found",
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "default"}>{v ? "Found" : "Miss"}</Tag>
            ),
        },
        {
            title: "Fork Score",
            dataIndex: "fork_match_score",
            key: "fork_match_score",
            sorter: true,
            width: 110,
            render: (v?: number | null) => (v == null ? "-" : v.toFixed(3)),
        },
        {
            title: "Geo Score",
            dataIndex: "wafer_geometry_score",
            key: "wafer_geometry_score",
            sorter: true,
            width: 110,
            render: (v?: number | null) => (v == null ? "-" : v.toFixed(3)),
        },
    ]

    const pagination: TablePaginationConfig = {
        current: Math.floor(state.query.offset / state.query.limit) + 1,
        pageSize: state.query.limit,
        total: state.total,
        showSizeChanger: true,
    }

    const visibleItems = showRefMissRows
        ? state.items
        : state.items.filter((item) => item.reference_points_found)

    const selectedRow = visibleItems.find((x) => x.id === state.selectedRowId)

    const originalItems = visibleItems
        .map((item) => ({
            id: item.id,
            url: toImageUrl(item.image_preview_path ?? item.image_path),
        }))
        .filter((item): item is { id: number; url: string } => Boolean(item.url))

    const overlayItems = visibleItems
        .map((item) => ({
            id: item.id,
            url: toImageUrl(item.overlay_preview_path ?? item.overlay_path),
        }))
        .filter((item): item is { id: number; url: string } => Boolean(item.url))

    const handleConfirmExport = async () => {
        try {
            await exportReport({
                camera_id: cameraId,

                start_time: state.query.startTime
                    ? dayjs(state.query.startTime).toISOString()
                    : undefined,

                end_time: state.query.endTime
                    ? dayjs(state.query.endTime).toISOString()
                    : undefined,

                sort_by: "inspection_time",

                order: exportOrder,

                include_raw_metrics: true,
                include_sessions_sheet: true,
                include_events_sheet: false,
            })

            setExportModalOpen(false)
        } catch (error) {
            console.error(error)
        }
    }

    const originalPreviewItems = originalItems.map((item) => ({
        src: item.url,
    }))

    const overlayPreviewItems = overlayItems.map((item) => ({
        src: item.url,
    }))

    const originalCurrentIndex = Math.max(
        0,
        originalItems.findIndex((item) => item.id === selectedRow?.id),
    )

    const overlayCurrentIndex = Math.max(
        0,
        overlayItems.findIndex((item) => item.id === selectedRow?.id),
    )


    return (
        <Flex vertical gap={12} style={{ height: "100%" }}>
            <Flex align="center" justify="space-between" wrap gap={12}>
                <Space wrap>
                    <RangePicker
                        showTime
                        value={[
                            state.query.startTime ? dayjs(state.query.startTime) : null,
                            state.query.endTime ? dayjs(state.query.endTime) : null,
                        ]}
                        onChange={(values) => {
                            const start = values?.[0]
                                ? values[0].subtract(8, "hour").format("YYYY-MM-DD HH:mm:ss")
                                : undefined

                            const end = values?.[1]
                                ? values[1].subtract(8, "hour").format("YYYY-MM-DD HH:mm:ss")
                                : undefined

                            setTimeRange(cameraId, start, end)
                        }}
                    />
                    <Button
                        onClick={() => {
                            setTimeRange(cameraId, undefined, undefined)
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        onClick={() => {
                            closePreview(cameraId)
                            setSelectedRowId(cameraId, undefined)
                            setPagination(cameraId, 0, state.query.limit)
                            void fetchResults(cameraId)
                        }}
                    >
                        Refresh
                    </Button>

                    <Button
                        type="primary"
                        loading={exporting}
                        onClick={() => {
                            setExportOrder("asc")
                            setExportModalOpen(true)
                        }}
                    >
                        Export Excel
                    </Button>
                    <Space align="center" size={8}>
                        <Text type="secondary">Show Ref Miss</Text>
                        <Switch
                            checked={showRefMissRows}
                            onChange={setShowRefMissRows}
                        />
                    </Space>
                </Space>

                <Text type="secondary">
                    Total: {state.total}
                </Text>
            </Flex>

            <Table<InspectionResultItem>
                rowKey="id"
                size="small"
                loading={state.loading}
                columns={columns}
                dataSource={visibleItems}
                pagination={pagination}
                scroll={{ x: 1000, y: 360 }}
                rowSelection={{
                    type: "radio",
                    selectedRowKeys: state.selectedRowId ? [state.selectedRowId] : [],
                    onChange: (keys) => {
                        const first = keys[0]
                        setSelectedRowId(cameraId, typeof first === "number" ? first : undefined)
                    },
                }}
                onRow={(record) => ({
                    onClick: () => setSelectedRowId(cameraId, record.id),
                })}
                onChange={(pg, _filters, sorter) => {
                    const current = pg.current ?? 1
                    const pageSize = pg.pageSize ?? state.query.limit
                    setPagination(cameraId, (current - 1) * pageSize, pageSize)

                    const s = sorter as SorterResult<InspectionResultItem>
                    if (s.field && typeof s.field === "string") {
                        setSort(cameraId, s.field, s.order === "ascend" ? "asc" : "desc")
                    }
                }}
            />

            <Flex gap={12} style={{ flex: "0 0 auto" }}>
                <PreviewCard
                    title="Original"
                    imageUrl={toImageUrl(selectedRow?.image_thumb_path ?? selectedRow?.image_preview_path ?? selectedRow?.image_path)}
                    originalUrl={toImageUrl(selectedRow?.image_path)}
                    onOpen={() => openPreview(cameraId, "original")}
                />
                <PreviewCard
                    title="Overlay"
                    imageUrl={toImageUrl(selectedRow?.overlay_thumb_path ?? selectedRow?.overlay_preview_path ?? selectedRow?.overlay_path)}
                    originalUrl={toImageUrl(selectedRow?.overlay_path)}
                    onOpen={() => openPreview(cameraId, "overlay")}
                />
            </Flex>

            <Image.PreviewGroup
                items={originalPreviewItems}
                preview={{
                    visible: state.previewVisible && state.previewKind === "original",
                    current: originalCurrentIndex,
                    onChange: (current) => {
                        const next = originalItems[current]
                        if (next) {
                            setSelectedRowId(cameraId, next.id)
                        }
                    },
                    onVisibleChange: (visible) => {
                        if (!visible) {
                            closePreview(cameraId)
                        }
                    },
                }}
            >
                {selectedRow && state.previewKind === "original" && (
                    <Image
                        src={toImageUrl(selectedRow.image_preview_path ?? selectedRow.image_path)}
                        style={{ display: "none" }}
                    />
                )}
            </Image.PreviewGroup>

            <Image.PreviewGroup
                items={overlayPreviewItems}
                preview={{
                    visible: state.previewVisible && state.previewKind === "overlay",
                    current: overlayCurrentIndex,
                    onChange: (current) => {
                        const next = overlayItems[current]
                        if (next) {
                            setSelectedRowId(cameraId, next.id)
                        }
                    },
                    onVisibleChange: (visible) => {
                        if (!visible) {
                            closePreview(cameraId)
                        }
                    },
                }}
            >
                {selectedRow && state.previewKind === "overlay" && (
                    <Image
                        src={toImageUrl(selectedRow.overlay_preview_path ?? selectedRow.overlay_path)}
                        style={{ display: "none" }}
                    />
                )}
            </Image.PreviewGroup>

            <Modal
                title="Export Excel"
                open={exportModalOpen}
                onCancel={() => setExportModalOpen(false)}
                onOk={handleConfirmExport}
                confirmLoading={exporting}
                okText="Download"
            >
                <Radio.Group
                    value={exportOrder}
                    onChange={(e) => setExportOrder(e.target.value)}
                >
                    <Space direction="vertical">
                        <Radio value="desc">Newest first</Radio>
                        <Radio value="asc">Oldest first</Radio>
                    </Space>
                </Radio.Group>
            </Modal>
        </Flex>
    )
}
