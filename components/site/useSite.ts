"use client";

import { useSyncExternalStore } from "react";
import {
  getSiteServerSnapshot,
  getSiteSnapshot,
  subscribeSite,
} from "@/lib/session/site-session";

export function useSite() {
  return useSyncExternalStore(subscribeSite, getSiteSnapshot, getSiteServerSnapshot);
}
