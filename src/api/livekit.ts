import { http } from "./http"

export type ViewerTokenInput = {
  identity?: string
  room?: string
}

export type PublisherTokenInput = {
  identity?: string
  room?: string
}

export function getViewerToken(input?: ViewerTokenInput) {
  return http.getText("/token", {
    identity: input?.identity,
    room: input?.room,
  })
}

export function getPublisherToken(input?: PublisherTokenInput) {
  return http.getText("/token/publisher", {
    identity: input?.identity,
    room: input?.room,
  })
}