import { cn } from "@/lib/utils"
import { BRAND_MARK_RATIO } from "@/config/brand"

interface BrandMarkProps {
  /** Largeur du glyphe. La hauteur découle du ratio, donc ne pas poser de hauteur. */
  className?: string
}

/**
 * Glyphe Terra Nova seul, sans logotype.
 *
 * Teint via `currentColor` : le même asset sert la landing, le thème clair et le thème sombre.
 * Purement décoratif — le nom est toujours porté par le texte voisin, donc `aria-hidden`.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("brand-mark", className)}
      style={{ aspectRatio: BRAND_MARK_RATIO }}
    />
  )
}
