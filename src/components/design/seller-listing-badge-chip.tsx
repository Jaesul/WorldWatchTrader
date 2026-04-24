import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";

import { WorldOrbIcon } from "@/components/icons/world-orb";
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

export function BadgeChip({ badge }: { badge: ListingBadge }) {
  if (badge === "world-verified") {
    return (
      <Badge
        variant="brand"
        className="size-6 rounded-full p-0 text-white"
        aria-label="World Verified"
      >
        <WorldOrbIcon className="size-3.5" />
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
