import Link from "next/link";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "onDark";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cobalt-600 text-white border-cobalt-600 hover:brightness-110",
  accent: "bg-brick-600 text-white border-brick-600 hover:brightness-110",
  outline: "bg-transparent text-cobalt-800 border-ink-200 hover:border-cobalt-600",
  ghost: "bg-transparent text-cobalt-800 border-transparent hover:bg-cobalt-50",
  onDark: "bg-cream-50 text-cobalt-900 border-cream-50 hover:brightness-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-base gap-2",
  lg: "px-8 py-4 text-lg gap-2.5",
};

type Props = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Oswald uppercase label, used on desktop marketing surfaces. */
  display?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  display,
  iconLeft,
  iconRight,
  href,
  children,
  disabled,
  type = "button",
  ...rest
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full border-[1.5px] leading-none whitespace-nowrap select-none",
    "transition-[transform,filter,background-color,border-color] duration-[120ms] ease-out",
    "focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
    display ? "font-display font-semibold uppercase tracking-[0.04em]" : "font-bold",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
  );
  const content = (
    <>
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {content}
    </button>
  );
}
