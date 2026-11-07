import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RiskFlagItem {
  code: string;
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
}

interface RiskFlagsListProps {
  flags: RiskFlagItem[];
  className?: string;
  emptyText?: string;
}

export function RiskFlagsList({
  flags,
  className,
  emptyText = "Отклонений не выявлено — всё в пределах нормы",
}: RiskFlagsListProps) {
  if (flags.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground", className)}>
        {emptyText}
      </div>
    );
  }

  const icons = {
    low: AlertCircle,
    medium: AlertTriangle,
    high: ShieldAlert,
  };

  const borderStyles = {
    low: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30",
    medium: "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30",
    high: "border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30",
  };

  const severityLabels = { low: "Низкая важность", medium: "Средняя важность", high: "Высокая важность" };

  return (
    <div className={cn("space-y-2.5", className)}>
      {flags.map((f, i) => {
        const Icon = icons[f.severity];
        return (
          <Card key={`${f.code}-${i}`} className={cn("border transition-all", borderStyles[f.severity])}>
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-background p-1.5 shadow-xs shrink-0 text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold leading-tight">{f.title}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {severityLabels[f.severity]}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
