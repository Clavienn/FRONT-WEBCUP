"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { io } from "socket.io-client"

import { withStaleFallback } from "@/lib/stale-cache"
import { TRANSPORT_UPDATED_EVENT, transportRepository, type TransportStatus } from "@/repository/transport.repository"

// L'API est exposée sous /api pour le HTTP ; socket.io se connecte à la racine du même hôte (canal public).
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "").replace(/\/api$/, "")
const POLL_MS = 60_000

// ── « Mes lignes » : lignes suivies par l'habitant, mémorisées sur cet appareil ──
const LINES_KEY = "terra-nova:my-lines"
const LINES_EVENT = "terra-nova:my-lines-change"
let cachedRaw: string | null = null
let cachedLines: string[] = []

function readLines(): string[] {
  try {
    const raw = window.localStorage.getItem(LINES_KEY)
    // Référence stable tant que la valeur ne change pas : exigé par useSyncExternalStore
    if (raw !== cachedRaw) {
      cachedRaw = raw
      cachedLines = raw ? (JSON.parse(raw) as string[]).filter((code) => typeof code === "string") : []
    }
    return cachedLines
  } catch {
    return []
  }
}

function subscribeLines(onChange: () => void) {
  window.addEventListener(LINES_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(LINES_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

const NO_LINES: string[] = []

export function useMyLines() {
  const lines = useSyncExternalStore(subscribeLines, readLines, () => NO_LINES)
  const toggle = useCallback((code: string) => {
    const current = readLines()
    const next = current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    try {
      window.localStorage.setItem(LINES_KEY, JSON.stringify(next))
    } catch {
      // stockage indisponible : le choix ne vaut que pour cette page
    }
    window.dispatchEvent(new Event(LINES_EVENT))
  }, [])
  return { lines, toggle }
}

/**
 * État du réseau de transport. Trois sources : le canal temps réel public (« transport:updated », l'état est
 * relu aussitôt), une relecture toutes les minutes, et la dernière réponse connue si l'API est lente ou injoignable.
 */
export function useTransportStatus() {
  const [status, setStatus] = useState<TransportStatus | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setStatus(await withStaleFallback("transport:status", () => transportRepository.status()))
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "")
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    void load()
    const timer = window.setInterval(() => void load(), POLL_MS + Math.random() * 5000)
    const refresh = () => {
      if (document.visibilityState === "visible") void load()
    }
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("online", refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("online", refresh)
    }
  }, [load])

  useEffect(() => {
    if (!SOCKET_URL) return
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] })
    const onUpdate = () => void load()
    socket.on(TRANSPORT_UPDATED_EVENT, onUpdate)
    socket.io.on("reconnect", onUpdate)
    return () => {
      socket.off(TRANSPORT_UPDATED_EVENT, onUpdate)
      socket.disconnect()
    }
  }, [load])

  return { status, error, reload: load }
}
