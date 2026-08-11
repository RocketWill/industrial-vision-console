import { useEffect, useMemo, useState } from "react"
import { UploadOutlined } from "@ant-design/icons"
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
  Upload,
  message,
} from "antd"
import type { TableProps, UploadProps } from "antd"
import { useWaferEllipseStore } from "../../store/waferEllipseStore"
import type { WaferEllipseConfig } from "../../types/waferEllipse"

const { TextArea } = Input
const { Text } = Typography

type ConfigPath = Array<string | number>

type MaskRect = {
  x: number
  y: number
  w: number
  h: number
}

type ParamField =
  | {
      key: string
      label: string
      type: "number"
      min?: number
      max?: number
      step?: number
    }
  | {
      key: string
      label: string
      type: "boolean"
    }
  | {
      key: string
      label: string
      type: "select"
      options: Array<{ label: string; value: string }>
    }

type Props = {
  cameraId: string
}

const PARAM_FIELDS: ParamField[] = [
  {
    key: "blur_type",
    label: "Blur",
    type: "select",
    options: [
      { label: "Gaussian", value: "gaussian" },
      { label: "Median", value: "median" },
      { label: "None", value: "none" },
    ],
  },
  { key: "blur_ksize", label: "Blur K", type: "number", min: 1, step: 2 },
  { key: "clahe_enable", label: "CLAHE", type: "boolean" },
  { key: "clahe_clip", label: "CLAHE Clip", type: "number", min: 0, step: 0.1 },
  { key: "clahe_tile", label: "CLAHE Tile", type: "number", min: 1 },
  { key: "normalize_enable", label: "Normalize", type: "boolean" },
  { key: "canny_low", label: "Canny Low", type: "number", min: 0 },
  { key: "canny_high", label: "Canny High", type: "number", min: 0 },
  { key: "edge_dilate_size", label: "Dilate", type: "number", min: 0 },
  { key: "edge_erode_size", label: "Erode", type: "number", min: 0 },
  { key: "radius_tolerance_pct", label: "Radius Tol %", type: "number", min: 0 },
  { key: "center_tolerance_px", label: "Center Tol", type: "number", min: 0 },
  { key: "min_contour_points", label: "Min Contour", type: "number", min: 0 },
  { key: "min_arc_length", label: "Min Arc", type: "number", min: 0 },
  { key: "min_area", label: "Min Area", type: "number", min: 0 },
  { key: "max_axis_ratio", label: "Max Axis", type: "number", min: 0, step: 0.1 },
  { key: "min_edge_points", label: "Min Edge", type: "number", min: 0 },
  { key: "fit_band_width", label: "Fit Band", type: "number", min: 0 },
  { key: "use_robust_partial_fit", label: "Robust Fit", type: "boolean" },
  { key: "mask_dilate_px", label: "Mask Dilate", type: "number", min: 0 },
]

const formItemStyle = {
  marginBottom: 6,
}

const sectionStyle = {
  marginTop: 4,
  marginBottom: 8,
}

const numberStyle = {
  width: 82,
}

const paramNumberStyle = {
  width: 104,
}

const selectStyle = {
  width: 116,
}

function cloneConfig(config: WaferEllipseConfig) {
  return JSON.parse(JSON.stringify(config)) as WaferEllipseConfig
}

function updateByPath(
  config: WaferEllipseConfig,
  path: ConfigPath,
  value: unknown
) {
  const next = cloneConfig(config)
  let cursor = next as Record<string, unknown>

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    const current = cursor[key as keyof typeof cursor]

    if (current === undefined || current === null) {
      cursor[key as keyof typeof cursor] =
        typeof path[i + 1] === "number" ? [] : {}
    }

    cursor = cursor[key as keyof typeof cursor] as Record<string, unknown>
  }

  const lastKey = path[path.length - 1]
  cursor[lastKey as keyof typeof cursor] = value

  return next
}

