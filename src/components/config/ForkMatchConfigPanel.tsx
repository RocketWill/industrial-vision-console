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
import { useForkMatchConfigStore } from "../../store/forkMatchConfigStore"
import type { ForkMatchConfig } from "../../types/forkMatchConfig"

const { TextArea } = Input
const { Text } = Typography

type ConfigPath = Array<string | number>
type RoiArray = [number, number, number, number]

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
      options: Array<{ label: string; value: number | string }>
    }

type Props = {
  cameraId: string
}

const CV_PARAM_FIELDS: ParamField[] = [
  { key: "use_clahe", label: "CLAHE", type: "boolean" },
  { key: "clahe_clip", label: "CLAHE Clip", type: "number", min: 0, step: 0.1 },
  {
    key: "blur_mode",
    label: "Blur Mode",
    type: "select",
    options: [
      { label: "None", value: 0 },
      { label: "Gaussian", value: 1 },
      { label: "Median", value: 2 },
      { label: "Bilateral", value: 3 },
    ],
  },
  { key: "gaussian_k", label: "Gaussian K", type: "number", min: 1, step: 2 },
  { key: "median_k", label: "Median K", type: "number", min: 1, step: 2 },
  { key: "bilateral_d", label: "Bilateral D", type: "number", min: 1 },
  {
    key: "bilateral_sigma_color",
    label: "Sigma Color",
    type: "number",
    min: 0,
  },
  {
    key: "bilateral_sigma_space",
    label: "Sigma Space",
    type: "number",
    min: 0,
  },
  { key: "unsharp_amount", label: "Unsharp", type: "number", min: 0, step: 0.1 },
  { key: "laplacian_boost", label: "Laplacian", type: "number", min: 0, step: 0.1 },
  {
    key: "grad_mode",
    label: "Grad Mode",
    type: "select",
    options: [
      { label: "None", value: 0 },
      { label: "Sobel", value: 1 },
      { label: "Scharr", value: 2 },
      { label: "Laplacian", value: 3 },
    ],
  },
  { key: "canny_low", label: "Canny Low", type: "number", min: 0 },
  { key: "canny_high", label: "Canny High", type: "number", min: 0 },
  { key: "dilate", label: "Dilate", type: "number", min: 0 },
]

