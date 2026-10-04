import type { ManagerOptions } from "socket.io-client"

// Adresse réelle de l'API (avec son préfixe /api). Reste utilisée telle quelle pour les images servies par
// l'API (/uploads), qu'un <img> charge sans être soumis au CORS.
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

// Base des appels fetch. Dans le navigateur : /api sur le site lui-même, relayé vers l'API par proxy.ts, donc
// aucune requête vers un autre domaine. Côté serveur (rendu) : l'API directement, une URL relative n'y ayant pas
// de sens.
export const API_URL = BACKEND_API_URL && (typeof window === "undefined" ? BACKEND_API_URL : "/api")

// Temps réel (socket.io). L'hébergement de l'API rompt la poignée de main WebSocket (réponse 101 sans
// « Connection: Upgrade », que les navigateurs rejettent) : le canal passe en long-polling HTTP, relayé lui aussi
// par proxy.ts, sur le site lui-même. Les sockets ne s'ouvrent que dans le navigateur.
export const SOCKET_URL =
  BACKEND_API_URL && (typeof window === "undefined" ? BACKEND_API_URL.replace(/\/api$/, "") : window.location.origin)

export const SOCKET_OPTIONS: Partial<ManagerOptions> = {
  transports: ["polling"],
  // /socket.io sans barre finale : Next.js redirigerait /socket.io/ avant que proxy.ts ne le relaie
  path: "/socket.io",
  addTrailingSlash: false,
}
