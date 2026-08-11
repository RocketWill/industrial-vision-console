import { Button, Card, Form, InputNumber, Slider, Space, Row, Col } from "antd"
import { useMemo, useState } from "react"
import { useConfigStore } from "../../store/configStore"

type Props = {
  cameraId: string
}

type FormValues = {
  gray_stability_threshold: number
  stable_frame_count_n: number
  inspection_cooldown_ms: number
  roi_gray_mean_range: [number, number]
  distance_tolerance_1: number
  distance_tolerance_2: number
  distance_tolerance_3: number
  distance_tolerance_4: number
  alignment_mm_per_pixel: number
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000
}

function pxToMm(px: number, mmPerPixel: number) {
  return round3(px * mmPerPixel)
}

function mmToPx(mm: number, mmPerPixel: number) {
  return round3(mm / mmPerPixel)
}
export default function RuntimeThresholdPanel({ cameraId }: Props) {
  const config = useConfigStore((s) => s.configByCameraId[cameraId])
  const updateThresholdConfig = useConfigStore((s) => s.updateThresholdConfig)

  const initialValues = useMemo<FormValues | undefined>(() => {
    if (!config) return undefined

    const min = config.roi_gray_mean_min ?? 0
    const max = config.roi_gray_mean_max ?? 255
    const mmPerPixel = config.alignment_mm_per_pixel || 0.01

    return {
      gray_stability_threshold: config.gray_stability_threshold,
      stable_frame_count_n: config.stable_frame_count_n,
      inspection_cooldown_ms: config.inspection_cooldown_ms,
      roi_gray_mean_range: [min, max],
      distance_tolerance_1: pxToMm(config.distance_tolerance_1, mmPerPixel),
      distance_tolerance_2: pxToMm(config.distance_tolerance_2, mmPerPixel),
      distance_tolerance_3: pxToMm(config.distance_tolerance_3, mmPerPixel),
      distance_tolerance_4: pxToMm(config.distance_tolerance_4, mmPerPixel),
      alignment_mm_per_pixel: mmPerPixel,
    }
  }, [config])

  const [form] = Form.useForm<FormValues>()
  const [saving, setSaving] = useState(false)

  if (!config) return null

  return (
    <Card size="small" title="Runtime Thresholds">
      <Form
        form={form}
        layout="vertical"
        size="small"
        initialValues={initialValues}
        key={config.version}
        onFinish={async (values) => {
          setSaving(true)
          try {
            const [roi_gray_mean_min, roi_gray_mean_max] = values.roi_gray_mean_range
            const mmPerPixel = values.alignment_mm_per_pixel || 0.01

            await updateThresholdConfig(cameraId, {
              gray_stability_threshold: values.gray_stability_threshold,
              stable_frame_count_n: values.stable_frame_count_n,
              inspection_cooldown_ms: values.inspection_cooldown_ms,
              roi_gray_mean_min,
              roi_gray_mean_max,
              distance_tolerance_1: mmToPx(values.distance_tolerance_1, mmPerPixel),
              distance_tolerance_2: mmToPx(values.distance_tolerance_2, mmPerPixel),
              distance_tolerance_3: mmToPx(values.distance_tolerance_3, mmPerPixel),
              distance_tolerance_4: mmToPx(values.distance_tolerance_4, mmPerPixel),
              alignment_mm_per_pixel: mmPerPixel,
            })
          } finally {
            setSaving(false)
          }
        }}
      >
        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              label="Gray Stability"
              name="gray_stability_threshold"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} step={0.1} min={0} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Stable Frames"
              name="stable_frame_count_n"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="ROI Gray Mean Range"
          name="roi_gray_mean_range"
          style={{ marginBottom: 8 }}
        >
          <Slider range min={0} max={255} step={1} />
        </Form.Item>

        <Form.Item shouldUpdate noStyle>
          {() => {
            const range = form.getFieldValue("roi_gray_mean_range") ?? [0, 255]
            const [min, max] = range

            return (
              <Row gutter={8} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <InputNumber
                    size="small"
                    style={{ width: "100%" }}
                    min={0}
                    max={255}
                    value={min}
                    onChange={(value) => {
                      const nextMin = Number(value ?? 0)
                      form.setFieldsValue({
                        roi_gray_mean_range: [Math.min(nextMin, max), max],
                      })
                    }}
                  />
                </Col>

                <Col span={12}>
                  <InputNumber
                    size="small"
                    style={{ width: "100%" }}
                    min={0}
                    max={255}
                    value={max}
                    onChange={(value) => {
                      const nextMax = Number(value ?? 255)
                      form.setFieldsValue({
                        roi_gray_mean_range: [min, Math.max(min, nextMax)],
                      })
                    }}
                  />
                </Col>
              </Row>
            )
          }}
        </Form.Item>

        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              label="Cooldown (ms)"
              name="inspection_cooldown_ms"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={100} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="mm per pixel"
              name="alignment_mm_per_pixel"
              style={{ marginBottom: 8 }}
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0.000001}
                step={0.0001}
                precision={6}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              label="Tolerance 1 (mm)"
              name="distance_tolerance_1"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Tolerance 2 (mm)"
              name="distance_tolerance_2"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              label="Tolerance 3 (mm)"
              name="distance_tolerance_3"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Tolerance 4 (mm)"
              name="distance_tolerance_4"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Space size="small">
            <Button type="primary" size="small" htmlType="submit" loading={saving}>
              Save
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  )
}