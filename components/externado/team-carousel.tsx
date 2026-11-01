"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExtIcon } from "@/components/externado/icons";
import type { TeamMember } from "@/components/externado/team-config";

/** Segundos para recorrer un ciclo completo (6 personas). Más alto = más lento. */
const MARQUEE_DURATION_S = 85;
const MARQUEE_MS = MARQUEE_DURATION_S * 1000;
const THUMB_RATIO = 0.22;

function TeamProfileLink({ href, person }: { href: string; person: string }) {
  return (
    <a
      className="team-link team-link-social"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={(event) => event.stopPropagation()}
    >
      Perfil UExternado <ExtIcon />
      <span className="sr-only"> de {person} (se abre en una pestaña nueva)</span>
    </a>
  );
}

function TeamSocialLink({
  kind,
  href,
  person,
}: {
  kind: "linkedin" | "github";
  href: string;
  person: string;
}) {
  const label = kind === "linkedin" ? "LinkedIn" : "GitHub";
  return (
    <a
      className="team-link team-link-social"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {label} <ExtIcon />
      <span className="sr-only"> de {person} (se abre en una pestaña nueva)</span>
    </a>
  );
}

function findMarqueeAnimation(
  el: HTMLElement | null,
  name: "teamMarquee" | "teamRibbon",
): Animation | null {
  if (!el) return null;
  return el.getAnimations().find((a) => (a as CSSAnimation).animationName === name) ?? null;
}

