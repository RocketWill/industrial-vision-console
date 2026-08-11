import { useEffect, useState } from "react"
import { Button, Flex, Space, Table, Tag, Typography, DatePicker, Modal, Radio } from "antd"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import type { SorterResult } from "antd/es/table/interface"
import dayjs from "dayjs"

import { useWaferFinalResultStore } from "../../store/waferFinalResultStore"
import type { WaferFinalResult } from "../../api/waferFinalResults"
import { useWaferFinalReportExportStore } from "../../store/waferFinalReportExportStore"

const { Text } = Typography
const { RangePicker } = DatePicker

type Props = {
    cameraId: string
}

export default function WaferFinalTable({ cameraId }: Props) {
    const ensureCameraState = useWaferFinalResultStore((s) => s.ensureCameraState)
    const fetchResults = useWaferFinalResultStore((s) => s.fetchResults)
    const setPagination = useWaferFinalResultStore((s) => s.setPagination)
    const setSort = useWaferFinalResultStore((s) => s.setSort)
    const state = useWaferFinalResultStore((s) => s.byCameraId[cameraId])
    const setTimeRange = useWaferFinalResultStore((s) => s.setTimeRange)
    const [exportModalOpen, setExportModalOpen] = useState(false)
    const [exportOrder, setExportOrder] = useState<"asc" | "desc">("asc")

    const { exportResults, exporting } = useWaferFinalReportExportStore()

    useEffect(() => {
        ensureCameraState(cameraId)
    }, [cameraId, ensureCameraState])

    useEffect(() => {
        if (!state) return
        void fetchResults(cameraId)
    }, [
        cameraId,
        state?.offset,
        state?.limit,
        state?.sortBy,
        state?.order,
        state?.startTime,
        state?.endTime,
        fetchResults,
    ])

    if (!state) return null

    const columns: ColumnsType<WaferFinalResult> = [
        {
            title: "Session",
            dataIndex: "wafer_session_id",
            key: "wafer_session_id",
            sorter: true,
            width: 90,
        },
        {
            title: "Wafer ID",
            dataIndex: "wafer_id",
            key: "wafer_id",
            sorter: true,
            width: 220,
            render: (value: string) => <Text code>{value}</Text>,
        },
        {
            title: "First Time",
            dataIndex: "first_time",
            key: "first_time",
            sorter: true,
            width: 180,
            render: (value?: string) =>
                value ? dayjs(value).add(8, "hour").format("YYYY-MM-DD HH:mm:ss") : "-",
        },
        {
            title: "Last Time",
            dataIndex: "last_time",
            key: "last_time",
            sorter: true,
            width: 180,
            render: (value?: string) =>
                value ? dayjs(value).add(8, "hour").format("YYYY-MM-DD HH:mm:ss") : "-",
        },
        {
            title: "Final",
            dataIndex: "final_overall_ok",
            key: "final_overall_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Align",
            dataIndex: "final_alignment_ok",
            key: "final_alignment_ok",
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
                    <Tag color={record.final_distance_1_ok ? "success" : "error"}>P1</Tag>
                    <Tag color={record.final_distance_2_ok ? "success" : "error"}>P2</Tag>
                    <Tag color={record.final_distance_3_ok ? "success" : "error"}>P3</Tag>
                    <Tag color={record.final_distance_4_ok ? "success" : "error"}>P4</Tag>
                </Space>
            ),
        },
        {
            title: "Burn",
            dataIndex: "final_burn_ok",
            key: "final_burn_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Crack",
            dataIndex: "final_crack_ok",
            key: "final_crack_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Defect",
            dataIndex: "final_defect_ok",
            key: "final_defect_ok",
            sorter: true,
            width: 90,
            render: (v: boolean) => (
                <Tag color={v ? "success" : "error"}>{v ? "OK" : "NG"}</Tag>
            ),
        },
        {
            title: "Inspection",
            dataIndex: "inspection_count",
            key: "inspection_count",
            sorter: true,
            width: 100,
        },
        {
            title: "OK",
            dataIndex: "ok_count",
            key: "ok_count",
            sorter: true,
            width: 80,
        },
        {
            title: "NG",
            dataIndex: "ng_count",
            key: "ng_count",
            sorter: true,
            width: 80,
        }
    ]

    const pagination: TablePaginationConfig = {
        current: Math.floor(state.offset / state.limit) + 1,
        pageSize: state.limit,
        total: state.total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
    }

    const handleConfirmExport = async () => {
        await exportResults({
            camera_id: cameraId,
            start_time: state.startTime,
            end_time: state.endTime,
            sort_by: state.sortBy,
            order: exportOrder,
        })

        setExportModalOpen(false)
    }

    return (
        <Flex vertical gap={12} style={{ height: "100%" }}>
            <Flex align="center" justify="space-between" wrap gap={12}>
                <Space wrap>
                    <RangePicker
                        showTime
                        value={
                            state.startTime && state.endTime
                                ? [dayjs(state.startTime), dayjs(state.endTime)]
                                : undefined
                        }
                        onChange={(values) => {
                            if (!values) {
                                setTimeRange(cameraId, undefined, undefined)
                                return
                            }

                            setTimeRange(
                                cameraId,
                                values[0]?.toISOString(),
                                values[1]?.toISOString()
                            )
                        }}
                    />

                    <Button
                        onClick={() => {
                            setTimeRange(cameraId, undefined, undefined)
                            setPagination(cameraId, 0, state.limit)
                            void fetchResults(cameraId)
                        }}
                    >
                        Clear
                    </Button>

                    <Button
                        onClick={() => {
                            setPagination(cameraId, 0, state.limit)
                            void fetchResults(cameraId)
                        }}
                    >
                        Refresh
                    </Button>

                    <Button
                        onClick={() => {
                            setExportModalOpen(true)
                        }}
                        type="primary"
                    >
                        Export Excel
                    </Button>
                </Space>

                <Text type="secondary">Total: {state.total}</Text>
            </Flex>

            <Table<WaferFinalResult>
                rowKey="id"
                size="small"
                loading={state.loading}
                columns={columns}
                dataSource={state.items}
                pagination={pagination}
                scroll={{ x: 1600, y: 420 }}
                onChange={(pg, _filters, sorter) => {
                    const current = pg.current ?? 1
                    const pageSize = pg.pageSize ?? state.limit
                    setPagination(cameraId, (current - 1) * pageSize, pageSize)

                    const s = sorter as SorterResult<WaferFinalResult>
                    if (s.field && typeof s.field === "string") {
                        setSort(cameraId, s.field, s.order === "ascend" ? "asc" : "desc")
                    }
                }}
            />
            <Modal
                title="Export Excel"
                open={exportModalOpen}
                onCancel={() => setExportModalOpen(false)}
                onOk={() => {
                    void handleConfirmExport()
                }}
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