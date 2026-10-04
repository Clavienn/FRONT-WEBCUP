"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

import { authRepository } from "@/repository/auth.repository"
import type { SignalementEvent } from "@/repository/signalement.repository"

// L'API est exposée sous /api pour le HTTP ; socket.io se connecte à la racine du même hôte.
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "").replace(/\/api$/, "")

export type ChannelState = "connecting" | "live" | "offline"

/**
 * Alertes en temps réel du personnel (espace de noms « /staff » de l'API) : « signalement:new » pour un
 * signalement urgent ou important, « signalement:updated » à chaque changement. Les événements ne
 * contiennent aucune donnée personnelle : le détail s'ouvre par l'API, qui vérifie les droits.
 * Le serveur coupe la connexion à l'expiration du jeton d'accès : on le rafraîchit puis on se reconnecte.
 * Sans temps réel (réseau, serveur), la page continue de fonctionner : seule l'actualisation devient manuelle.
 */
export function useStaffChannel(onEvent: (kind: "new" | "updated", event: SignalementEvent) => void, enabled: boolean) {
  const [state, setState] = useState<ChannelState>("connecting")
  const handler = useRef(onEvent)
  useEffect(() => {
    handler.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled || !SOCKET_URL) return

    let closed = false
    const socket: Socket = io(`${SOCKET_URL}/staff`, {
      // Évalué à chaque (re)connexion : toujours le jeton d'accès courant
      auth: (done) => done({ token: authRepository.getAccessToken() }),
      transports: ["websocket", "polling"],
    })

    // Jeton expiré : le serveur a coupé ou refusé la connexion, on le renouvelle puis on réessaie
    const renewAndReconnect = async () => {
      try {
        await authRepository.refresh()
      } catch {
        return
      }
      if (!closed) socket.connect()
    }

    socket.on("connect", () => setState("live"))
    socket.on("disconnect", (reason) => {
      setState("offline")
      if (reason === "io server disconnect") void renewAndReconnect()
    })
    socket.on("connect_error", (error) => {
      setState("offline")
      if (error.message === "unauthorized") void renewAndReconnect()
    })
    socket.on("signalement:new", (event: SignalementEvent) => handler.current("new", event))
    socket.on("signalement:updated", (event: SignalementEvent) => handler.current("updated", event))

    return () => {
      closed = true
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [enabled])

  return state
}
