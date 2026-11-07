import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WellnessSleepPoint {
  date: string;
  workoutId: number;
  wellness: number;
  sleepHours: number;
  totalVolume: number;
  heartRate?: number | null;
  riskLevel?: string;
  title?: string;
}

interface SleepWellnessChartProps {
  data: WellnessSleepPoint[];
  className?: string;
  title?: string;
}

export function SleepWellnessChart({
  data,
  className,
  title = "Сон и самочувствие",
}: SleepWellnessChartProps) {
  const avgSleep =
    data.length > 0 ? (data.reduce((a, b) => a + b.sleepHours, 0) / data.length).toFixed(1) : "-";
  const avgWellness =
    data.length > 0 ? (data.reduce((a, b) => a + b.wellness, 0) / data.length).toFixed(1) : "-";

  return (
    <Card className={cn(className)}>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Часы сна (столбцы) и самочувствие 1–10 (линия) по дням тренировок
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Средний сон: <b className="text-foreground">{avgSleep} ч</b></span>
            <span>•</span>
            <span>Среднее самочувствие: <b className="text-foreground">{avgWellness}/10</b></span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-2">
        {data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
            Нет данных за выбранный период
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="sleep"
                  domain={[0, 12]}
                  tick={{ fontSize: 11 }}
                  unit=" ч"
                  orientation="left"
                />
                <YAxis
                  yAxisId="wellness"
                  domain={[0, 10]}
                  tick={{ fontSize: 11 }}
                  orientation="right"
                  unit="/10"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as WellnessSleepPoint;
                    return (
                      <div className="rounded-lg border bg-popover p-2.5 text-xs shadow-md space-y-1">
                        <p className="font-semibold text-foreground">
                          {d.date} — {d.title}
                        </p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                          Сон: {d.sleepHours} ч
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Самочувствие: {d.wellness}/10
                        </p>
                        {d.heartRate && (
                          <p className="text-muted-foreground">Пульс: {d.heartRate} уд/мин</p>
                        )}
                        <p className="text-muted-foreground">
                          Объём: {Math.round(d.totalVolume).toLocaleString("ru-RU")} кг
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="sleep"
                  dataKey="sleepHours"
                  name="Сон, ч"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="wellness"
                  type="monotone"
                  dataKey="wellness"
                  name="Самочувствие"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "white", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
