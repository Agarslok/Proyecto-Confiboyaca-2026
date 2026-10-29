"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FluidBackground } from "@/components/externado/fluid-background";

export function ExperienceChrome({
  children,
  showExperiencesLink = true,
}: {
  children: ReactNode;
  showExperiencesLink?: boolean;
}) {
  return (
    <div className="experience-shell">
      <FluidBackground />
      <div className="wrap">
        {showExperiencesLink ? (
          <div className="experience-bar">
            <Link href="/" className="link-btn">
              Experiencias
            </Link>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
