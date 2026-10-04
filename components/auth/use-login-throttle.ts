"use client"

import { useCallback, useEffect, useState } from "react"

// Friction progressive sur la connexion, invisible tant que tout va bien :
//  - 1 ou 2 mots de passe faux : rien (une faute de frappe arrive à tout le monde) ;
//  - à partir du 3e échec : un court délai qui double (4 s, 8 s, 16 s... jusqu'à 60 s), annoncé avec un compte à rebours ;
//  - si le serveur bloque l'adresse (429, nombreuses tentatives sur plusieurs comptes) : message clair et compte à rebours
//    jusqu'à la fin du blocage, y compris après un rechargement de la page.
// Cette limite côté navigateur n'est qu'une aide : le serveur reste seul juge (blocage par adresse et par signal).
const FAILURES_KEY = "terra-nova:login-failures"
const UNTIL_KEY = "terra-nova:login-locked-until"
const FREE_ATTEMPTS = 2
const BASE_DELAY_MS = 4_000
const MAX_DELAY_MS = 60_000
const MAX_SERVER_LOCK_MS = 30 * 60_000

function readNumber(storage: Storage, key: string): number {
  try {
    const value = Number(storage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function write(storage: Storage, key: string, value: number | null) {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, String(value))
  } catch {
    // stockage indisponible : la friction vaut pour cette page seulement
  }
}

export interface LoginThrottle {
  // Secondes restantes avant de pouvoir réessayer ; 0 = formulaire libre
  secondsLeft: number
  // Vrai si le serveur a bloqué l'adresse (et non le simple délai après plusieurs échecs)
  serverBlocked: boolean
  recordFailure: () => void
  recordServerBlock: (retryAfterMs?: number) => void
  recordSuccess: () => void
}

export function useLoginThrottle(): LoginThrottle {
  const [until, setUntil] = useState(0)
  const [serverBlocked, setServerBlocked] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Reprise après rechargement : un blocage encore en cours est de nouveau affiché
  useEffect(() => {
    const stored = readNumber(window.localStorage, UNTIL_KEY)
    if (stored > Date.now()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique d'un blocage en cours
      setUntil(stored)
      setServerBlocked(true)
    }
  }, [])

  // Compte à rebours : calculé à partir de l'heure réelle, jamais d'un décompte qui dérive
  useEffect(() => {
    if (until <= Date.now()) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        setUntil(0)
        setServerBlocked(false)
        write(window.localStorage, UNTIL_KEY, null)
      }
    }
    tick()
    const timer = window.setInterval(tick, 500)
    return () => window.clearInterval(timer)
  }, [until])

  const recordFailure = useCallback(() => {
    const failures = readNumber(window.sessionStorage, FAILURES_KEY) + 1
    write(window.sessionStorage, FAILURES_KEY, failures)
    if (failures <= FREE_ATTEMPTS) return
    const delay = Math.min(BASE_DELAY_MS * 2 ** (failures - FREE_ATTEMPTS - 1), MAX_DELAY_MS)
    setServerBlocked(false)
    setUntil(Date.now() + delay)
  }, [])

  const recordServerBlock = useCallback((retryAfterMs?: number) => {
    const wait = Math.min(retryAfterMs && retryAfterMs > 0 ? retryAfterMs : 60_000, MAX_SERVER_LOCK_MS)
    const end = Date.now() + wait
    write(window.localStorage, UNTIL_KEY, end)
    setServerBlocked(true)
    setUntil(end)
  }, [])

  const recordSuccess = useCallback(() => {
    write(window.sessionStorage, FAILURES_KEY, null)
    write(window.localStorage, UNTIL_KEY, null)
    setUntil(0)
    setSecondsLeft(0)
    setServerBlocked(false)
  }, [])

  return { secondsLeft: until > 0 ? secondsLeft : 0, serverBlocked, recordFailure, recordServerBlock, recordSuccess }
}

// 125 -> « 2 min 05 s » ; 40 -> « 40 s »
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min ${String(seconds % 60).padStart(2, "0")} s`
}
