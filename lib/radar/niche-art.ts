/* ============================================================================
   Ilustraciones planas por nicho para las tarjetas de producto.
   La plantilla de tienda dibuja costales, botellas y cajas cuando un producto
   no trae foto; para una tienda de ropa eso no tiene sentido. Aquí se arman
   prendas en SVG, con el mismo estilo plano de la plantilla, y se pasan como
   la imagen del producto (data URI). Sin archivos ni servicios externos.
   ========================================================================== */

export type Garment = "shirt" | "jeans" | "jacket" | "dress" | "hoodie" | "sneaker";

const SHAPES: Record<Garment, (ink: string) => string> = {
  shirt: (ink) =>
    `<path d="M70 58 L88 50 Q100 62 112 50 L130 58 L160 82 L146 104 L134 96 V196 H66 V96 L54 104 L40 82 Z" fill="${ink}"/>` +
    `<path d="M88 50 L100 74 L112 50" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>` +
    `<path d="M100 74 V196" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>` +
    [92, 116, 140, 164].map((y) => `<circle cx="104" cy="${y}" r="2.6" fill="#fff" fill-opacity=".8"/>`).join(""),
  jeans: (ink) =>
    `<path d="M64 46 H136 L146 204 H110 L100 104 L90 204 H54 Z" fill="${ink}"/>` +
    `<path d="M64 62 H136" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>` +
    `<path d="M74 62 Q80 82 96 82 M126 62 Q120 82 104 82" fill="none" stroke="#e9c46a" stroke-width="2"/>` +
    `<path d="M100 62 V104" stroke="#e9c46a" stroke-width="2"/>`,
  jacket: (ink) =>
    `<path d="M68 54 L90 46 L100 60 L110 46 L132 54 L162 86 L148 112 L136 102 V196 H64 V102 L52 112 L38 86 Z" fill="${ink}"/>` +
    `<path d="M90 46 L100 120 L110 46" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>` +
    `<path d="M100 120 V196" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>` +
    `<rect x="72" y="140" width="20" height="16" rx="2" fill="#fff" fill-opacity=".25"/><rect x="108" y="140" width="20" height="16" rx="2" fill="#fff" fill-opacity=".25"/>`,
  dress: (ink) =>
    `<path d="M84 44 L92 44 Q100 58 108 44 L116 44 L124 92 L156 200 H44 L76 92 Z" fill="${ink}"/>` +
    `<path d="M76 96 H124" stroke="#fff" stroke-opacity=".6" stroke-width="4"/>` +
    `<path d="M92 44 Q100 58 108 44" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`,
  hoodie: (ink) =>
    `<path d="M80 50 Q100 26 120 50 L132 56 L162 92 L146 114 L136 104 V196 H64 V104 L54 114 L38 92 L68 56 Z" fill="${ink}"/>` +
    `<path d="M80 50 Q100 80 120 50" fill="#000" fill-opacity=".18"/>` +
    `<path d="M94 72 V100 M106 72 V100" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>` +
    `<rect x="78" y="146" width="44" height="26" rx="6" fill="#000" fill-opacity=".14"/>`,
  sneaker: (ink) =>
    `<path d="M40 150 Q44 116 74 112 L104 104 Q116 124 150 130 Q170 134 168 158 H40 Z" fill="#fff"/>` +
    `<path d="M74 112 L104 104 Q116 124 150 130 Q160 132 164 140 H88 Q72 140 70 124 Z" fill="${ink}"/>` +
    `<rect x="38" y="156" width="132" height="14" rx="5" fill="${ink}" fill-opacity=".85"/>` +
    [84, 94, 104].map((x) => `<path d="M${x} 116 L${x + 10} 126" stroke="#fff" stroke-width="2.5"/>`).join(""),
};

const PALETTE: [tint: string, ink: string][] = [
  ["#e4ecf5", "#2b5ea8"],
  ["#f3e9d9", "#2c3e66"],
  ["#e8efe6", "#3f6b52"],
  ["#f4e1de", "#b23a30"],
  ["#ece6f3", "#6b4aa0"],
  ["#f2efe9", "#222222"],
];

export function garmentImage(garment: Garment, index: number): string {
  const [tint, ink] = PALETTE[index % PALETTE.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice">` +
    `<rect width="200" height="240" fill="${tint}"/>` +
    `<ellipse cx="100" cy="214" rx="60" ry="8" fill="#000" fill-opacity=".08"/>` +
    SHAPES[garment](ink) +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
