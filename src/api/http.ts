import type { ApiResponse } from "./types"

type Primitive = string | number | boolean | null | undefined
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const AUTH_TOKEN_KEY = "wafer.auth.token"

function buildQuery(params?: Record<string, Primitive>) {
  if (!params) return ""

  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ""
}

function buildHeaders(hasBody: boolean) {
  const headers = new Headers()

  if (hasBody) {
    headers.set("Content-Type", "application/json")
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return headers
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return (await res.json()) as T
  }

  return (await res.text()) as T
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options?: {
    params?: Record<string, Primitive>
    body?: unknown
  },
): Promise<T> {
  const res = await fetch(`${path}${buildQuery(options?.params)}`, {
    method,
    // headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    headers: buildHeaders(Boolean(options?.body)),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await parseResponse<ApiResponse<T> | T>(res)

  if (!res.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload
    ) {
      throw new Error(String(payload.detail))
    }

    if (
      typeof payload === "object" &&
      payload !== null &&
      "ok" in payload &&
      payload.ok === false
    ) {
      throw new Error(payload.error || `${method} ${path} failed`)
    }

    throw new Error(`${method} ${path} failed: ${res.status}`)
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "ok" in payload
  ) {
    const wrapped = payload as ApiResponse<T>

    if (!wrapped.ok) {
      throw new Error(wrapped.error || `${method} ${path} failed`)
    }

    return wrapped.data
  }

  return payload as T
}

async function requestText(
  method: HttpMethod,
  path: string,
  options?: {
    params?: Record<string, Primitive>
    body?: unknown
  },
): Promise<string> {
  const res = await fetch(`${path}${buildQuery(options?.params)}`, {
    method,
    // headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    headers: buildHeaders(Boolean(options?.body)),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status}`)
  }

  return res.text()
}

async function requestBlob(
  method: HttpMethod,
  path: string,
  options?: {
    params?: Record<string, Primitive>
    body?: unknown
  },
): Promise<Blob> {
  const res = await fetch(`${path}${buildQuery(options?.params)}`, {
    method,
    // headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    headers: buildHeaders(Boolean(options?.body)),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const payload = await res.json()

      if (
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload
      ) {
        throw new Error(String(payload.detail))
      }

      if (
        typeof payload === "object" &&
        payload !== null &&
        "ok" in payload &&
        payload.ok === false
      ) {
        throw new Error(payload.error || `${method} ${path} failed`)
      }
    }

    throw new Error(`${method} ${path} failed: ${res.status}`)
  }

  return res.blob()
}

export const http = {
  getJson<T>(path: string, params?: Record<string, Primitive>) {
    return request<T>("GET", path, { params })
  },

  postJson<T>(path: string, body?: unknown, params?: Record<string, Primitive>) {
    return request<T>("POST", path, { body, params })
  },

  putJson<T>(path: string, body?: unknown, params?: Record<string, Primitive>) {
    return request<T>("PUT", path, { body, params })
  },

  patchJson<T>(path: string, body?: unknown, params?: Record<string, Primitive>) {
    return request<T>("PATCH", path, { body, params })
  },

  deleteJson<T>(path: string, body?: unknown, params?: Record<string, Primitive>) {
    return request<T>("DELETE", path, { body, params })
  },

  getText(path: string, params?: Record<string, Primitive>) {
    return requestText("GET", path, { params })
  },

  postText(path: string, body?: unknown, params?: Record<string, Primitive>) {
    return requestText("POST", path, { body, params })
  },

  getBlob(path: string, params?: Record<string, Primitive>) {
    return requestBlob("GET", path, { params })
  },

  postBlob(path: string, body?: unknown, params?: Record<string, Primitive>) {
    return requestBlob("POST", path, { body, params })
  },
}