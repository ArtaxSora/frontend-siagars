import type { ReactNode } from "react";
import type { ReferralStatus } from "@/lib/contracts/types";
import { REFERRAL_STATUS_LABEL } from "@/lib/contracts/labels";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
} from "@/components/ui/icons";

const STYLE: Record<ReferralStatus, string> = {
  submitted: "bg-trust-wash text-trust border-line-strong",
  verified: "bg-trust-wash text-trust border-line-strong",
  searching: "bg-warn-bg text-warn-fg border-warn-line",
  confirmed: "bg-ok-bg text-ok-fg border-ok-line",
  completed: "bg-ok-bg text-ok-fg border-ok-line",
  rejected: "bg-bad-bg text-bad-fg border-bad-line",
};

const ICON: Record<ReferralStatus, ReactNode> = {
  submitted: <ClockIcon />,
  verified: <CheckIcon />,
  searching: <AlertIcon />,
  confirmed: <CheckIcon />,
  completed: <CheckIcon />,
  rejected: <CrossIcon />,
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[13px] font-bold leading-4 ${STYLE[status]}`}
    >
      {ICON[status]}
      {REFERRAL_STATUS_LABEL[status]}
    </span>
  );
}
