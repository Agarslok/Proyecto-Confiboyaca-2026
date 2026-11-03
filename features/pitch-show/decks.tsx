"use client";

import { SHOW_SLIDES } from "./deck";
import { SHOW_SLIDES_V2 } from "./deck-v2";
import { ShowDeck } from "./show-deck";
import { SHOW_VIEWS } from "./slides";
import { SHOW_VIEWS_V2 } from "./slides-v2";

/* Versiones del pitch. Las páginas son de servidor y no pueden pasar componentes como props, por eso se arman aquí. */

export function PitchV2() {
  return <ShowDeck slides={SHOW_SLIDES_V2} views={SHOW_VIEWS_V2} versions={[{ href: "/pitch/v1", label: "v1" }, { href: "/pitch/clasico", label: "clásico" }]} />;
}

export function PitchV1() {
  return <ShowDeck slides={SHOW_SLIDES} views={SHOW_VIEWS} versions={[{ href: "/pitch", label: "v2" }, { href: "/pitch/clasico", label: "clásico" }]} />;
}
