import { ConfigProvider, theme } from "antd"
import { AppLayout } from "./app/layout/AppLayout"
import { themeDarkIndustrial } from "./theme/theme"

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        ...themeDarkIndustrial,
      }}
    >
      <AppLayout />
    </ConfigProvider>
  )
}