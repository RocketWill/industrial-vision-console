import { create } from "zustand"
import { getMe, login } from "../api/auth"
import type { CurrentUser, LoginRequest } from "../types/auth"

const AUTH_TOKEN_KEY = "wafer.auth.token"

type AuthStore = {
  token: string | null
  user: CurrentUser | null
  loading: boolean

  login: (payload: LoginRequest) => Promise<void>
  fetchMe: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  user: null,
  loading: false,

  login: async (payload) => {
    set({ loading: true })

    try {
      const res = await login(payload)

      localStorage.setItem(AUTH_TOKEN_KEY, res.access_token)

      set({
        token: res.access_token,
        user: res.user,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      set({ token: null, user: null })
      return
    }

    set({ loading: true })

    try {
      const user = await getMe()

      set({
        token,
        user,
        loading: false,
      })
    } catch (error) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      set({
        token: null,
        user: null,
        loading: false,
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)

    set({
      token: null,
      user: null,
      loading: false,
    })
  },
}))