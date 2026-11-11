import Image from "next/image";

export function SiteLogo() {
  return (
    <span className="inline-flex h-11 w-7 shrink-0 items-center justify-center overflow-hidden" aria-hidden="true">
    <Image
      src="/siagars-logo.png"
      alt=""
      width={44}
      height={46}
      className="h-11 w-[42px] max-w-none shrink-0 object-contain"
    />
    </span>
  );
}
