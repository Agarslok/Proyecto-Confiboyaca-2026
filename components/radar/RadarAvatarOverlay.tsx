"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TavusCviProvider } from "@/components/catch/TavusCviProvider";
import { Icon } from "@/components/externado/icons";
import { AvatarStage } from "@/features/pitch/components/avatar-stage";

interface RadarAvatarOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function RadarAvatarOverlay({ open, onClose }: RadarAvatarOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="radar-avatar-overlay" role="dialog" aria-modal="true" aria-labelledby="radar-avatar-title">
      <button type="button" className="radar-avatar-scrim" onClick={onClose} aria-label="Cerrar formulario con avatar" />
      <div className="radar-avatar-dialog">
        <header className="radar-avatar-dialog-head">
          <div>
            <p className="micro">Consultor en vivo</p>
            <h2 id="radar-avatar-title" className="radar-avatar-dialog-title">
              Formulario con avatar
            </h2>
          </div>
          <button type="button" className="icon-btn radar-avatar-close" onClick={onClose} aria-label="Cerrar">
            <Icon.x />
          </button>
        </header>
        <div className="radar-avatar-dialog-body">
          <TavusCviProvider canStartTavus detached>
            <div className="pd-inner pd-avatar has-side radar-avatar-stage-wrap">
              <AvatarStage foldSideColumn />
            </div>
          </TavusCviProvider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
