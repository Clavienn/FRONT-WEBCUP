import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

// Origine de l'API : la seule autre destination que le navigateur a le droit de contacter (connect-src).
// Une page compromise ne peut donc pas envoyer de données vers un serveur tiers.
function apiOrigin(): string | null {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : null
  } catch {
    return null
  }
}

// Politique de contenu. Les scripts sont limités à ceux du site : aucun script externe ne peut s'exécuter.
// 'unsafe-inline' reste nécessaire pour les scripts de démarrage de Next.js : une CSP par nonce obligerait à
// rendre toutes les pages dynamiquement à chaque requête (voir docs Next.js, « Content Security Policy »),
// ce qui pèserait sur la tenue en charge. Les autres directives (pas d'objet, pas d'iframe, pas de
// <base> détourné, formulaires et connexions limités au site et à l'API) gardent toute leur valeur.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${[apiOrigin(), isDev ? "ws: wss:" : null].filter(Boolean).join(" ")}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Seulement quand l'API est en HTTPS : forcer le HTTPS vers une API locale en HTTP casserait les essais en production locale
  ...(!isDev && apiOrigin()?.startsWith("https:") ? ["upgrade-insecure-requests"] : []),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Le site ne peut pas être affiché dans une iframe d'un autre site (détournement de clic)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Les adresses internes (identifiants dans l'URL) ne sont pas transmises aux sites vers lesquels on part
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Capteurs inutiles à la plateforme : refusés même si un script voulait les demander
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // HTTPS imposé pour deux ans (hors développement local, qui est en HTTP)
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]),
]

const nextConfig: NextConfig = {
  // Ne pas annoncer la technologie du serveur
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Espace connecté : jamais conservé en cache ni restauré par le bouton « précédent » après une
      // déconnexion (sur un poste partagé, la page précédente ne doit pas réapparaître avec ses données).
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      { source: "/profil", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ]
  },
}

export default nextConfig
