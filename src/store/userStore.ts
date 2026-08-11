import { create } from "zustand"
import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
    type CreateUserPayload,
    type UpdateUserPayload,
} from "../api/users"
import type { CurrentUser } from "../types/auth"

type UserStore = {
    users: CurrentUser[]
    loading: boolean

    fetchUsers: () => Promise<void>
    createUser: (payload: CreateUserPayload) => Promise<void>
    updateUser: (userId: number, payload: UpdateUserPayload) => Promise<void>
    deleteUser: (userId: number) => Promise<void>
}

export const useUserStore = create<UserStore>((set, get) => ({
    users: [],
    loading: false,

    fetchUsers: async () => {
        set({ loading: true })

        try {
            const users = await getUsers()
            set({ users, loading: false })
        } catch (error) {
            set({ loading: false })
            throw error
        }
    },

    createUser: async (payload) => {
        set({ loading: true })

        try {
            await createUser(payload)
            await get().fetchUsers()
        } catch (error) {
            set({ loading: false })
            throw error
        }
    },

    updateUser: async (userId, payload) => {
        set({ loading: true })

        try {
            await updateUser(userId, payload)
            await get().fetchUsers()
        } catch (error) {
            set({ loading: false })
            throw error
        }
    },

    deleteUser: async (userId) => {
        set({ loading: true })

        try {
            await deleteUser(userId)
            await get().fetchUsers()
        } catch (error) {
            set({ loading: false })
            throw error
        }
    },
}))