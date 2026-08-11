import { http } from "./http"
import type { CurrentUser, UserRole } from "../types/auth"

export type CreateUserPayload = {
    username: string
    password: string
    display_name?: string | null
    role: UserRole
}

export type UpdateUserPayload = {
    display_name?: string | null
    role?: UserRole
    is_active?: boolean
    password?: string
}

export function getUsers() {
    return http.getJson<CurrentUser[]>("/api/users")
}

export function createUser(payload: CreateUserPayload) {
    return http.postJson<CurrentUser>("/api/users", payload)
}

export function updateUser(userId: number, payload: UpdateUserPayload) {
    return http.patchJson<CurrentUser>(`/api/users/${userId}`, payload)
}

export function deleteUser(userId: number) {
    return http.deleteJson<{ ok: boolean }>(`/api/users/${userId}`)
}