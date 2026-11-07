import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  flagsCount?: number;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function RiskBadge({
  level,
  flagsCount,
  size = "md",
  showIcon = true,
  className,
}: RiskBadgeProps) {
  const config = {
    low: {
      label: "Низкий риск",
      icon: CheckCircle2,
      style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    },
    medium: {
      label: "Средний риск",
      icon: AlertTriangle,
      style: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    },
    high: {
      label: "Высокий риск",
      icon: ShieldAlert,
      style: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    },
  }[level];

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border inline-flex items-center gap-1.5",
        config.style,
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs sm:text-sm px-2.5 py-1",
        className
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      <span>{config.label}</span>
      {flagsCount !== undefined && flagsCount > 0 && (
        <span className="ml-1 rounded-full bg-current/15 px-1.5 text-[10px] font-bold">
          {flagsCount}
        </span>
      )}
    </Badge>
  );
}
