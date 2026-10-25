import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-deep border border-transparent",
  secondary:
    "bg-surface text-trust border border-trust hover:bg-trust-wash",
  tertiary:
    "bg-transparent text-faint border border-transparent hover:bg-well focus-visible:underline",
};

export function buttonClasses(variant: ButtonVariant = "primary"): string {
  return `inline-flex min-h-11 items-center justify-center md:min-h-10 gap-2 rounded-md px-4 text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Mencegah klik ganda dan memberi tahu pembaca layar. */
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "Memproses…",
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses(variant)} ${className}`}
      {...rest}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
  /** Tautan eksternal: <a> biasa, dibuka di tab baru. */
  external?: boolean;
  /** <a> biasa di tab yang sama (mis. tel:, mailto:). */
  native?: boolean;
}

export function ButtonLink({
  href,
  variant = "primary",
  external = false,
  native = false,
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = `${buttonClasses(variant)} ${className}`;
  if (native) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