export function TeamCarousel({ members }: { members: TeamMember[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pending: false, active: false, startX: 0, trackTime: 0 });
  const scrubbingRef = useRef(false);
  const scrollDragRef = useRef(false);

  const [scrubbing, setScrubbing] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const loop = [...members, ...members];
  const marqueeOn = !reduceMotion;
  const nameSegment = `${members.map((m) => m.displayName).join(" · ")} · `;
  const thumbProgress = scrubValue / 1000;

  const collectAnimations = useCallback(() => {
    const list: Animation[] = [];
    const track = findMarqueeAnimation(trackRef.current, "teamMarquee");
    const ribbon = findMarqueeAnimation(ribbonRef.current, "teamRibbon");
    if (track) list.push(track);
    if (ribbon) list.push(ribbon);
    return list;
  }, []);

  const setMarqueeTime = useCallback(
    (ms: number) => {
      const wrapped = ((ms % MARQUEE_MS) + MARQUEE_MS) % MARQUEE_MS;
      collectAnimations().forEach((anim) => {
        anim.currentTime = wrapped;
      });
      setScrubValue(Math.round((wrapped / MARQUEE_MS) * 1000));
    },
    [collectAnimations],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!marqueeOn || scrubbing) return;
    let frame = 0;
    const tick = () => {
      if (!scrubbingRef.current) {
        const trackAnim = findMarqueeAnimation(trackRef.current, "teamMarquee");
        const t = (trackAnim?.currentTime as number | null) ?? 0;
        setScrubValue(Math.round(((t % MARQUEE_MS) / MARQUEE_MS) * 1000));
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [marqueeOn, scrubbing]);

  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("a, button"));
  }

  const seekScrollFromClientX = useCallback(
    (clientX: number) => {
      const track = scrollTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const travel = 1 - THUMB_RATIO;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setMarqueeTime(ratio * travel * MARQUEE_MS);
    },
    [setMarqueeTime],
  );

  const startScrub = () => {
    scrubbingRef.current = true;
    setScrubbing(true);
  };

  const endScrub = () => {
    scrubbingRef.current = false;
    scrollDragRef.current = false;
    setScrubbing(false);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isInteractiveTarget(event.target)) return;
    const trackAnim = findMarqueeAnimation(trackRef.current, "teamMarquee");
    if (!marqueeOn && !trackAnim) return;
    dragRef.current = {
      pending: true,
      active: false,
      startX: event.clientX,
      trackTime: (trackAnim?.currentTime as number | null) ?? 0,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root || !dragRef.current.pending) return;

    const dx = event.clientX - dragRef.current.startX;
    if (!dragRef.current.active) {
      if (Math.abs(dx) < 4) return;
      dragRef.current.active = true;
      root.setPointerCapture(event.pointerId);
    }

    const width = root.clientWidth || window.innerWidth;
    const deltaMs = (dx / width) * MARQUEE_MS;
    setMarqueeTime(dragRef.current.trackTime - deltaMs);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const wasDragging = dragRef.current.active;
    dragRef.current = { pending: false, active: false, startX: 0, trackTime: 0 };
    if (!wasDragging) return;
    try {
      root.releasePointerCapture(event.pointerId);
    } catch {
      /* captura ya liberada */
    }
  };

  const onScrollTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const track = scrollTrackRef.current;
    if (!track) return;
    scrollDragRef.current = true;
    startScrub();
    track.setPointerCapture(event.pointerId);
    seekScrollFromClientX(event.clientX);
  };

  const onScrollTrackPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollDragRef.current) return;
    seekScrollFromClientX(event.clientX);
  };

  const onScrollTrackPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollDragRef.current) return;
    const track = scrollTrackRef.current;
    try {
      track?.releasePointerCapture(event.pointerId);
    } catch {
      /* ok */
    }
    endScrub();
  };

  const trackMarqueeStyle = marqueeOn
    ? {
        animationDuration: `${MARQUEE_DURATION_S}s`,
        animationPlayState: scrubbing ? ("paused" as const) : ("running" as const),
      }
    : undefined;

  const ribbonMarqueeStyle = marqueeOn
    ? {
        animationDuration: `${MARQUEE_DURATION_S}s`,
        animationPlayState: scrubbing ? ("paused" as const) : ("running" as const),
      }
    : undefined;

  const thumbTravelPct = (1 - THUMB_RATIO) * 100;
  const thumbLeftPct = thumbProgress * thumbTravelPct;

  return (
    <div
      ref={rootRef}
      className="team-carousel"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      tabIndex={0}
      role="region"
      aria-label="Equipo. Arrastre horizontalmente o use la barra inferior para mover el carrusel."
    >
      <div className="team-name-ribbon" aria-hidden="true">
        <div
          ref={ribbonRef}
          className={`team-name-ribbon-track${marqueeOn ? " is-marquee" : ""}`}
          style={ribbonMarqueeStyle}
        >
          <span>{nameSegment}</span>
          <span>{nameSegment}</span>
        </div>
      </div>

      <div className="team-carousel-viewport">
        <ul
          ref={trackRef}
          className={`team-carousel-track${marqueeOn ? " is-marquee" : ""}`}
          style={trackMarqueeStyle}
        >
          {loop.map((member, index) => (
            <li key={`${member.displayName}-${index}`} className="card team-carousel-card">
              <div className="team-carousel-photo-wrap">
                <Image
                  className="team-carousel-photo"
                  src={member.photo}
                  alt={member.displayName}
                  width={120}
                  height={120}
                  sizes="120px"
                  draggable={false}
                />
              </div>
              <div className="team-carousel-id">
                <h3 className="team-carousel-name">{member.displayName}</h3>
                <p className="team-carousel-role">{member.role}</p>
              </div>
              {member.links.linkedin || member.links.github || member.links.profile ? (
                <div className="team-links">
                  {member.links.profile ? (
                    <TeamProfileLink href={member.links.profile} person={member.displayName} />
                  ) : null}
                  {member.links.linkedin ? (
                    <TeamSocialLink kind="linkedin" href={member.links.linkedin} person={member.displayName} />
                  ) : null}
                  {member.links.github ? (
                    <TeamSocialLink kind="github" href={member.links.github} person={member.displayName} />
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {marqueeOn ? (
        <div
          ref={scrollTrackRef}
          className="team-loop-scroll"
          role="slider"
          aria-label="Posición del carrusel del equipo"
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-valuenow={scrubValue}
          tabIndex={0}
          onPointerDown={onScrollTrackPointerDown}
          onPointerMove={onScrollTrackPointerMove}
          onPointerUp={onScrollTrackPointerUp}
          onPointerCancel={onScrollTrackPointerUp}
        >
          <span
            className="team-loop-scroll-thumb"
            style={{
              width: `${THUMB_RATIO * 100}%`,
              left: `${thumbLeftPct}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
