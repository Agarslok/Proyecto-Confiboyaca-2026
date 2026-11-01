/** Iconos sobrios (trazo único) para nichos del stand / portada. */
const common = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type NicheIconName =
  | "bakery"
  | "restaurant"
  | "retail"
  | "fashion"
  | "hotel"
  | "health"
  | "farm"
  | "factory"
  | "mining"
  | "hotel-demo"
  | "mine-demo";

export function NicheIcon({ name, className }: { name: NicheIconName; className?: string }) {
  const props = { ...common, className, "aria-hidden": true };
  switch (name) {
    case "bakery":
      return (
        <svg {...props}>
          <path d="M4 14h16l-2 6H6l-2-6Z" />
          <path d="M8 14V9a4 4 0 0 1 8 0v5" />
        </svg>
      );
    case "restaurant":
      return (
        <svg {...props}>
          <path d="M8 3v8M8 11v8M16 3v18M12 3v6" />
        </svg>
      );
    case "retail":
      return (
        <svg {...props}>
          <path d="M6 9 5 4h14l-1 5" />
          <path d="M6 9h12v11H6V9Z" />
        </svg>
      );
    case "fashion":
      return (
        <svg {...props}>
          <path d="M12 3 8 7h8l-4-4Z" />
          <path d="M8 7 6 21h12l-2-14" />
        </svg>
      );
    case "hotel":
    case "hotel-demo":
      return (
        <svg {...props}>
          <path d="M4 20V8l8-4 8 4v12" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "health":
      return (
        <svg {...props}>
          <rect x="5" y="8" width="14" height="12" rx="2" />
          <path d="M12 11v6M9 14h6" />
        </svg>
      );
    case "farm":
      return (
        <svg {...props}>
          <path d="M4 20c4-8 12-8 16 0" />
          <path d="M12 12V4M9 7l3-3 3 3" />
        </svg>
      );
    case "factory":
      return (
        <svg {...props}>
          <path d="M3 20V10l5 3V8l5 3V6l5 3v11" />
          <path d="M3 20h18" />
        </svg>
      );
    case "mining":
    case "mine-demo":
      return (
        <svg {...props}>
          <path d="M12 3 4 20h16L12 3Z" />
          <path d="M9 16h6" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
