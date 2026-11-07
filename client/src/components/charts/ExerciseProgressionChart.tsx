import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressPoint {
  date: string;
  weight: number;
  volume: number;
  reps: number;
}

interface ExerciseProgressionChartProps {
  series: Record<string, ProgressPoint[]>;
  prs?: Record<string, number>;
  className?: string;
  title?: string;
}

export function ExerciseProgressionChart({
  series,
  prs,
  className,
  title = "Прогресс силовых показателей",
}: ExerciseProgressionChartProps) {
  const exercises = Object.keys(series);
  const [selected, setSelected] = useState<string>(exercises[0] || "");
  const currentKey = selected && series[selected] ? selected : exercises[0] || "";
  const data = (currentKey && series[currentKey]) || [];
  const currentPR = prs && currentKey ? prs[currentKey] : null;

  const weights = data.map((d) => d.weight).filter((w) => w > 0);
  const minW = weights.length ? Math.max(0, Math.min(...weights) - 5) : 0;
  const maxW = weights.length ? Math.max(...weights) + 5 : 100;
  const first = weights[0];
  const last = weights[weights.length - 1];
  const delta = first !== undefined && last !== undefined ? Number((last - first).toFixed(1)) : null;

  return (
    <Card className={cn(className)}>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Рабочий максимум веса (кг) по каждой тренировке
            </p>
          </div>
          {exercises.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={currentKey} onValueChange={setSelected}>
                <SelectTrigger className="w-[200px] text-xs h-9">
                  <SelectValue placeholder="Выберите упражнение" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((e) => (
                    <SelectItem key={e} value={e} className="text-xs">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
        {data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
            Нет данных по силовым для этого упражнения
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {currentPR && (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <Trophy className="h-3.5 w-3.5" />
                  Рекорд: {currentPR} кг
                </span>
              )}
              {delta !== null && (
                <span
                  className={cn(
                    "font-medium",
                    delta > 0 && "text-emerald-600 dark:text-emerald-400",
                    delta < 0 && "text-rose-600 dark:text-rose-400"
                  )}
                >
                  Динамика за период: {delta > 0 ? "+" : ""}
                  {delta} кг
                </span>
              )}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[minW, maxW]} tick={{ fontSize: 11 }} unit=" кг" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as ProgressPoint;
                      return (
                        <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
                          <p className="font-semibold text-foreground">{d.date}</p>
                          <p className="text-primary font-bold">{d.weight} кг</p>
                          <p className="text-muted-foreground">
                            {d.reps} повт. • объём {Math.round(d.volume)} кг
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Рабочий вес, кг"
                    stroke="var(--color-primary, #2563eb)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
