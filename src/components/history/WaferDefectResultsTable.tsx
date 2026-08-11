import { useEffect, useState } from "react"
import {
  Alert,
  Button,
  DatePicker,
  Flex,
  Image,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import { DownloadOutlined } from "@ant-design/icons"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import type { SorterResult } from "antd/es/table/interface"
import dayjs from "dayjs"

import { useWaferDefectResultStore } from "../../store/waferDefectResultStore"
import { useWaferDefectReportExportStore } from "../../store/waferDefectReportExportStore"
import type {
  WaferDefectProcessingStatus,
  WaferDefectResult,
  WaferDefectResultValue,
} from "../../types/waferDefectResult"

const { RangePicker } = DatePicker
const { Text } = Typography

type Props = {
  cameraId: string
}

function toImageUrl(path?: string | null) {
  if (!path) return undefined
  const normalized = path.replaceAll("\\", "/")
  return normalized.startsWith("/") ? normalized : `/${normalized}`
}

function formatPercent(value: number | null) {
  return value == null ? "-" : `${value.toFixed(2)}%`
}

function resultTag(result: WaferDefectResultValue) {
  const color = result === "OK" ? "success" : result === "BURN" ? "error" : "default"
  return <Tag color={color}>{result}</Tag>
}

function statusTag(status: WaferDefectProcessingStatus) {
  const color = {
    PENDING: "default",
    PROCESSING: "processing",
    DONE: "success",
    FAILED: "error",
  }[status]
  return <Tag color={color}>{status}</Tag>
}

function PreviewPanel({ selected }: { selected?: WaferDefectResult }) {
  const imageUrl = toImageUrl(selected?.image_path)
  const overlayUrl = toImageUrl(selected?.overlay_path)

  return (
    <Image.PreviewGroup>
      <Flex gap={12} wrap>
        {[
          { title: "Original", url: imageUrl },
          { title: "Overlay", url: overlayUrl },
        ].map(({ title, url }) => (
          <Flex
            key={title}
            vertical
            gap={8}
            style={{
              flex: "1 1 320px",
              minWidth: 0,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Text strong>{title}</Text>
            <div
              style={{
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {url ? (
                <Image
                  src={url}
                  alt={title}
                  style={{ maxHeight: 200, objectFit: "contain" }}
                />
              ) : (
                <Text type="secondary">No image</Text>
              )}
            </div>
          </Flex>
        ))}
      </Flex>
    </Image.PreviewGroup>
  )
}

export default function WaferDefectResultsTable({ cameraId }: Props) {
  const ensureCameraState = useWaferDefectResultStore((s) => s.ensureCameraState)
  const fetchResults = useWaferDefectResultStore((s) => s.fetchResults)
  const setTimeRange = useWaferDefectResultStore((s) => s.setTimeRange)
  const setFilters = useWaferDefectResultStore((s) => s.setFilters)
  const clearFilters = useWaferDefectResultStore((s) => s.clearFilters)
  const setPagination = useWaferDefectResultStore((s) => s.setPagination)
  const setSort = useWaferDefectResultStore((s) => s.setSort)
  const setSelectedRowId = useWaferDefectResultStore((s) => s.setSelectedRowId)
  const state = useWaferDefectResultStore((s) => s.byCameraId[cameraId])
  const exportResults = useWaferDefectReportExportStore((s) => s.exportResults)
  const exporting = useWaferDefectReportExportStore((s) => s.exporting)

  const [waferIdInput, setWaferIdInput] = useState("")
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportOrder, setExportOrder] = useState<"asc" | "desc">("desc")
  const query = state?.query

  useEffect(() => {
    ensureCameraState(cameraId)
  }, [cameraId, ensureCameraState])

  useEffect(() => {
    if (!query) return
    void fetchResults(cameraId)
  }, [cameraId, query, fetchResults])

  if (!state) return null

  const columns: ColumnsType<WaferDefectResult> = [
    {
      title: "Session",
      dataIndex: "wafer_session_id",
      sorter: true,
      width: 90,
    },
    {
      title: "Wafer ID",
      dataIndex: "wafer_id",
      sorter: true,
      width: 210,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: "Snapshot",
      dataIndex: "snapshot_index",
      sorter: true,
      width: 95,
    },
    {
      title: "Created Time",
      dataIndex: "created_at",
      sorter: true,
      width: 180,
      render: (value: string) =>
        dayjs(value).add(8, "hour").format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Status",
      dataIndex: "processing_status",
      sorter: true,
      width: 115,
      render: statusTag,
    },
    {
      title: "Result",
      dataIndex: "result",
      sorter: true,
      width: 90,
      render: resultTag,
    },
    {
      title: "Severity",
      dataIndex: "severity_score",
      sorter: true,
      width: 95,
      render: (value: number | null) => value?.toFixed(2) ?? "-",
    },
    {
      title: "Bright Angle",
      dataIndex: "bright_angle_percent",
      width: 120,
      render: formatPercent,
    },
    {
      title: "Dark Angle",
      dataIndex: "dark_angle_percent",
      width: 115,
      render: formatPercent,
    },
    {
      title: "Bright Area",
      dataIndex: "bright_area_percent",
      width: 115,
      render: formatPercent,
    },
    {
      title: "Dark Area",
      dataIndex: "dark_area_percent",
      width: 110,
      render: formatPercent,
    },
    {
      title: "Max Component",
      dataIndex: "max_component_percent",
      width: 140,
      render: formatPercent,
    },
    {
      title: "Config",
      dataIndex: "config_version",
      width: 80,
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "Error",
      dataIndex: "error_message",
      width: 180,
      ellipsis: true,
      render: (value: string | null) =>
        value ? <Tooltip title={value}>{value}</Tooltip> : "-",
    },
  ]

  const pagination: TablePaginationConfig = {
    current: Math.floor(state.query.offset / state.query.limit) + 1,
    pageSize: state.query.limit,
    total: state.total,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
  }

  const selected = state.items.find((item) => item.id === state.selectedRowId)

  const handleExport = async () => {
    try {
      await exportResults({
        camera_id: cameraId,
        wafer_id: state.query.waferId,
        processing_status: state.query.processingStatus,
        result: state.query.result,
        start_time: state.query.startTime,
        end_time: state.query.endTime,
        sort_by: state.query.sortBy,
        order: exportOrder,
      })
      setExportModalOpen(false)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "Export failed")
    }
  }

  return (
    <Flex vertical gap={12} style={{ height: "100%" }}>
      <Flex align="center" justify="space-between" wrap gap={12}>
        <Space wrap>
          <RangePicker
            showTime
            value={
              state.query.startTime && state.query.endTime
                ? [
                    dayjs(state.query.startTime).add(8, "hour"),
                    dayjs(state.query.endTime).add(8, "hour"),
                  ]
                : undefined
            }
            onChange={(values) => {
              setTimeRange(
                cameraId,
                values?.[0]?.subtract(8, "hour").format("YYYY-MM-DD HH:mm:ss"),
                values?.[1]?.subtract(8, "hour").format("YYYY-MM-DD HH:mm:ss"),
              )
            }}
          />
          <Input.Search
            allowClear
            placeholder="Wafer ID"
            value={waferIdInput}
            onChange={(event) => setWaferIdInput(event.target.value)}
            onSearch={(value) =>
              setFilters(cameraId, {
                waferId: value.trim() || undefined,
                processingStatus: state.query.processingStatus,
                result: state.query.result,
              })
            }
            style={{ width: 210 }}
          />
          <Select
            allowClear
            placeholder="Processing status"
            value={state.query.processingStatus}
            options={["PENDING", "PROCESSING", "DONE", "FAILED"].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(processingStatus) =>
              setFilters(cameraId, {
                waferId: state.query.waferId,
                processingStatus,
                result: state.query.result,
              })
            }
            style={{ width: 170 }}
          />
          <Select
            allowClear
            placeholder="Result"
            value={state.query.result}
            options={["OK", "BURN", "UNKNOWN"].map((value) => ({ value, label: value }))}
            onChange={(result) =>
              setFilters(cameraId, {
                waferId: state.query.waferId,
                processingStatus: state.query.processingStatus,
                result,
              })
            }
            style={{ width: 120 }}
          />
          <Button
            onClick={() => {
              setWaferIdInput("")
              clearFilters(cameraId)
            }}
          >
            Clear
          </Button>
          <Button onClick={() => void fetchResults(cameraId)}>Refresh</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => setExportModalOpen(true)}
          >
            Export Excel
          </Button>
        </Space>
        <Text type="secondary">Total: {state.total}</Text>
      </Flex>

      {state.error && (
        <Alert type="error" showIcon message="Unable to load defect results" description={state.error} />
      )}

      <Table<WaferDefectResult>
        rowKey="id"
        size="small"
        loading={state.loading}
        columns={columns}
        dataSource={state.items}
        pagination={pagination}
        scroll={{ x: 1800, y: 360 }}
        rowSelection={{
          type: "radio",
          selectedRowKeys: state.selectedRowId == null ? [] : [state.selectedRowId],
          onChange: (keys) => setSelectedRowId(cameraId, keys[0] as number | undefined),
        }}
        onRow={(record) => ({
          onClick: () => setSelectedRowId(cameraId, record.id),
        })}
        onChange={(page, _filters, sorter) => {
          const current = page.current ?? 1
          const pageSize = page.pageSize ?? state.query.limit
          setPagination(cameraId, (current - 1) * pageSize, pageSize)

          const nextSorter = sorter as SorterResult<WaferDefectResult>
          if (typeof nextSorter.field === "string" && nextSorter.order) {
            setSort(
              cameraId,
              nextSorter.field,
              nextSorter.order === "ascend" ? "asc" : "desc",
            )
          }
        }}
      />

      <PreviewPanel selected={selected} />

      <Modal
        title="Export Defect Results"
        open={exportModalOpen}
        confirmLoading={exporting}
        okText="Download"
        onCancel={() => setExportModalOpen(false)}
        onOk={() => void handleExport()}
      >
        <Radio.Group
          value={exportOrder}
          onChange={(event) => setExportOrder(event.target.value)}
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
