"use client";

import { useSyncExternalStore } from "react";
import {
  getWalkthroughServerSnapshot,
  getWalkthroughSnapshot,
  subscribeWalkthrough,
} from "@/lib/session/browser-session";

export function useWalkthrough() {
  return useSyncExternalStore(
    subscribeWalkthrough,
    getWalkthroughSnapshot,
    getWalkthroughServerSnapshot,
  );
}
