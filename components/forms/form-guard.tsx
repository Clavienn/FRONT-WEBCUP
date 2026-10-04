"use client"

import { useCallback, useEffect, useRef, type ReactNode } from "react"

import { AuthApiError } from "@/repository/auth.repository"
import { formsRepository, type GuardedForm } from "@/repository/forms.repository"

// Protection anti-robots côté formulaire, invisible pour une personne (pas de CAPTCHA) :
//  - à l'affichage, le formulaire demande un jeton signé au serveur ;
//  - à l'envoi, il le joint (en-tête X-Form-Token), après le délai minimal qu'un humain met à remplir ;
//  - un champ piège caché est joint (X-Form-Hp) seulement s'il a été rempli, donc par un robot.
// Protocole : api/README.md, section « Protection anti-robots ».

const HONEYPOT_FIELD = "nickname_confirm"

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)))

interface FormToken {
  token: string
  issuedAt: number
  minDelayMs: number
}

type Send<T> = (headers: Record<string, string>) => Promise<T>

/**
 * `run(send)` obtient le jeton, attend le délai minimal si besoin, appelle `send(headers)` puis gère les
 * refus du serveur : formulaire parti trop tôt (on attend et on renvoie le même jeton), jeton périmé
 * (un nouveau, une seule fois). Un jeton ne sert qu'une fois : un nouveau est demandé après chaque envoi.
 * `enabled: false` retarde la demande du jeton (dialogue pas encore ouvert).
 */
export function useFormGuard(form: GuardedForm, { enabled = true }: { enabled?: boolean } = {}) {
  const tokenRef = useRef<FormToken | null>(null)
  const pendingRef = useRef<Promise<void> | null>(null)
  const trapRef = useRef("")

  const refresh = useCallback(() => {
    tokenRef.current = null
    const request = formsRepository
      .token(form)
      .then(({ token, minDelayMs }) => {
        tokenRef.current = { token, issuedAt: Date.now(), minDelayMs }
      })
      .catch(() => {
        // API injoignable : l'envoi suivra son cours et échouera avec un message clair si besoin
      })
      .finally(() => {
        if (pendingRef.current === request) pendingRef.current = null
      })
    pendingRef.current = request
    return request
  }, [form])

  useEffect(() => {
    if (enabled) void refresh()
  }, [enabled, refresh])

  const run = useCallback(
    async <T,>(send: Send<T>): Promise<T> => {
      if (pendingRef.current) await pendingRef.current
      if (!tokenRef.current) await refresh()

      let current = tokenRef.current
      tokenRef.current = null
      // Pas de jeton (route du jeton injoignable) : on laisse partir la requête, le serveur tranche
      if (!current) return send({})

      let invalidRetried = false
      try {
        for (let attempt = 0; ; attempt += 1) {
          // Un gestionnaire de mots de passe peut valider en un instant : on attend le reste du délai
          await sleep(current.minDelayMs - (Date.now() - current.issuedAt) + 50)

          const headers: Record<string, string> = { "X-Form-Token": current.token }
          if (trapRef.current.trim()) headers["X-Form-Hp"] = trapRef.current

          try {
            return await send(headers)
          } catch (error) {
            if (!(error instanceof AuthApiError)) throw error
            // Parti trop tôt : le jeton n'est pas consommé, on le rejoue après le délai indiqué
            if (error.code === "form_too_fast" && attempt < 3) {
              await sleep(error.retryAfterMs ?? 1000)
              continue
            }
            // Jeton périmé ou déjà utilisé : un nouveau, une seule fois ; sinon le message est affiché
            if (error.code === "form_token_invalid" && !invalidRetried) {
              invalidRetried = true
              await refresh()
              const fresh = tokenRef.current as FormToken | null
              if (!fresh) throw error
              tokenRef.current = null
              current = fresh
              continue
            }
            // form_check_failed et bot_blocked (429) : jamais de nouvel essai automatique
            throw error
          }
        }
      } finally {
        void refresh()
      }
    },
    [refresh]
  )

  // Champ piège : à placer dans le <form>. Hors écran, ignoré du clavier et des lecteurs d'écran.
  const trap: ReactNode = (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Confirm nickname
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          onChange={(event) => {
            trapRef.current = event.target.value
          }}
        />
      </label>
    </div>
  )

  return { run, trap }
}
