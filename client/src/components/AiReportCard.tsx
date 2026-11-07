import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./RiskBadge";
import { RiskFlagsList, type RiskFlagItem } from "./RiskFlagsList";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Moon,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  RefreshCw,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export interface ExerciseDeltaData {
  exercise: string;
  currentMax: number;
  prevMax: number | null;
  deltaKg: number | null;
  deltaPercent: number | null;
  trend: "up" | "down" | "same" | "new";
  isPR?: boolean;
}

export interface AiReportData {
  id?: number;
  workoutLogId?: number;
  summary: string;
  strengthProgressAnalysis: string;
  sleepWellnessCorrelation: string;
  anomaliesAndRisks: string;
  conclusions: string;
  recommendations: string;
  riskLevel: "low" | "medium" | "high";
  riskFlags: string | RiskFlagItem[];
  progressPerExercise: string | Record<string, ExerciseDeltaData>;
  modelUsed: string;
  generationMs?: number;
  createdAt?: string | Date;
}

interface AiReportCardProps {
  report: AiReportData;
  workoutId?: number;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
}

function parseFlags(raw: string | RiskFlagItem[]): RiskFlagItem[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function parseDeltas(
  raw: string | Record<string, ExerciseDeltaData>
): Record<string, ExerciseDeltaData> {
  if (typeof raw !== "string") return raw && typeof raw === "object" ? (raw as any) : {};
  try {
    const p = JSON.parse(raw);
    return typeof p === "object" && p !== null && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}

function renderList(text: string) {
  const items = text
    .split(/\n+/)
    .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
  if (items.length <= 1) return <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{text}</p>;
  return (
    <ul className="space-y-1.5 text-xs sm:text-sm">
      {items.map((it, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed">{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function AiReportCard({
  report,
  workoutId,
  onRefresh,
  compact = false,
  className,
}: AiReportCardProps) {
  const flags = parseFlags(report.riskFlags);
  const deltas = parseDeltas(report.progressPerExercise);
  const deltaEntries = Object.values(deltas);

  const reanalyze = trpc.trainee.reanalyzeWorkout.useMutation({
    onSuccess: () => {
      toast.success("ИИ-анализ обновлён");
      onRefresh?.();
    },
    onError: (e) => toast.error(`Ошибка ИИ: ${e.message}`),
  });

  return (
    <Card className={cn("overflow-hidden border-primary/25 shadow-sm", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-sm">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg">ИИ-доклад по тренировке</CardTitle>
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500 hidden sm:inline" />
              </div>
              <p className="text-xs text-muted-foreground">
                Автоматический анализ динамики, сна и рисков
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={report.riskLevel} flagsCount={flags.length} />
            {workoutId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => reanalyze.mutate({ workoutId })}
                disabled={reanalyze.isPending}
                className="text-xs h-8"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", reanalyze.isPending && "animate-spin")} />
                Пересчитать
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-primary" />
            <span>Сводка</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed">{report.summary}</p>
        </section>

        {deltaEntries.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Динамика по упражнениям</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {deltaEntries.map((d) => {
                const isUp = d.trend === "up";
                const isDown = d.trend === "down";
                const isNew = d.trend === "new";
                return (
                  <div
                    key={d.exercise}
                    className={cn(
                      "rounded-lg border p-2.5 sm:p-3 text-xs flex items-center justify-between gap-2 transition-all",
                      isUp && "border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30",
                      isDown && "border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30",
                      !isUp && !isDown && "bg-muted/40"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{d.exercise}</p>
                      <p className="text-muted-foreground">
                        {d.prevMax !== null ? `было ${d.prevMax} кг → ` : ""}
                        <span className="font-bold text-foreground">{d.currentMax} кг</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-bold">
                      {isNew && <Badge variant="secondary" className="text-[10px]">NEW</Badge>}
                      {isUp && (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                          <ArrowUp className="h-3.5 w-3.5" />
                          {d.deltaKg !== null && `+${d.deltaKg} кг`}
                        </span>
                      )}
                      {isDown && (
                        <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                          <ArrowDown className="h-3.5 w-3.5" />
                          {d.deltaKg} кг
                        </span>
                      )}
                      {!isUp && !isDown && !isNew && (
                        <span className="inline-flex items-center text-muted-foreground">
                          <Minus className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>Анализ силовых показателей</span>
          </div>
          {renderList(report.strengthProgressAnalysis)}
        </section>

        <section className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Moon className="h-3.5 w-3.5 text-primary" />
            <span>Взаимосвязь сна, самочувствия и результатов</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">{report.sleepWellnessCorrelation}</p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Индикаторы риска и отклонения</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {flags.length > 0 ? `${flags.length} сигнала(ов)` : "сигналов нет"}
            </span>
          </div>
          <RiskFlagsList flags={flags} />
          {report.anomaliesAndRisks && !report.anomaliesAndRisks.startsWith("•") && (
            <p className="text-xs text-muted-foreground italic leading-relaxed pt-1">
              {report.anomaliesAndRisks}
            </p>
          )}
        </section>

        {!compact && (
          <>
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Ключевые выводы ИИ</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
                {renderList(report.conclusions)}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Рекомендации для тренера</span>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                {renderList(report.recommendations)}
              </div>
            </section>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" />
            <span>Модель: <code className="rounded bg-muted px-1 py-0.5">{report.modelUsed}</code></span>
          </div>
          {report.generationMs !== undefined && report.generationMs > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>~{(report.generationMs / 1000).toFixed(1)} с</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
