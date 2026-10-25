import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-10">
      <h1 className="text-[28px] font-bold leading-9">Halaman tidak ditemukan</h1>
      <p className="text-muted">
        Tautan mungkin salah atau halaman sudah dipindahkan.
      </p>
      <ButtonLink href="/">Kembali ke beranda</ButtonLink>
    </div>
  );
}
