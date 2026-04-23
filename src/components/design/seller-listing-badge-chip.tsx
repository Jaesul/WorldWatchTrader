import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Badge as ListingBadge } from "@/lib/design/data";

const BADGE_META: Record<
  ListingBadge,
  {
    label: string;
    icon?: LucideIcon;
    variant: "brand" | "outline";
    className?: string;
  }
> = {
  "world-verified": { label: "World Verified", variant: "brand" },
  "power-seller": {
    label: "Power Seller",
    icon: Star,
    variant: "outline",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
};

export function OrbIcon({
  className,
  inverted,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const stroke = inverted ? "#ffffff" : "currentColor";
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M9.96783 18.9357C14.9206 18.9357 18.9357 14.9206 18.9357 9.96783C18.9357 5.01503 14.9206 1 9.96783 1C5.01503 1 1 5.01503 1 9.96783C1 14.9206 5.01503 18.9357 9.96783 18.9357Z"
        stroke={stroke}
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M10.0406 10.5109C11.5667 10.5109 12.8038 9.27372 12.8038 7.74762C12.8038 6.22152 11.5667 4.98438 10.0406 4.98438C8.51449 4.98438 7.27734 6.22152 7.27734 7.74762C7.27734 9.27372 8.51449 10.5109 10.0406 10.5109Z"
        stroke={stroke}
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M7.07422 13.9844H12.9767"
        stroke={stroke}
        strokeWidth="2"
        strokeMiterlimit="10"
      />
    </svg>
  );
}

export function BadgeChip({ badge }: { badge: ListingBadge }) {
  if (badge === "world-verified") {
    return (
      <Badge
        variant="brand"
        className="size-6 rounded-full p-0 text-white"
        aria-label="World Verified"
      >
        <OrbIcon className="size-3.5" inverted />
      </Badge>
    );
  }
  const { className, icon: Icon, label, variant } = BADGE_META[badge];
  return (
    <Badge
      variant={variant}
      className={cn(
        "h-6 gap-1 rounded-full px-2.5 text-[10px] font-semibold",
        className,
      )}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {label}
    </Badge>
  );
}

export function SellerInitials({ name }: { name: string }) {
  const parts = name.split(" ");
  return <>{(parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()}</>;
}
