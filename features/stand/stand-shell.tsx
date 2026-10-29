"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ExperienceChrome } from "@/components/shared/experience-chrome";

const LINKS = [
  { href: "/stand", label: "Sector" },
  { href: "/stand/diagnostico", label: "Diagnóstico" },
  { href: "/stand/resultado", label: "Resultado" },
  { href: "/stand/demo", label: "Demostración" },
] as const;

export function StandShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ExperienceChrome>
      <nav className="experience-nav" aria-label="Recorrido del stand">
        <ul className="experience-links">
          {LINKS.map((link) => {
            const current = link.href === "/stand" ? pathname === "/stand" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} aria-current={current ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </ExperienceChrome>
  );
}
