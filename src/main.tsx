import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "antd/dist/reset.css"
import "./index.css"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)