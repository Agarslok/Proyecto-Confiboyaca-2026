"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExtIcon } from "@/components/externado/icons";
import type { TeamMember } from "@/components/externado/team-config";

/** Segundos para recorrer un ciclo completo (6 personas). Más alto = más lento. */
const MARQUEE_DURATION_S = 85;

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

function marqueeAnimation(track: HTMLElement | null): Animation | null {
  if (!track) return null;
  const anims = track.getAnimations();
  return (
    anims.find((a) => (a as CSSAnimation).animationName === "teamMarquee") ?? anims[0] ?? null
  );
}

export function TeamCarousel({ members }: { members: TeamMember[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const dragRef = useRef({ pending: false, active: false, startX: 0, startTime: 0 });

  const cardHoverCountRef = useRef(0);
  const [cardHovered, setCardHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  /** Solo pausa cuando el cursor está encima de una tarjeta (no por clic ni por el área vacía). */
  const paused = cardHovered;

  function onCardPointerEnter() {
    cardHoverCountRef.current += 1;
    setCardHovered(true);
  }

  function onCardPointerLeave() {
    cardHoverCountRef.current = Math.max(0, cardHoverCountRef.current - 1);
    setCardHovered(cardHoverCountRef.current > 0);
  }
  const loop = [...members, ...members];
  const marqueeOn = !reduceMotion;

  const nudge = useCallback((direction: -1 | 1) => {
    const anim = marqueeAnimation(trackRef.current);
    if (!anim) return;
    const stepMs = (MARQUEE_DURATION_S * 1000) / members.length;
    const current = (anim.currentTime as number | null) ?? 0;
    anim.currentTime = current + direction * stepMs;
  }, [members.length]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("a, button"));
  }

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (!marqueeOn || event.button !== 0 || isInteractiveTarget(event.target)) return;
    const anim = marqueeAnimation(trackRef.current);
    if (!anim) return;
    dragRef.current = {
      pending: true,
      active: false,
      startX: event.clientX,
      startTime: (anim.currentTime as number | null) ?? 0,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    const anim = marqueeAnimation(track);
    if (!track || !anim || !dragRef.current.pending) return;

    const dx = event.clientX - dragRef.current.startX;
    if (!dragRef.current.active) {
      if (Math.abs(dx) < 8) return;
      dragRef.current.active = true;
      track.setPointerCapture(event.pointerId);
    }
    anim.currentTime = dragRef.current.startTime - dx * 2.2;
  };

  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    if (!track) return;
    const wasDragging = dragRef.current.active;
    dragRef.current = { pending: false, active: false, startX: 0, startTime: 0 };
    if (!wasDragging) return;
    try {
      track.releasePointerCapture(event.pointerId);
    } catch {
      /* captura ya liberada */
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudge(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudge(1);
    }
  };

  const nameRibbon = members.map((m) => m.displayName).join(" · ");

  return (
    <div className="team-carousel">
      <div className="team-name-ribbon" aria-hidden="true">
        <span className="team-name-ribbon-inner">{nameRibbon} · {nameRibbon}</span>
      </div>

      <div className="team-carousel-viewport">
        <button
          type="button"
          className="team-carousel-nav team-carousel-nav-prev"
          aria-label="Ver integrantes anteriores"
          onClick={(event) => {
            event.stopPropagation();
            nudge(-1);
          }}
        >
          ‹
        </button>
        <button
          type="button"
          className="team-carousel-nav team-carousel-nav-next"
          aria-label="Ver siguientes integrantes"
          onClick={(event) => {
            event.stopPropagation();
            nudge(1);
          }}
        >
          ›
        </button>

        <ul
          ref={trackRef}
          className={`team-carousel-track${marqueeOn ? " is-marquee" : ""}${paused ? " is-paused" : ""}`}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={
            marqueeOn
              ? {
                  animationDuration: `${MARQUEE_DURATION_S}s`,
                  animationPlayState: paused ? "paused" : "running",
                }
              : undefined
          }
          aria-label="Carrusel del equipo. Pase el cursor sobre las tarjetas para pausar; al quitar el cursor continúa el desplazamiento."
        >
          {loop.map((member, index) => (
            <li
              key={`${member.displayName}-${index}`}
              className="card team-carousel-card"
              onMouseEnter={onCardPointerEnter}
              onMouseLeave={onCardPointerLeave}
            >
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
              {member.links.linkedin || member.links.github ? (
                <div className="team-links">
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

      <p className="team-carousel-hint" aria-hidden="true">
        {paused
          ? ""
          : reduceMotion
            ? ""
            : ""}
      </p>
    </div>
  );
}
