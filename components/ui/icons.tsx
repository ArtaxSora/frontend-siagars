/** Ikon inline kecil (dekoratif; label teks selalu menyertai). */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 10.5 4 4 8-9" />
  </Base>
);

export const AlertIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 3 2.5 16.5h15L10 3Z" />
    <path d="M10 8.5v3.5M10 14.5h.01" />
  </Base>
);

export const CrossIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 5 10 10M15 5 5 15" />
  </Base>
);

export const QuestionIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M7.9 8a2.2 2.2 0 1 1 3.3 1.9c-.8.5-1.2 1-1.2 1.8M10 14.3h.01" />
  </Base>
);

export const FlaskIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 3h4M8.5 3v5L4 16a1 1 0 0 0 .9 1.5h10.2A1 1 0 0 0 16 16l-4.5-8V3" />
    <path d="M6 12.5h8" />
  </Base>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 2.5 4 5v4.5c0 4 2.6 6.7 6 8 3.4-1.3 6-4 6-8V5l-6-2.5Z" />
    <path d="m7.5 10 2 2 3.5-4" />
  </Base>
);

export const PlugIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0V7ZM10 15v3" />
  </Base>
);

export const PhoneIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 3h3l1.5 4-2 1.3a9 9 0 0 0 4.2 4.2L13 10.5l4 1.5v3a2 2 0 0 1-2 2A12 12 0 0 1 3 5a2 2 0 0 1 2-2Z" />
  </Base>
);

export const RouteIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="15" r="2" />
    <circle cx="15" cy="5" r="2" />
    <path d="M7 15h5.5a2.5 2.5 0 0 0 0-5h-5a2.5 2.5 0 0 1 0-5H13" />
  </Base>
);

export const PinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
    <circle cx="10" cy="8" r="2" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13 13 4 4" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 6v4.5l3 1.5" />
  </Base>
);
