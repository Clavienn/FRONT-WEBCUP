import { SOCIAL_LINKS } from "@/config/landing-content"

export function SocialRail() {
  return (
    <nav className="tn-rail tn-rail--links" aria-label="Liens externes">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="tn-rail-label"
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