export default function WaferEllipsePanel({ cameraId }: Props) {
  const fetchConfig = useWaferEllipseStore((s) => s.fetchConfig)
  const setConfig = useWaferEllipseStore((s) => s.setConfig)
  const saveConfig = useWaferEllipseStore((s) => s.saveConfig)
  const config = useWaferEllipseStore((s) => s.configByCameraId[cameraId])
  const saveLoading = useWaferEllipseStore((s) => s.saveLoading)

  const [text, setText] = useState("")
  const [activeTab, setActiveTab] = useState("structured")

  useEffect(() => {
    fetchConfig(cameraId).catch(() => {})
  }, [cameraId, fetchConfig])

  useEffect(() => {
    if (config) {
      setText(JSON.stringify(config, null, 2))
    }
  }, [config])

  const parsed = useMemo(() => {
    try {
      return JSON.parse(text) as WaferEllipseConfig
    } catch {
      return null
    }
  }, [text])

  const cfg = parsed as any
  const masks = Array.isArray(cfg?.masks) ? (cfg.masks as MaskRect[]) : []

  const patchConfig = (path: ConfigPath, value: unknown) => {
    if (!parsed) return

    const next = updateByPath(parsed, path, value)
    setText(JSON.stringify(next, null, 2))
  }

  const patchMask = (index: number, key: keyof MaskRect, value: number | null) => {
    const nextMasks = masks.map((mask, i) =>
      i === index ? { ...mask, [key]: value ?? 0 } : mask
    )

    patchConfig(["masks"], nextMasks)
  }

  const addMask = () => {
    patchConfig(["masks"], [
      ...masks,
      {
        x: 0,
        y: 0,
        w: 100,
        h: 100,
      },
    ])
  }

  const removeMask = (index: number) => {
    patchConfig(
      ["masks"],
      masks.filter((_, i) => i !== index)
    )
  }

  const handleFileChange = async (file: File) => {
    const content = await file.text()
    setText(content)

    try {
      const json = JSON.parse(content) as WaferEllipseConfig
      setConfig(cameraId, json)
      message.success("JSON loaded")
    } catch {
      message.error("Invalid JSON file")
    }
  }

  const uploadProps: UploadProps = {
    accept: ".json,application/json",
    maxCount: 1,
    showUploadList: false,
    beforeUpload: async (file) => {
      await handleFileChange(file)
      return false
    },
  }

  const handleSave = async () => {
    if (!parsed) {
      message.error("JSON format invalid")
      return
    }

    setConfig(cameraId, parsed)
    await saveConfig(cameraId)
    message.success("Wafer ellipse config saved")
  }

  const maskColumns: TableProps<MaskRect>["columns"] = [
    {
      title: "X",
      dataIndex: "x",
      width: 72,
      render: (value: number, _record, index) => (
        <InputNumber
          size="small"
          min={0}
          value={value}
          onChange={(nextValue) => patchMask(index, "x", nextValue)}
          style={{ width: 66 }}
        />
      ),
    },
    {
      title: "Y",
      dataIndex: "y",
      width: 72,
      render: (value: number, _record, index) => (
        <InputNumber
          size="small"
          min={0}
          value={value}
          onChange={(nextValue) => patchMask(index, "y", nextValue)}
          style={{ width: 66 }}
        />
      ),
    },
    {
      title: "W",
      dataIndex: "w",
      width: 72,
      render: (value: number, _record, index) => (
        <InputNumber
          size="small"
          min={1}
          value={value}
          onChange={(nextValue) => patchMask(index, "w", nextValue)}
          style={{ width: 66 }}
        />
      ),
    },
    {
      title: "H",
      dataIndex: "h",
      width: 72,
      render: (value: number, _record, index) => (
        <InputNumber
          size="small"
          min={1}
          value={value}
          onChange={(nextValue) => patchMask(index, "h", nextValue)}
          style={{ width: 66 }}
        />
      ),
    },
    {
      title: "",
      width: 72,
      render: (_value, _record, index) => (
        <Button danger size="small" onClick={() => removeMask(index)}>
          Del
        </Button>
      ),
    },
  ]

  const renderNumberInput = (
    path: ConfigPath,
    value: number | undefined,
    min = 0,
    widthStyle = numberStyle
  ) => (
    <InputNumber
      size="small"
      min={min}
      value={value}
      onChange={(nextValue) => patchConfig(path, nextValue ?? min)}
      style={widthStyle}
    />
  )

  const structuredView = (
    <Space direction="vertical" style={{ width: "100%" }} size={6}>
      {!parsed ? (
        <Text type="danger">JSON format invalid. Please fix JSON first.</Text>
      ) : (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>
            image_path is hidden here but kept in JSON.
          </Text>

          <Divider orientation="horizontal" style={sectionStyle}>
            Crop ROI
          </Divider>

          <Form layout="vertical" size="small">
            <Space wrap size={8}>
              <Form.Item label="X" style={formItemStyle}>
                {renderNumberInput(["crop_roi", "x"], cfg?.crop_roi?.x)}
              </Form.Item>
              <Form.Item label="Y" style={formItemStyle}>
                {renderNumberInput(["crop_roi", "y"], cfg?.crop_roi?.y)}
              </Form.Item>
              <Form.Item label="W" style={formItemStyle}>
                {renderNumberInput(["crop_roi", "w"], cfg?.crop_roi?.w, 1)}
              </Form.Item>
              <Form.Item label="H" style={formItemStyle}>
                {renderNumberInput(["crop_roi", "h"], cfg?.crop_roi?.h, 1)}
              </Form.Item>
            </Space>
          </Form>

          <Divider orientation="horizontal" style={sectionStyle}>
            Wafer ROI
          </Divider>

          <Form layout="vertical" size="small">
            <Space wrap size={8}>
              <Form.Item label="CX" style={formItemStyle}>
                {renderNumberInput(["wafer_roi", "cx"], cfg?.wafer_roi?.cx)}
              </Form.Item>
              <Form.Item label="CY" style={formItemStyle}>
                {renderNumberInput(["wafer_roi", "cy"], cfg?.wafer_roi?.cy)}
              </Form.Item>
              <Form.Item label="R" style={formItemStyle}>
                {renderNumberInput(["wafer_roi", "r"], cfg?.wafer_roi?.r, 1)}
              </Form.Item>
            </Space>
          </Form>

          <Divider orientation="horizontal" style={sectionStyle}>
            Masks
          </Divider>

          <Space direction="vertical" style={{ width: "100%" }} size={6}>
            <Button size="small" onClick={addMask}>
              Add Mask
            </Button>

            <Table
              size="small"
              rowKey={(_record, index) => String(index)}
              pagination={false}
              columns={maskColumns}
              dataSource={masks}
              bordered={false}
            />
          </Space>

          <Divider orientation="horizontal" style={sectionStyle}>
            Params
          </Divider>

          <Form layout="vertical" size="small">
            <Space wrap align="start" size={8}>
              {PARAM_FIELDS.map((field) => {
                const value = cfg?.params?.[field.key]

                if (field.type === "boolean") {
                  return (
                    <Form.Item
                      key={field.key}
                      label={field.label}
                      style={formItemStyle}
                    >
                      <Switch
                        size="small"
                        checked={Boolean(value)}
                        onChange={(checked) =>
                          patchConfig(["params", field.key], checked)
                        }
                      />
                    </Form.Item>
                  )
                }

                if (field.type === "select") {
                  return (
                    <Form.Item
                      key={field.key}
                      label={field.label}
                      style={formItemStyle}
                    >
                      <Select
                        size="small"
                        value={value}
                        options={field.options}
                        onChange={(nextValue) =>
                          patchConfig(["params", field.key], nextValue)
                        }
                        style={selectStyle}
                      />
                    </Form.Item>
                  )
                }

                return (
                  <Form.Item
                    key={field.key}
                    label={field.label}
                    style={formItemStyle}
                  >
                    <InputNumber
                      size="small"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value}
                      onChange={(nextValue) =>
                        patchConfig(["params", field.key], nextValue ?? 0)
                      }
                      style={paramNumberStyle}
                    />
                  </Form.Item>
                )
              })}
            </Space>
          </Form>
        </>
      )}
    </Space>
  )

  return (
    <Card
      size="small"
      title="Wafer Ellipse"
      styles={{
        body: {
          padding: 10,
        },
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Space size={8}>
          <Upload {...uploadProps}>
            <Button size="small" icon={<UploadOutlined />}>
              Upload JSON
            </Button>
          </Upload>

          <Button
            size="small"
            type="primary"
            onClick={() => void handleSave()}
            loading={saveLoading}
          >
            Save
          </Button>
        </Space>

        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "structured",
              label: "Structured",
              children: structuredView,
            },
            {
              key: "json",
              label: "JSON",
              children: (
                <TextArea
                  rows={20}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste wafer ellipse JSON here"
                />
              ),
            },
          ]}
        />
      </Space>
    </Card>
  )
}