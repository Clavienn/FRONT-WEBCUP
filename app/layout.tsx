import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { NetworkStatus } from "@/components/network-status";
import { AnnouncementAlerts } from "@/components/realtime/announcement-alerts";
import { SiteChrome } from "@/components/site-chrome";
import { SupportBubble } from "@/components/support-bubble";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";
import "./accessibility.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Terra Nova | La première ville d'un nouveau monde",
  description:
    "Terra Nova est la plateforme numérique centrale de la première ville humaine installée sur un nouveau monde : services, actualités du Haut Conseil et vie citoyenne.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="isolate min-h-full flex flex-col">
        <LanguageProvider>
          {/* Toaster à la racine : une alerte du Haut Conseil doit surgir sur la page publique
              comme dans les tableaux de bord, pas seulement là où un ancien Toaster était monté. */}
          <Toaster>
            <SiteChrome>
              <div className="relative z-10 flex min-h-full flex-1 flex-col">
                <AuthProvider>
                  {children}
                  <AnnouncementAlerts />
                  <SupportBubble />
                  <NetworkStatus />
                </AuthProvider>
              </div>
            </SiteChrome>
          </Toaster>
        </LanguageProvider>
      </body>
    </html>
  );
}
