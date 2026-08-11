import { http } from "./http"
import type { CurrentUser, LoginRequest, LoginResponse } from "../types/auth"

export function login(payload: LoginRequest) {
  return http.postJson<LoginResponse>("/api/auth/login", payload)
}

export function getMe() {
  return http.getJson<CurrentUser>("/api/auth/me")
}