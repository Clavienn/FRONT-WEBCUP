import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteChrome } from "@/components/site-chrome";
import { SupportBubble } from "@/components/support-bubble";
import "./globals.css";

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
        <SiteChrome>
          <div className="relative z-10 flex min-h-full flex-1 flex-col">
            <AuthProvider>{children}</AuthProvider>
          </div>
        </SiteChrome>
      </body>
    </html>
  );
}
