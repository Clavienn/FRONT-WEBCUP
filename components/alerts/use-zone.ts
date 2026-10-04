"use client"

import { useCallback, useSyncExternalStore } from "react"

import { ALERT_ZONES, type AlertZone } from "@/repository/alert.repository"

// Quartier de l'habitant, mémorisé dans ce navigateur (même sans compte) : les alertes qui le concernent
// sont mises en avant partout, sans qu'il ait à le redire.
const KEY = "terra-nova:zone"
const EVENT = "terra-nova:zone-change"

function read(): AlertZone | null {
  try {
    const value = window.localStorage.getItem(KEY)
    return ALERT_ZONES.includes(value as AlertZone) ? (value as AlertZone) : null
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  // Un autre onglet qui change de quartier met celui-ci à jour
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function useZone() {
  const zone = useSyncExternalStore(subscribe, read, () => null)

  const setZone = useCallback((next: AlertZone | null) => {
    try {
      if (next) window.localStorage.setItem(KEY, next)
      else window.localStorage.removeItem(KEY)
    } catch {
      // stockage indisponible : le choix vaut pour cette page seulement
    }
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { zone, setZone }
}
