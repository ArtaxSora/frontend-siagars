import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OperatorShell } from "@/features/operator/operator-shell";

export const metadata: Metadata = {
  title: "Panel operator",
  robots: { index: false, follow: false },
};

export default function OperatorPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OperatorShell>{children}</OperatorShell>;
}
