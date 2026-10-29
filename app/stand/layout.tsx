import type { ReactNode } from "react";
import { StandShell } from "@/features/stand/stand-shell";

export default function StandLayout({ children }: { children: ReactNode }) {
  return <StandShell>{children}</StandShell>;
}
