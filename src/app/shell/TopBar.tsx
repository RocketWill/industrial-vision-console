import { Badge, Button, Flex, message, Space, Tag, Typography } from "antd"
import { LogoutOutlined, SettingOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons"
import { LoginModal } from "../../components/auth/LoginModal"
import { useState } from "react"
import { useAuthStore } from "../../store/authStore"
import { UserManagementModal } from "../../components/auth/UserManagementModal"

const { Title, Text } = Typography

type TopBarProps = {
    activeCameraName: string
    streamStatus: "connected" | "connecting" | "disconnected"
    runtimeStatus: "running" | "idle" | "warning"
}

function getBadgeStatus(status: TopBarProps["streamStatus"]) {
    switch (status) {
        case "connected":
            return "success"
        case "connecting":
            return "processing"
        default:
            return "default"
    }
}

function getRuntimeColor(status: TopBarProps["runtimeStatus"]) {
    switch (status) {
        case "running":
            return "green"
        case "warning":
            return "orange"
        default:
            return "default"
    }
}

export function TopBar({
    activeCameraName,
    streamStatus,
    runtimeStatus,
}: TopBarProps) {

    const [loginOpen, setLoginOpen] = useState(false)
    const [userManagementOpen, setUserManagementOpen] = useState(false)

    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    const handleLogout = () => {
        logout()
        message.success("Logged out")
    }

    return (
        <>
            <Flex
                align="center"
                justify="space-between"
                style={{
                    height: "100%",
                    paddingInline: 16,
                    background: "#0f1621",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Flex align="center" gap={24}>
                    <Flex align="center" gap={12}>
                        <div
                            aria-label="Industrial vision console"
                            style={{
                                width: 40,
                                height: 40,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: 8,
                                background: "#1f6f8b",
                                color: "#ffffff",
                                fontWeight: 700,
                                letterSpacing: 1,
                            }}
                        >IV</div>

                        <Flex vertical justify="center">
                            <Title level={4} style={{ margin: 0 }}>
                                Wafer Inspection Runtime
                            </Title>
                            <Text type="secondary">
                                Multi-camera inspection workspace
                            </Text>
                        </Flex>
                    </Flex>

                    <Space size="middle">
                        <Flex vertical gap={2}>
                            <Text type="secondary">Active Camera</Text>
                            <Text strong>{activeCameraName}</Text>
                        </Flex>

                        <Badge
                            status={getBadgeStatus(streamStatus)}
                            text={`Stream ${streamStatus}`}
                        />

                        <Tag color={getRuntimeColor(runtimeStatus)} bordered={false}>
                            Runtime {runtimeStatus}
                        </Tag>
                    </Space>
                </Flex>

                <Space size="middle">
                    {user ? (
                        <Space size={8}>
                            <Tag color="blue" bordered={false}>
                                {user.role}
                            </Tag>

                            <Text strong>{user.display_name || user.username}</Text>

                            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                                Logout
                            </Button>
                        </Space>
                    ) : (
                        <Button icon={<UserOutlined />} onClick={() => setLoginOpen(true)}>
                            Login
                        </Button>
                    )}
                    {user?.role === "superadmin" && (
                        <Button
                            icon={<TeamOutlined />}
                            onClick={() => setUserManagementOpen(true)}
                        >
                            Users
                        </Button>
                    )}

                    {/* <Button icon={<BellOutlined />} />
                    <Button icon={<GlobalOutlined />} /> */}
                    <Button icon={<SettingOutlined />} />
                </Space>
            </Flex>
            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
            />
            <UserManagementModal
                open={userManagementOpen}
                onClose={() => setUserManagementOpen(false)}
            />
        </>
    )
}
