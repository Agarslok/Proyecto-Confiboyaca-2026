import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { INTRO_BOOT_SCRIPT } from "@/lib/session/site-session";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: {
    default: "Diagnóstico Empresarial Externado",
    template: "%s · Externado",
  },
  description:
    "Generador local de páginas web a partir de un formulario. El diagnóstico y la página salen de reglas en este equipo.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${interTight.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
