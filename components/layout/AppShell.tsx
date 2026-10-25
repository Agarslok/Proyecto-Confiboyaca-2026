"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ColibriIntro } from "@/components/brand/ColibriIntro";
import { ColibriMark } from "@/components/brand/ColibriMark";
import { FluidBackground } from "@/components/externado/fluid-background";
import { SiteFooter } from "@/components/externado/site-footer";
import { SiteHeader } from "@/components/externado/site-header";
import { HOME_SECTIONS } from "@/components/externado/team-config";
import { scrollToSection } from "@/components/externado/use-reveal";
import { useSite } from "@/components/site/useSite";
import { resetWalkthrough } from "@/lib/session/browser-session";
import { INTRO_SEEN_KEY, resetSite } from "@/lib/session/site-session";

const introListeners = new Set<() => void>();

function emitIntro(): void {
  introListeners.forEach((listener) => listener());
}

function subscribeIntro(listener: () => void): () => void {
  introListeners.add(listener);
  return () => introListeners.delete(listener);
}

function introIsPending(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== "1";
  } catch {
    return false;
  }
}

function screenClass(pathname: string): string {
  if (pathname === "/") return "welcome";
  if (pathname.startsWith("/diagnostico")) return "form";
  if (pathname.startsWith("/resultado")) return "results";
  if (pathname.startsWith("/preview")) return "demo";
  return "flow";
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isStandaloneSite = pathname.startsWith("/sitio");
  const state = useSite();
  const shellRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const showIntro = useSyncExternalStore(subscribeIntro, introIsPending, () => false);
  const [activeSection, setActiveSection] = useState("");
  const inFlow = pathname !== "/";

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* Si el almacenamiento falla, la intro no se vuelve a exigir. */
    }
    document.documentElement.dataset.intro = "done";
    if (shellRef.current) shellRef.current.style.clipPath = "";
    emitIntro();
  }, []);

  useEffect(() => {
    if (shellRef.current) shellRef.current.inert = showIntro;
  }, [showIntro]);

  useEffect(() => {
    if (pathname !== "/" || typeof IntersectionObserver === "undefined") return;
    const els = HOME_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const onTop = () => {
      if (window.scrollY < 200) setActiveSection("");
    };
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, [pathname]);

  function replayIntro() {
    try {
      sessionStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      /* Se reproduce igual en esta visita. */
    }
    document.documentElement.dataset.intro = "pending";
    if (shellRef.current) shellRef.current.style.clipPath = "circle(0px at 50% 46%)";
    emitIntro();
  }

  function restart() {
    resetSite();
    resetWalkthrough();
    router.push("/");
  }

  function onHome() {
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSection(id: string) {
    if (pathname === "/") scrollToSection(id);
    else {
      router.push("/");
      window.setTimeout(() => scrollToSection(id), 120);
    }
  }

  const hiddenStyle = showIntro ? { clipPath: "circle(0px at 50% 46%)" } : undefined;

  if (isStandaloneSite) {
    return <>{children}</>;
  }

  return (
    <>
      {showIntro ? (
        <ColibriIntro key="intro" shellRef={shellRef} markRef={markRef} onDone={finishIntro} />
      ) : null}
      <div className="app" ref={shellRef} style={hiddenStyle}>
        <FluidBackground />
        <SiteHeader
          inFlow={inFlow}
          activeSection={pathname === "/" ? activeSection : ""}
          onHome={onHome}
          onSection={onSection}
          onStart={() => router.push("/diagnostico")}
          onRestart={restart}
        />
        <main id="main" className={`main screen-${screenClass(pathname)}`}>
          {state.storageWarning ? (
            <div className="wrap">
              <p className="banner" role="status">{state.storageWarning}</p>
            </div>
          ) : null}
          {children}
        </main>
        <SiteFooter onReplay={replayIntro} onSection={onSection} />
        <ColibriMark buttonRef={markRef} hidden={showIntro} />
      </div>
    </>
  );
}
