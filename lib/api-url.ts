// Adresse réelle de l'API (avec son préfixe /api). Reste utilisée telle quelle pour les images servies par
// l'API (/uploads) et pour le temps réel : ni l'un ni l'autre n'est soumis au CORS.
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

// Base des appels fetch. Dans le navigateur : /api sur le site lui-même, relayé vers l'API par proxy.ts, donc
// aucune requête vers un autre domaine. Côté serveur (rendu) : l'API directement, une URL relative n'y ayant pas
// de sens.
export const API_URL = BACKEND_API_URL && (typeof window === "undefined" ? BACKEND_API_URL : "/api")
