import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  href,
  type = "button",
  disabled,
  onClick,
  target,
  rel,
  className: extraClass,
}: ButtonProps) {
  const className = ["btn", `btn-${variant}`, extraClass].filter(Boolean).join(" ");
  if (href && !disabled) {
    return (
      <Link className={className} href={href} onClick={onClick} target={target} rel={rel}>
        {children}
      </Link>
    );
  }
  return (
    <button className={className} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
