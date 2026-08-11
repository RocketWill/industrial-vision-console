import type { ThemeConfig } from "antd";

export const themeDarkIndustrial: ThemeConfig = {
  token: {
    // 主色（選中框/ROI/active）
    colorPrimary: "#52c41a",

    // 背景系統
    colorBgBase: "#0b0f14",          // 最底層背景
    colorBgContainer: "#101722",     // 卡片/容器背景
    colorBgElevated: "#0f1621",      // header/浮層/toolbar 的更高一階背景

    // Success（深綠工業風）
    colorSuccess: "#52c41a",                 // 主綠（沿用 primary）
    colorSuccessBg: "#0f2a1a",              // 深綠背景
    colorSuccessBgHover: "#13331f",
    colorSuccessBorder: "#1f5f3a",
    colorSuccessText: "#73d13d",

    // 文字
    colorTextBase: "rgba(255,255,255,0.88)",
    colorTextSecondary: "rgba(255,255,255,0.65)",

    // 邊框
    colorBorder: "rgba(255,255,255,0.10)",
    colorBorderSecondary: "rgba(255,255,255,0.14)",

    // 圓角
    borderRadius: 8,
    borderRadiusLG: 10,

    // 字體
    fontSize: 14,
  },

  components: {
    Layout: {
      headerBg: "#0b0f14",
      bodyBg: "#0b0f14",
      siderBg: "#0b0f14",
    },

    Menu: {
      itemSelectedBg: "rgba(82,196,26,0.08)",
      itemSelectedColor: "#52c41a",
      itemHoverBg: "rgba(82,196,26,0.08)",
    },

    Card: {
      colorBgContainer: "#101722",
      headerBg: "#0f1621",
      colorBorderSecondary: "rgba(255,255,255,0.10)",
    },

    Modal: {
      contentBg: "#172233",
      headerBg: "#172233",
      titleColor: "rgba(255,255,255,0.92)",
    },

    Input: {
      colorBgContainer: "#0f1621",
      colorBorder: "rgba(255,255,255,0.16)",
      colorText: "rgba(255,255,255,0.88)",
      colorTextPlaceholder: "rgba(255,255,255,0.38)",
    },

    Select: {
      colorBgContainer: "#0f1621",
      colorBorder: "rgba(255,255,255,0.16)",
      colorText: "rgba(255,255,255,0.88)",
      optionSelectedBg: "rgba(82,196,26,0.16)",
      optionActiveBg: "rgba(255,255,255,0.08)",
    },

    Table: {
      headerBg: "#0f1621",
      colorBgContainer: "#141d2a",
      rowHoverBg: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.10)",
    },

    Tooltip: {
      colorBgSpotlight: "#0f1621",
      colorTextLightSolid: "rgba(255,255,255,0.88)",
    },

    Button: {
      defaultBg: "rgba(255,255,255,0.06)",
      defaultBorderColor: "rgba(255,255,255,0.12)",
      defaultColor: "rgba(255,255,255,0.88)",
      textHoverBg: "rgba(255,255,255,0.06)",
      textTextHoverColor: "rgba(255,255,255,0.92)",
    },
  },
};