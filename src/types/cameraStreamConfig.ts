export type CameraStreamConfigItem = {
  id: string;
  enabled: boolean;
  name?: string;
  url: string;
  room: string;
};

export type CameraStreamConfig = {
  items: CameraStreamConfigItem[];
};