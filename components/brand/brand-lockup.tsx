import { BrandMark } from "@/components/brand/brand-mark"
import { BRAND_NAME } from "@/config/brand"
import { cn } from "@/lib/utils"

interface BrandLockupProps {
  /** Largeur du glyphe ; commande aussi la hauteur du logotype voisin. */
  markClassName?: string
  /** Typographie du logotype : chaque surface garde ainsi son échelle d'origine. */
  wordmarkClassName?: string
  className?: string
}

/**
 * Glyphe et logotype Terra Nova côte à côte.
 *
 * La mise en page appartient au composant, la typographie à la surface appelante : la landing
 * et le tableau de bord n'utilisent ni la même graisse ni le même interlettrage.
 */
export function BrandLockup({
  markClassName,
  wordmarkClassName,
  className,
}: BrandLockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={cn("w-7 shrink-0", markClassName)} />
      <span className={cn("font-bold tracking-[0.2em] uppercase", wordmarkClassName)}>
        {BRAND_NAME}
      </span>
    </span>
  )
}
