"use client";
import { createContext, Suspense, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AiAssistant } from "./ai-assistant";
import { CrossIcon } from "@/components/ui/icons";

const AssistantContext = createContext<(() => void) | null>(null);
export function ChatIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H4l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M8 10h8M8 14h5" /></svg>;
}
export function AssistantTrigger({ children = "Tanya asisten", className = "" }: { children?: ReactNode; className?: string }) {
  const open = useContext(AssistantContext);
  return <button type="button" onClick={() => open?.()} className={className} aria-haspopup="dialog" aria-controls="assistant-panel">{children}</button>;
}
function RouteListener({ close }: { close: () => void }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) { close(); previous.current = pathname; }
  }, [pathname, close]);
  return null;
}
export function AssistantProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const show = () => { setMounted(true); setOpen(true); };
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  return (
    <AssistantContext.Provider value={show}>
      {children}
      <AssistantTrigger className="assistant-launcher"><ChatIcon /><span>Tanya Asisten AI</span></AssistantTrigger>
      <dialog ref={dialog} id="assistant-panel" aria-labelledby="assistant-title" className="assistant-panel" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="assistant-panel-inner">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div><h2 id="assistant-title" className="text-lg font-bold">Asisten SiagaRS</h2><p className="mt-1 text-xs text-muted">Bantu cari layanan dan lokasi rumah sakit</p></div>
            <button type="button" autoFocus onClick={() => setOpen(false)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-well" aria-label="Tutup asisten"><CrossIcon className="h-5 w-5" /></button>
          </header>
          {mounted && <Suspense fallback={<p className="p-5 text-muted">Memuat asisten…</p>}><AiAssistant compact /></Suspense>}
        </div>
      </dialog>
      <Suspense fallback={null}><RouteListener close={() => setOpen(false)} /></Suspense>
    </AssistantContext.Provider>
  );
}
