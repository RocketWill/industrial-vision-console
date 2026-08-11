import { Button, Space, Switch, Typography } from "antd";
import { defaultViewerState, useViewerStore } from "../../store/viewerStore";
import { useViewTransformStore } from "../../store/viewTransformStore";

const { Text } = Typography;

type ViewerControlsProps = {
  cameraId: string;
};

export function ViewerControls({ cameraId }: ViewerControlsProps) {
  const viewer = useViewerStore(
    (state) => state.viewerByCameraId[cameraId] ?? defaultViewerState
  );
  const patchViewerState = useViewerStore((state) => state.patchViewerState);
  const vtApi = useViewTransformStore(
    (state) => state.apiByCameraId[cameraId]
  );

  return (
    <Space wrap size={16}>
      <Space size={8}>
        <Text>Wafer ROI</Text>
        <Switch
          checked={viewer.showWaferRoi}
          onChange={(checked) =>
            patchViewerState(cameraId, { showWaferRoi: checked })
          }
        />
      </Space>

      <Space size={8}>
        <Text>Fork ROI</Text>
        <Switch
          checked={viewer.showForkRoi}
          onChange={(checked) =>
            patchViewerState(cameraId, { showForkRoi: checked })
          }
        />
      </Space>

      <Space size={8}>
        <Button onClick={() => vtApi?.fit()} disabled={!vtApi}>
          Fit
        </Button>
        <Button onClick={() => vtApi?.set100()} disabled={!vtApi}>
          100%
        </Button>
      </Space>
    </Space>
  );
}

export default ViewerControls;
