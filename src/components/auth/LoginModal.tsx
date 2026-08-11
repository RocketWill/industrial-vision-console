import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal, message } from "antd"
import { useAuthStore } from "../../store/authStore"

type Props = {
    open: boolean
    onClose: () => void
}

type LoginForm = {
    username: string
    password: string
}

export function LoginModal({ open, onClose }: Props) {
    const login = useAuthStore((s) => s.login)
    const loading = useAuthStore((s) => s.loading)

    const handleLogin = async (values: LoginForm) => {
        try {
            await login(values)
            message.success("Login successful")
            onClose()
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Login failed")
        }
    }

    return (
        <Modal
            title="Login"
            open={open}
            footer={null}
            onCancel={onClose}
            destroyOnHidden
        >
            <Form
                layout="vertical"
                onFinish={handleLogin}
            >
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: "Username is required" }]}
                >
                    <Input prefix={<UserOutlined />} autoComplete="username" />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: "Password is required" }]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        autoComplete="current-password"
                    />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading}>
                    Login
                </Button>
            </Form>
        </Modal>
    )
}
