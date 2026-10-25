import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const Icon = {
  arrow: (props: IconProps) => (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" {...props}>
      <path
        d="M4 10h11M11 5.5 15.5 10 11 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  back: (props: IconProps) => (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" {...props}>
      <path
        d="M16 10H5M9 5.5 4.5 10 9 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (props: IconProps) => (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...props}>
      <path
        d="m4.5 10.5 3.5 3.5 7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  clock: (props: IconProps) => (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.2l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  x: (props: IconProps) => (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" {...props}>
      <path
        d="m5.5 5.5 9 9M14.5 5.5l-9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  edit: (props: IconProps) => (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" {...props}>
      <path
        d="M4 16h3l8.5-8.5-3-3L4 13v3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export function ExtIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path
        d="M6 3h7v7M13 3 4.5 11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
