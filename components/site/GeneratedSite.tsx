"use client";

import { SiteTemplateView } from "@/components/templates/SiteTemplateView";
import type { SiteConfig } from "@/types/site";

export function GeneratedSite({ config }: { config: SiteConfig }) {
  return <SiteTemplateView config={config} />;
}
