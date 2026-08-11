export type UserRole = "superadmin" | "admin" | "engineer" | "operator"

export type CurrentUser = {
  id: number
  username: string
  display_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: "bearer"
  user: CurrentUser
}