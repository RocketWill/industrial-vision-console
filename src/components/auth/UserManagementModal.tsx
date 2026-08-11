import { useEffect, useState } from "react"
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useUserStore } from "../../store/userStore"
import type { CurrentUser, UserRole } from "../../types/auth"

type Props = {
    open: boolean
    onClose: () => void
}

type CreateForm = {
    username: string
    password: string
    display_name?: string
    role: UserRole
}

const roleOptions: { label: string; value: UserRole }[] = [
    { label: "Admin", value: "admin" },
    { label: "Engineer", value: "engineer" },
    { label: "Operator", value: "operator" },
]

export function UserManagementModal({ open, onClose }: Props) {
    const [form] = Form.useForm<CreateForm>()

    const users = useUserStore((s) => s.users)
    const loading = useUserStore((s) => s.loading)
    const fetchUsers = useUserStore((s) => s.fetchUsers)
    const createUser = useUserStore((s) => s.createUser)
    const updateUser = useUserStore((s) => s.updateUser)
    const deleteUser = useUserStore((s) => s.deleteUser)

    const [creating, setCreating] = useState(false)

    useEffect(() => {
        if (!open) return

        fetchUsers().catch((error) => {
            message.error(error instanceof Error ? error.message : "Load users failed")
        })
    }, [open, fetchUsers])

    const handleCreate = async (values: CreateForm) => {
        try {
            await createUser(values)
            form.resetFields()
            setCreating(false)
            message.success("User created")
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Create user failed")
        }
    }

    const handleRoleChange = async (user: CurrentUser, role: UserRole) => {
        try {
            await updateUser(user.id, { role })
            message.success("Role updated")
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Update role failed")
        }
    }

    const handleActiveChange = async (user: CurrentUser, isActive: boolean) => {
        try {
            await updateUser(user.id, { is_active: isActive })
            message.success("Status updated")
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Update status failed")
        }
    }

    const handleDelete = async (user: CurrentUser) => {
        try {
            await deleteUser(user.id)
            message.success("User deleted")
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Delete user failed")
        }
    }

    const columns: ColumnsType<CurrentUser> = [
        {
            title: "Username",
            dataIndex: "username",
        },
        {
            title: "Display Name",
            dataIndex: "display_name",
            render: (value) => value || "-",
        },
        {
            title: "Role",
            dataIndex: "role",
            render: (_, user) => {
                if (user.role === "superadmin") {
                    return <Tag color="purple">superadmin</Tag>
                }

                return (
                    <Select
                        size="small"
                        value={user.role}
                        options={roleOptions}
                        style={{ width: 120 }}
                        onChange={(role) => handleRoleChange(user, role)}
                    />
                )
            },
        },
        {
            title: "Active",
            dataIndex: "is_active",
            render: (_, user) => (
                <Switch
                    checked={user.is_active}
                    disabled={user.role === "superadmin"}
                    onChange={(checked) => handleActiveChange(user, checked)}
                />
            ),
        },
        {
            title: "Action",
            render: (_, user) => {
                if (user.role === "superadmin") {
                    return null
                }

                return (
                    <Popconfirm
                        title="Delete this user?"
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(user)}
                    >
                        <Button danger size="small">
                            Delete
                        </Button>
                    </Popconfirm>
                )
            },
        },
    ]

    return (
        <Modal
            title="User Management"
            open={open}
            onCancel={onClose}
            footer={null}
            width={860}
            destroyOnHidden
        >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Button type="primary" onClick={() => setCreating((v) => !v)}>
                    {creating ? "Cancel Create" : "Create User"}
                </Button>

                {creating && (
                    <Form
                        form={form}
                        layout="inline"
                        onFinish={handleCreate}
                        initialValues={{ role: "operator" }}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: "Username is required" }]}
                        >
                            <Input placeholder="Username" />
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                        >
                            <Input placeholder="Display name" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: "Password is required" }]}
                        >
                            <Input.Password placeholder="Password" />
                        </Form.Item>

                        <Form.Item name="role">
                            <Select
                                options={roleOptions}
                                style={{ width: 120 }}
                            />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" loading={loading}>
                            Save
                        </Button>
                    </Form>
                )}

                <Table
                    rowKey="id"
                    size="small"
                    loading={loading}
                    columns={columns}
                    dataSource={users}
                    pagination={false}
                />
            </Space>
        </Modal>
    )
}