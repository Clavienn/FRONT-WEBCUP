import {
  Briefcase,
  Building2,
  Bus,
  Droplet,
  Flame,
  GraduationCap,
  HeartPulse,
  Home,
  IdCard,
  Landmark,
  Leaf,
  Palette,
  Radio,
  ShieldCheck,
  Sprout,
  Trash2,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react"

// Le backend stocke un nom d'icône Lucide en kebab-case (ex. "heart-pulse").
// Table statique : évite d'embarquer toute la bibliothèque. Ajouter ici les noms à rendre disponibles.
export const serviceIcons: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  "building-2": Building2,
  bus: Bus,
  droplet: Droplet,
  flame: Flame,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  home: Home,
  "id-card": IdCard,
  landmark: Landmark,
  leaf: Leaf,
  palette: Palette,
  radio: Radio,
  "shield-check": ShieldCheck,
  sprout: Sprout,
  "trash-2": Trash2,
  wifi: Wifi,
  zap: Zap,
}

export function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && serviceIcons[name.trim().toLowerCase()]) || Landmark
  return <Icon className={className} aria-hidden="true" />
}
