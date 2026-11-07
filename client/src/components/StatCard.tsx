import { Card, CardContent } from "@/components/ui/card";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {icon && (
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "font-semibold",
                trend.value > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : trend.value < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}
            </span>
            {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
