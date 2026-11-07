import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InviteCodeCardProps {
  code: string;
  isActive?: boolean;
  usesCount?: number;
  maxUses?: number | null;
  expiresAt?: string | Date | null;
  className?: string;
  onDeactivate?: () => void;
  showManage?: boolean;
}

export function InviteCodeCard({
  code,
  isActive = true,
  usesCount = 0,
  maxUses,
  expiresAt,
  className,
  onDeactivate,
  showManage = false,
}: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Код скопирован в буфер обмена");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const expDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card className={cn("overflow-hidden border transition-all hover:shadow-md", className)}>
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Код подключения
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[11px]",
              isActive
                ? "border-emerald-300 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-muted text-muted-foreground"
            )}
          >
            {isActive ? "Активен" : "Неактивен"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 font-mono">
          <span className="text-lg sm:text-xl font-bold tracking-widest text-primary truncate select-all">
            {code}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={copy}
            className="shrink-0 h-9 px-3 gap-1.5 text-xs font-sans font-medium"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Копировать
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
          <span>
            Использован: <b>{usesCount}</b> {maxUses ? `/ ${maxUses}` : ""} раз
          </span>
          {expDate && <span>Действует до: {expDate}</span>}
        </div>

        {showManage && isActive && onDeactivate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDeactivate}
            className="w-full text-xs text-destructive hover:text-destructive h-8"
          >
            Деактивировать код
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
