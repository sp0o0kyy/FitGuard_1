import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VolumePoint {
  date: string;
  volume: number;
  title?: string;
  wellness?: number;
}

interface VolumeChartProps {
  data: VolumePoint[];
  className?: string;
  title?: string;
}

export function VolumeChart({
  data,
  className,
  title = "Тренировочный объём",
}: VolumeChartProps) {
  const volumes = data.map((d) => d.volume);
  const avg = volumes.length ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;
  const total = volumes.length ? Math.round(volumes.reduce((a, b) => a + b, 0)) : 0;

  return (
    <Card className={cn(className)}>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Суммарный тоннаж (кг) по тренировкам
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Итого: <b className="text-foreground">{total.toLocaleString("ru-RU")} кг</b></span>
            <span>•</span>
            <span>В среднем: <b className="text-foreground">{avg.toLocaleString("ru-RU")} кг</b></span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-2">
        {data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
            Нет данных по объёму
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  unit=" кг"
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as VolumePoint;
                    return (
                      <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
                        <p className="font-semibold text-foreground">
                          {d.date} — {d.title}
                        </p>
                        <p className="text-primary font-bold">
                          {Math.round(d.volume).toLocaleString("ru-RU")} кг
                        </p>
                        {d.wellness && (
                          <p className="text-muted-foreground">Самочувствие {d.wellness}/10</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.wellness && entry.wellness <= 4 ? "#f87171" : "#2563eb"}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