const EXTRA_PARAM_FIELDS: ParamField[] = [
  {
    key: "hough_votes_threshold",
    label: "Hough Votes",
    type: "number",
    min: 0,
  },
  {
    key: "refine_radius",
    label: "Refine Radius",
    type: "number",
    min: 0,
  },
  {
    key: "search_step",
    label: "Search Step",
    type: "number",
    min: 1,
  },
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

function cloneConfig(config: ForkMatchConfig) {
  return JSON.parse(JSON.stringify(config)) as ForkMatchConfig
}

function updateByPath(
  config: ForkMatchConfig,
  path: ConfigPath,
  value: unknown,
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

function normalizeRoi(value: unknown): RoiArray {
  if (!Array.isArray(value)) return [0, 0, 0, 0]

  return [
    Number(value[0] ?? 0),
    Number(value[1] ?? 0),
    Number(value[2] ?? 0),
    Number(value[3] ?? 0),
  ]
}

function normalizeMasks(value: unknown): RoiArray[] {
  if (!Array.isArray(value)) return []

  return value.map((item) => normalizeRoi(item))
}

export default function ForkMatchConfigPanel({ cameraId }: Props) {
  const fetchForkMatchConfig = useForkMatchConfigStore(
    (s) => s.fetchForkMatchConfig,
  )
  const setForkMatchDraft = useForkMatchConfigStore(
    (s) => s.setForkMatchDraft,
  )
  const saveForkMatchDraft = useForkMatchConfigStore(
    (s) => s.saveForkMatchDraft,
  )
  const forkMatchConfig = useForkMatchConfigStore(
    (s) => s.forkMatchConfigByCameraId[cameraId],
  )
  const saving = useForkMatchConfigStore((s) => s.savingByCameraId[cameraId])

  const [text, setText] = useState("")
  const [activeTab, setActiveTab] = useState("structured")

  useEffect(() => {
    fetchForkMatchConfig(cameraId).catch(() => {})
  }, [cameraId, fetchForkMatchConfig])

  useEffect(() => {
    if (forkMatchConfig) {
      setText(JSON.stringify(forkMatchConfig, null, 2))
    }
  }, [forkMatchConfig])

  const parsed = useMemo(() => {
    try {
      return JSON.parse(text) as ForkMatchConfig
    } catch {
      return null
    }
  }, [text])

  const cfg = parsed as any
  const targetRoi = normalizeRoi(cfg?.target_roi)
  const templateRoi = normalizeRoi(cfg?.template_roi)
  const targetMasks = normalizeMasks(cfg?.target_masks)
  const templateMasks = normalizeMasks(cfg?.template_masks)

  const setDraftFromConfig = (config: ForkMatchConfig) => {
    setForkMatchDraft(cameraId, {
      version: config.version ?? 1,
      cv_params: config.cv_params ?? {},
      extra_params: config.extra_params ?? {},
      target_roi: config.target_roi ?? null,
      template_roi: config.template_roi ?? null,
      target_masks: config.target_masks ?? [],
      template_masks: config.template_masks ?? [],
    })
  }

  const patchConfig = (path: ConfigPath, value: unknown) => {
    if (!parsed) return

    const next = updateByPath(parsed, path, value)
    setText(JSON.stringify(next, null, 2))
  }

  const patchRoi = (
    key: "target_roi" | "template_roi",
    index: number,
    value: number | null,
  ) => {
    const current = key === "target_roi" ? targetRoi : templateRoi
    const next: RoiArray = [...current] as RoiArray

    next[index] = value ?? 0
    patchConfig([key], next)
  }

  const patchMask = (
    key: "target_masks" | "template_masks",
    rowIndex: number,
    colIndex: number,
    value: number | null,
  ) => {
    const source = key === "target_masks" ? targetMasks : templateMasks
    const next = source.map((mask, index) => {
      if (index !== rowIndex) return mask

      const updated: RoiArray = [...mask] as RoiArray
      updated[colIndex] = value ?? 0

      return updated
    })

    patchConfig([key], next)
  }

  const addMask = (key: "target_masks" | "template_masks") => {
    const source = key === "target_masks" ? targetMasks : templateMasks
    patchConfig([key], [...source, [0, 0, 100, 100]])
  }

  const removeMask = (
    key: "target_masks" | "template_masks",
    rowIndex: number,
  ) => {
    const source = key === "target_masks" ? targetMasks : templateMasks
    patchConfig(
      [key],
      source.filter((_mask, index) => index !== rowIndex),
    )
  }

  const handleJsonText = (content: string) => {
    setText(content)

    try {
      const json = JSON.parse(content) as ForkMatchConfig
      setDraftFromConfig(json)
      message.success("Fork match JSON loaded")
    } catch {
      message.error("Invalid JSON file")
    }
  }

  const uploadProps: UploadProps = {
    accept: ".json,application/json",
    maxCount: 1,
    showUploadList: false,
    beforeUpload: async (file) => {
      const content = await file.text()
      handleJsonText(content)

      return false
    },
  }

  const handleSave = async () => {
    if (!parsed) {
      message.error("JSON format invalid")
      return
    }

    setDraftFromConfig(parsed)

    await saveForkMatchDraft(cameraId)
    message.success("Fork match config saved")
  }

  const renderNumberInput = (
    value: number | undefined,
    onChange: (value: number | null) => void,
    min = 0,
    widthStyle = numberStyle,
  ) => (
    <InputNumber
      size="small"
      min={min}
      value={value}
      onChange={onChange}
      style={widthStyle}
    />
  )

  const renderRoiEditor = (
    title: string,
    keyName: "target_roi" | "template_roi",
    value: RoiArray,
  ) => (
    <>
      <Divider orientation="horizontal" style={sectionStyle}>
        {title}
      </Divider>

      <Form layout="vertical" size="small">
        <Space wrap size={8}>
          <Form.Item label="X" style={formItemStyle}>
            {renderNumberInput(value[0], (nextValue) =>
              patchRoi(keyName, 0, nextValue),
            )}
          </Form.Item>
          <Form.Item label="Y" style={formItemStyle}>
            {renderNumberInput(value[1], (nextValue) =>
              patchRoi(keyName, 1, nextValue),
            )}
          </Form.Item>
          <Form.Item label="W" style={formItemStyle}>
            {renderNumberInput(
              value[2],
              (nextValue) => patchRoi(keyName, 2, nextValue),
              1,
            )}
          </Form.Item>
          <Form.Item label="H" style={formItemStyle}>
            {renderNumberInput(
              value[3],
              (nextValue) => patchRoi(keyName, 3, nextValue),
              1,
            )}
          </Form.Item>
        </Space>
      </Form>
    </>
  )

  const createMaskColumns = (
    keyName: "target_masks" | "template_masks",
  ): TableProps<RoiArray>["columns"] => [
    {
      title: "X",
      width: 72,
      render: (_value, record, index) =>
        renderNumberInput(
          record[0],
          (nextValue) => patchMask(keyName, index, 0, nextValue),
          0,
          { width: 66 },
        ),
    },
    {
      title: "Y",
      width: 72,
      render: (_value, record, index) =>
        renderNumberInput(
          record[1],
          (nextValue) => patchMask(keyName, index, 1, nextValue),
          0,
          { width: 66 },
        ),
    },
    {
      title: "W",
      width: 72,
      render: (_value, record, index) =>
        renderNumberInput(
          record[2],
          (nextValue) => patchMask(keyName, index, 2, nextValue),
          1,
          { width: 66 },
        ),
    },
    {
      title: "H",
      width: 72,
      render: (_value, record, index) =>
        renderNumberInput(
          record[3],
          (nextValue) => patchMask(keyName, index, 3, nextValue),
          1,
          { width: 66 },
        ),
    },
    {
      title: "",
      width: 72,
      render: (_value, _record, index) => (
        <Button danger size="small" onClick={() => removeMask(keyName, index)}>
          Del
        </Button>
      ),
    },
  ]

  const renderMaskTable = (
    title: string,
    keyName: "target_masks" | "template_masks",
    value: RoiArray[],
  ) => (
    <>
      <Divider orientation="horizontal" style={sectionStyle}>
        {title}
      </Divider>

      <Space direction="vertical" style={{ width: "100%" }} size={6}>
        <Button size="small" onClick={() => addMask(keyName)}>
          Add Mask
        </Button>

        <Table
          size="small"
          rowKey={(_record, index) => String(index)}
          pagination={false}
          columns={createMaskColumns(keyName)}
          dataSource={value}
          bordered={false}
        />
      </Space>
    </>
  )

  const renderParamFields = (
    title: string,
    groupKey: "cv_params" | "extra_params",
    fields: ParamField[],
  ) => (
    <>
      <Divider orientation="horizontal" style={sectionStyle}>
        {title}
      </Divider>

      <Form layout="vertical" size="small">
        <Space wrap align="start" size={8}>
          {fields.map((field) => {
            const value = cfg?.[groupKey]?.[field.key]

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
                      patchConfig([groupKey, field.key], checked)
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
                      patchConfig([groupKey, field.key], nextValue)
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
                    patchConfig([groupKey, field.key], nextValue ?? 0)
                  }
                  style={paramNumberStyle}
                />
              </Form.Item>
            )
          })}
        </Space>
      </Form>
    </>
  )

  const structuredView = (
    <Space direction="vertical" style={{ width: "100%" }} size={6}>
      {!parsed ? (
        <Text type="danger">JSON format invalid. Please fix JSON first.</Text>
      ) : (
        <>
          <Divider orientation="horizontal" style={sectionStyle}>
            Basic
          </Divider>

          <Form layout="vertical" size="small">
            <Space wrap size={8}>
              <Form.Item label="Version" style={formItemStyle}>
                <InputNumber
                  size="small"
                  min={1}
                  value={cfg?.version}
                  onChange={(nextValue) =>
                    patchConfig(["version"], nextValue ?? 1)
                  }
                  style={numberStyle}
                />
              </Form.Item>
            </Space>
          </Form>

          {renderParamFields("CV Params", "cv_params", CV_PARAM_FIELDS)}
          {renderParamFields("Extra Params", "extra_params", EXTRA_PARAM_FIELDS)}
          {renderRoiEditor("Target ROI", "target_roi", targetRoi)}
          {renderRoiEditor("Template ROI", "template_roi", templateRoi)}
          {renderMaskTable("Target Masks", "target_masks", targetMasks)}
          {renderMaskTable("Template Masks", "template_masks", templateMasks)}
        </>
      )}
    </Space>
  )

  return (
    <Card
      size="small"
      title="Fork Match"
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
            loading={saving}
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
                  placeholder="Paste fork match JSON here"
                />
              ),
            },
          ]}
        />
      </Space>
    </Card>
  )
}