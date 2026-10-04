"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

import { withStaleFallback } from "@/lib/stale-cache"
import {
  alertRepository,
  type AlertEvent,
  type AlertZone,
  type PublicAlert,
  type PublicAlerts,
} from "@/repository/alert.repository"

// L'API est exposée sous /api pour le HTTP ; socket.io se connecte à la racine du même hôte (canal public).
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "").replace(/\/api$/, "")

const POLL_MS = 60_000
const SEVERITY_RANK = { emergency: 0, warning: 1, watch: 2, info: 3 } as const

const bySeverity = (a: PublicAlert, b: PublicAlert) =>
  SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.id - a.id

// Une alerte concerne l'habitant si elle vise son quartier ou toute la ville ; sans quartier connu, tout
const concerns = (alert: PublicAlert, zone: AlertZone | null) =>
  !zone || alert.zones.includes("all") || alert.zones.includes(zone)

/**
 * Alertes en vigueur pour un quartier. Trois sources, de la plus rapide à la plus sûre :
 *  1. le canal temps réel public (alert:published / updated / ended) : l'alerte apparaît tout de suite ;
 *  2. une relecture toutes les minutes, et au retour sur l'onglet ou du réseau : filet de sécurité ;
 *  3. la dernière réponse connue, si l'API est lente ou injoignable (voir lib/stale-cache).
 * Une alerte expirée (expiresAt) disparaît d'elle-même, sans attendre le serveur.
 */
export function usePublicAlerts(zone: AlertZone | null) {
  const [data, setData] = useState<PublicAlerts | null>(null)
  // Heure de référence pour masquer les alertes expirées : mise à jour hors du rendu (jamais Date.now() dans le rendu)
  const [now, setNow] = useState(0)
  const zoneRef = useRef(zone)
  useEffect(() => {
    zoneRef.current = zone
  }, [zone])

  const load = useCallback(async () => {
    try {
      setData(await withStaleFallback(`alerts:${zone ?? "all"}`, () => alertRepository.listPublic(zone)))
    } catch {
      // Hors ligne et rien en mémoire : on garde ce qui est affiché
    }
    setNow(Date.now())
  }, [zone])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    void load()
    // Légère dispersion : des milliers de pages ouvertes ne relisent pas toutes à la même seconde
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

  // Temps réel : l'événement contient l'alerte complète, appliquée sans nouvelle requête
  useEffect(() => {
    if (!SOCKET_URL) return
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] })

    const apply = (event: AlertEvent) => (alert: PublicAlert) => {
      setNow(Date.now())
      setData((previous) => {
        const base: PublicAlerts = previous ?? { zone: zoneRef.current, active: [], recentlyEnded: [] }
        const others = (list: PublicAlert[]) => list.filter((item) => item.id !== alert.id)
        const relevant = concerns(alert, zoneRef.current)
        if (event === "alert:ended" || alert.status === "ended") {
          return {
            ...base,
            active: others(base.active),
            recentlyEnded: relevant ? [alert, ...others(base.recentlyEnded)] : others(base.recentlyEnded),
          }
        }
        return {
          ...base,
          active: relevant ? [...others(base.active), alert].sort(bySeverity) : others(base.active),
          recentlyEnded: others(base.recentlyEnded),
        }
      })
    }

    const events: AlertEvent[] = ["alert:published", "alert:updated", "alert:ended"]
    const handlers = events.map((event) => [event, apply(event)] as const)
    for (const [event, handler] of handlers) socket.on(event, handler)
    // Reconnexion après une coupure : on a pu manquer un événement, on relit
    socket.io.on("reconnect", () => void load())

    return () => {
      for (const [event, handler] of handlers) socket.off(event, handler)
      socket.disconnect()
    }
  }, [load])

  const active = (data?.active ?? []).filter((alert) => now === 0 || new Date(alert.expiresAt).getTime() > now)
  return { active, recentlyEnded: data?.recentlyEnded ?? [], loaded: data !== null }
}
