import { NextResponse, type NextRequest } from "next/server"

// Les appels du navigateur à l'API passent par le site lui-même (/api/...) et sont relayés ici vers l'API.
// Pour le navigateur, la requête reste sur la même origine : aucune négociation CORS, quelle que soit l'adresse
// du site (production, préversions Vercel), et le cookie de session (path /api/auth) devient un cookie du site.
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

function isSameOrigin(origin: string, host: string | null): boolean {
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ message: "La variable NEXT_PUBLIC_API_URL n'est pas configurée." }, { status: 500 })
  }

  // L'API refuse sur /auth/refresh et /auth/logout toute origine absente de sa liste (CLIENT_URL), où le
  // domaine du site ne figure pas : l'en-tête Origin est donc retiré avant de relayer. La même barrière est
  // tenue ici à sa place : une requête venue d'un autre site est refusée avant d'atteindre l'API.
  const origin = request.headers.get("origin")
  if (origin && !isSameOrigin(origin, request.headers.get("host"))) {
    return NextResponse.json({ code: "origin_not_allowed", message: "Origine non autorisée" }, { status: 403 })
  }

  const headers = new Headers(request.headers)
  headers.delete("origin")

  const { pathname, search } = request.nextUrl
  // socket.io (lib/api-url.ts) est monté à la racine du serveur de l'API, hors de /api, et y attend la barre finale
  const target =
    pathname === "/socket.io"
      ? new URL(`/socket.io/${search}`, API_URL)
      : new URL(`${API_URL}${pathname.replace(/^\/api/, "")}${search}`)
  return NextResponse.rewrite(target, { request: { headers } })
}

export const config = {
  matcher: ["/api/:path*", "/socket.io"],
}
