"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type Ref } from "react";

/** Video de la diapositiva 6. Sustituye al avatar en vivo hasta nueva integración. */
export const PITCH_VIDEO_SRC =
  process.env.NEXT_PUBLIC_PITCH_VIDEO_SRC?.trim() || "/pitch-presentacion.mp4";

type VideoStageProps = {
  active?: boolean;
};

export const VideoStage = forwardRef(function VideoStage(
  { active = false }: VideoStageProps,
  ref: Ref<HTMLVideoElement>,
) {
  const localRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => localRef.current as HTMLVideoElement);

  useEffect(() => {
    const el = localRef.current;
    if (!active || !el) return;
    el.currentTime = 0;
    void el.play().catch(() => {
      /* Autoplay con sonido puede bloquearse; el presentador usa espacio. */
    });
  }, [active]);

  return (
    <div className="pd-video-stage" onClick={(event) => event.stopPropagation()}>
      <video
        ref={localRef}
        className="pd-video-el"
        src={PITCH_VIDEO_SRC}
        playsInline
        preload="auto"
        autoPlay
        aria-label="Video de la presentación"
      />
    </div>
  );
});
